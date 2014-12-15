(function(){
  var http = require("http"),
      fs = require("fs"),
      path = require("path"),
      qs = require("querystring"),
      url = require("url");

  var chokidar = require('chokidar');
  var argv = require('minimist')(process.argv.slice(2));

  var EventStream = require("./event-stream.js");
  var communication = require("./communication.js");

  var streams = {},
      PORT = argv.port || 55555;

  function sendFile(type, file, content, params) {
    params.stream.sendMessage(
      type + '/' + encodeURIComponent(file) + '/' + encodeURIComponent(content)
    );
  }

  function readAndSendFile(type, file, params, count) {
    count = count || 0;
    if(count > 10) {
      return; // avoid inifinite loops when file is permanently busy
    }
    fs.readFile(path.join(params.project.path, file), { encoding: 'utf-8' }, function(err, content){
      if(err) {
        if(err.code === 'EBUSY') {
          setTimeout(readAndSendFile.bind(this, type, file, params, count + 1), 10);
        } else {
          console.error(err);
        }
      } else {
        sendFile(type, file, content, params);
      }
    });
  }

  function processFileForStream(file, content, params) {
    var type = path.extname(file).replace('.', '');
    if(type === 'htm' || type === 'php') {
      type = 'html';
    }
    if(!content) {
      readAndSendFile(type, file, params);
    } else {
      sendFile(type, file, content, params);
    }
  }

  function processFile(absolutePathToFile, content) {
    for(var connectionId in streams) {
      var params = streams[connectionId];
      if(absolutePathToFile.indexOf(params.project.path) === 0) {
        var file = path.relative(params.project.path, absolutePathToFile);
        if(file in params.files) {
          processFileForStream(file, content, params);
        }
      }
    }
  }

  function sendOk(response) {
    response.writeHead(200, {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*"
    });
    response.end("OK\n");
  }

  function send404(response) {
    response.writeHead(404, {
      "Access-Control-Allow-Origin": "*"
    });
    response.end();
  }

  /**
   * Receives request POST data containing new version of a file
   * @param  {Object} request
   * @param  {Object} response
   */
  function handlePostChange(request, response) {
    var post = '';
    request.on('data', function (data) {
      post += data;
    });
    request.on('end', function () {
      sendOk(response);
      post = qs.parse(post);
      processFile(post.file, post.content);
    });
  }

  function doInitStream(request, response, parsedUrl, project) {
    var es, relativeUrl, params;

    es = new EventStream(request, response, project);
    relativeUrl = parsedUrl.query.url || '';
    params = {
      stream: es,
      files: [],
      project: project
    };

    // if we are at the root or looking for folder index try several possibilities
    if(!relativeUrl || relativeUrl.match(/\/$/)) {
      ['index.html', 'index.htm', 'default.html', 'default.htm'].some(function(file){
        if(fs.existsSync(path.join(params.project.path, relativeUrl, file))) {
          params.files[path.join(relativeUrl, file)] = Date.now();
          return true;
        }
      });
    } else {
      params.files[relativeUrl] = Date.now();
    }

    params.watcher = chokidar.watch(params.project.path, {
      ignored: /[\/\\]\.|.*?node_modules.*?/,
      usePolling: false,
      persistent: false
    }).on('change', function(file){
      file = path.relative(params.project.path, file);
      if(file in params.files) {
        // don't allow too frequent updates
        if(Date.now() - params.files[file] > 1000 / 30) {
          communication.write(file, 'change');
          processFileForStream(file, null, params);
        }
        params.files[file] = Date.now();
      }
    });
    
    streams[es.connectionId] = params;
    es.once('destroy', function() {
      params.watcher.close();
      delete streams[es.connectionId];
    });
  }

  function initEventStream(request, response) {
    var parsedUrl = url.parse(request.url, true),
        host = parsedUrl.query.host;

    // If this isn't a local file we ask C++ to get us project decription
    if(host) {
      communication.request("projectByHost", { host: host }, function(project){
        if(project) {
          doInitStream(request, response, parsedUrl, project);
        } else {
          return send404(response);
        }
      });
    } else { // for local files create fake project
      var project = {
        name: parsedUrl.query.url,
        path: parsedUrl.query.basePath || process.cwd()
      };

      // On windows paths from browsers may come with wrong delimiters
      if (process.platform === 'win32') {
        project.path = project.path.replace(/^\/(\w:)/, '$1').replace(/\//g, '\\');
      }

      doInitStream(request, response, parsedUrl, project);
    }
  }

  function handleWatchAddRemove(request, response, handler) {
    var parsedUrl = url.parse(request.url, true);
    var connectionId = parsedUrl.query.connectionId,
        file = parsedUrl.query.file;

    if(connectionId && file) {
      response.writeHead(200, {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      });
      var params = streams[connectionId];

      // need to normalize path (removing ../ and ./ from it)
      file = path.normalize(file);

      // On windows paths from browsers may come with wrong delimiters
      if (process.platform === 'win32') {
        file = file.replace(/^[\/\\](\w:)/, '$1');
      }
      
      // if file is opened via file:// protocol in browser we will get
      // it's full path, and have to adjust path to be relative to baseDir
      if(file.indexOf(params.project.path) > -1) {
        file = path.relative(params.project.path, file);
      } else {
        // Assuming that static resources are served from params.project.path we
        // convert absolute path to relative by simply trimming first slash
        file = file.replace(/^[\/\\]+/, '');
      }

      handler(params, file);
      sendOk(response);
    } else {
      response.end();
    }
  }

  http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true),
        pathname = parsedUrl.pathname;

    if(pathname === '/events') {
      initEventStream(request, response);
    } else if(pathname === '/status') {
      sendOk(response);
    } else if(pathname === '/live.js') {
        response.writeHead(200, {
          "Content-Type": "text/javascript",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(fs.readFileSync(path.join(__dirname, '..', 'js', 'dist', 'main.js')));
    } else if(pathname === '/static') {
        response.writeHead(200, {
          "Content-Type": "text/css",
          "Access-Control-Allow-Origin": "*"
        });
        response.end(fs.readFileSync(parsedUrl.query.file));
    } else if(pathname === '/watch') {
      handleWatchAddRemove(request, response, function(params, file){
        // avoid double watching of a file
        if(!(file in params.files)) {
          params.files[file] = Date.now();
        }
        communication.write('Started watching ' + file);
      });
    } else if(pathname === '/stopWatch') {
      handleWatchAddRemove(request, response, function(params, file){
        delete params.files[file];
        communication.write('Stopped watching ' + file);
      });
    } else if(pathname === '/changed') {
      if (request.method === 'POST') {
        handlePostChange(request, response);
      } else {
        if(parsedUrl.query.file) {
          processFile(parsedUrl.query.file, parsedUrl.query.content);
        }
        response.end();
      }
    } else {
      send404(response);
    }

  }).listen(PORT);

  communication.on("remove", function(project){
    for(var key in streams) {
      var params = streams[key];
      if(params.project.guid === project.guid) {
        params.stream.response.end();
      }
    }
  });

  // This heartbeat is needed in case parent process crashes.
  // It works as follows - a "heartbeat" request is sent,
  // and a timer begins to end this process. If we get response
  // before the timer ends then all is well and we reset timer
  // and schedule next heartbeat in some time (initially 3 sec)
  var heartbeatTimeoutId;
  function heartbeat() {
    communication.request("heartbeat", null, function(){
      clearTimeout(heartbeatTimeoutId);
      setTimeout(heartbeat, 3000);
    });
    heartbeatTimeoutId = setTimeout(function(){
      process.exit(1);
    }, 500);
  }

  // but we don't want it when launching server by hand
  if(!argv.standalone) {
    heartbeat();  
  }

  communication.write('Live HTML Server started at port ' + PORT, 'online');
})();
