(function(){
  var generateGuid = require("./guid.js");
  var EventEmitter = require('events').EventEmitter;

  // Allowing other modules to subscribe to events
  var communication = module.exports = new EventEmitter();

  var requestCallbackMap = {};

  // writing to C++ app via stdout
  var write = communication.write = function(message, type) {
    if(type == null) {
      type = "info";
    }
    var data = {
      timestamp: new Date(),
      message: message,
      type: type
    };
    var stream = message.type === "error" ? process.stderr : process.stdout;

    // TODO Probably need something better than "\n\n" as splitter
    // or may be need another communication protocol altogether
    stream.write(JSON.stringify(data) + "\n\n", 'utf-8');
  };

  // dummy RPC implementation via stdin / stdout
  var request = communication.request =  function(name, parameters, callback) {
    var guid = generateGuid();
    requestCallbackMap[guid] = callback;
    write({
      guid: guid,
      name: name,
      parameters: parameters || {}
    }, "request");
  };

  // needed so we would read strings and not bytes
  process.stdin.setEncoding('utf-8');

  // receiving data from C++ app
  process.stdin.on('readable', function(chunk) {
    chunk = process.stdin.read();
    if (chunk !== null) {
      var message = JSON.parse(chunk);
      switch(message.type) {
        case "response":
          if(message.guid) {
            requestCallbackMap[message.guid](message.data);
            delete requestCallbackMap[message.guid];
          } else {
            console.error("No guid in message:\n" + chunk);
          }
          break;
        case "remove":
          communication.emit("remove", message.data);
          break;
      }
    }
  });
})();
