/*!
 * live-html-node - v0.2.0 - 2014-05-20
 * Copyright (c) 2014 Dmitriy Kubyshkin <dmitriy@kubyshkin.ru> 
 *
 * This software is protected by copyright laws and international copyright 
 * treaties, as well as other intellectual property laws and treaties and 
 * contains confidential information and trade secrets.
 *
 * Any redistribution, modification or reverse engineering of this software
 * without explicit permission from copyright holder is considered a violation
 * of said copyright laws and international copyright treaties.
 */
!function(){function a(a,b,c,d){d.stream.sendMessage(a+"/"+encodeURIComponent(b)+"/"+encodeURIComponent(c))}function b(c,d,e,f){f=f||0,f>10||m.readFile(n.join(e.project.path,d),{encoding:"utf-8"},function(g,h){g?"EBUSY"===g.code?setTimeout(b.bind(this,c,d,e,f+1),10):console.error(g):a(c,d,h,e)})}function c(c,d,e){var f=n.extname(c).replace(".","");("htm"===f||"php"===f)&&(f="html"),d?a(f,c,d,e):b(f,c,e)}function d(a,b){for(var d in u){var e=u[d];if(0===a.indexOf(e.project.path)){var f=n.relative(e.project.path,a);f in e.files&&c(f,b,e)}}}function e(a){a.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"*"}),a.end("OK\n")}function f(a){a.writeHead(404,{"Access-Control-Allow-Origin":"*"}),a.end()}function g(a,b){var c="";a.on("data",function(a){c+=a}),a.on("end",function(){e(b),c=o.parse(c),d(c.file,c.content)})}function h(a,b,d,e){var f,g,h;f=new s(a,b,e),g=d.query.url||"",h={stream:f,files:[],project:e},!g||g.match(/\/$/)?["index.html","index.htm","default.html","default.htm"].some(function(a){return m.existsSync(n.join(h.project.path,g,a))?(h.files[n.join(g,a)]=Date.now(),!0):void 0}):h.files[g]=Date.now(),h.watcher=q.watch(h.project.path,{ignored:/[\/\\]\.|.*?node_modules.*?/,usePolling:!1,persistent:!1}).on("change",function(a){a=n.relative(h.project.path,a),a in h.files&&(Date.now()-h.files[a]>1e3/30&&(t.write(a,"change"),c(a,null,h)),h.files[a]=Date.now())}),u[f.connectionId]=h,f.once("destroy",function(){h.watcher.close(),delete u[f.connectionId]})}function i(a,b){var c=p.parse(a.url,!0),d=c.query.host;if(d)t.request("projectByHost",{host:d},function(d){return d?void h(a,b,c,d):f(b)});else{var e={name:c.query.url,path:c.query.basePath||process.cwd()};"win32"===process.platform&&(e.path=e.path.replace(/^\/(\w:)/,"$1").replace(/\//g,"\\")),h(a,b,c,e)}}function j(a,b,c){var d=p.parse(a.url,!0),f=d.query.connectionId,g=d.query.file;if(f&&g){b.writeHead(200,{"Content-Type":"text/plain","Access-Control-Allow-Origin":"*"});var h=u[f];g=n.normalize(g),"win32"===process.platform&&(g=g.replace(/^[\/\\](\w:)/,"$1")),g=g.indexOf(h.project.path)>-1?n.relative(h.project.path,g):g.replace(/^[\/\\]+/,""),c(h,g),e(b)}else b.end()}function k(){t.request("heartbeat",null,function(){clearTimeout(w),setTimeout(k,3e3)}),w=setTimeout(function(){process.exit(1)},500)}var l=require("http"),m=require("fs"),n=require("path"),o=require("querystring"),p=require("url"),q=require("chokidar"),r=require("minimist")(process.argv.slice(2)),s=require("./event-stream.js"),t=require("./communication.js"),u={},v=r.port||55555;l.createServer(function(a,b){var c=p.parse(a.url,!0),h=c.pathname;"/events"===h?i(a,b):"/status"===h?e(b):"/live.js"===h?(b.writeHead(200,{"Content-Type":"text/javascript","Access-Control-Allow-Origin":"*"}),b.end(m.readFileSync(n.join(__dirname,"..","js","dist","main.js")))):"/static"===h?(b.writeHead(200,{"Content-Type":"text/css","Access-Control-Allow-Origin":"*"}),b.end(m.readFileSync(c.query.file))):"/watch"===h?j(a,b,function(a,b){b in a.files||(a.files[b]=Date.now()),t.write("Started watching "+b)}):"/stopWatch"===h?j(a,b,function(a,b){delete a.files[b],t.write("Stopped watching "+b)}):"/changed"===h?"POST"===a.method?g(a,b):(c.query.file&&d(c.query.file,c.query.content),b.end()):f(b)}).listen(v),t.on("remove",function(a){for(var b in u){var c=u[b];c.project.guid===a.guid&&c.stream.response.end()}});var w;r.standalone||k(),t.write("Live HTML Server started at port "+v,"online")}();