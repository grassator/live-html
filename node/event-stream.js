 (function(){
  var EventEmitter = require('events').EventEmitter;

  var url = require("url"),
      util = require("util"),
      generateGuid = require("./guid.js");

  var communication = require("./communication.js");

  function detectBrowser(request) {
    var ua = request.headers['user-agent'],
        browser;
    if(/firefox/i.test(ua)) {
      browser = 'firefox';
    } else if(/chrome/i.test(ua)) {
      browser = 'chrome';
      if(/canary/i.test(ua)) {
        browser = 'chrome-canary';
      }
    } else if(/safari/i.test(ua)) {
      browser = 'safari';
    } else if(/msie|trident/i.test(ua)) {
      browser = 'msie';
    } else {
      browser = 'unknown';
    }
    return browser;
  }

  function EventStream(request, response, project) {
    this.connectionId = generateGuid();

    this.browser = detectBrowser(request);
    this.request = request;
    this.response = response;
    this.project = project;

    this.relevantFiles = [];

    // several functions have to be run withing current object's context
    ['destroy', 'sendMessage'].forEach(function(method) {
      this[method] = this[method].bind(this);
    }, this);

    this.heartbeatInterval = setInterval(this.sendMessage, this.heartbeatTimeout);

    this.handleRequest();

    communication.write({
      browser: this.browser,
      connectionId: this.connectionId,
      project: this.project
    }, 'connect');
  }

  util.inherits(EventStream, EventEmitter);

  var p = EventStream.prototype;

  /**
   * Many browsers timeout when something isn't sent during this interval
   * @type {Number}
   */
  p.heartbeatTimeout = 5000;

  /**
   * Might be used to track which events are already sent to the user
   * @type {Number}
   */
  p.lastEventId = 0;

  p.destroy = function() {
    communication.write({
      connectionId: this.connectionId,
      project: this.project
    }, 'disconnect');
    clearInterval(this.heartbeatInterval);
    this.emit('destroy');
    // watcher.removeListener("changed", this.handleFileChange);
    this.response.end();
  };

  /**
   * If data is specified, then a new event is sent, otherwise a comment line
   * is sent which can be used as a heartbeat.
   * @param  {string=} data
   */
  p.sendMessage = function(data) {
    if(data) {
      this.response.write("id: " + (++this.lastEventId) + "\n");
      this.response.write("data: " + data + "\n\n");
    } else {
      this.response.write("data: keepalive\n\n");
    }
  };

  p.handleRequest = function () {
    var parsedUrl = url.parse(this.request.url, true);

    this.lastEventId = Number(this.request.headers["last-event-id"]) ||
      Number(parsedUrl.query.lastEventId) || 0;

    // see http://contourline.wordpress.com/2011/03/30/preventing-server-timeout-in-node-js/
    this.response.socket.setTimeout(0); 

    this.response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });

    this.response.write(":" + new Array(2049).join(" ") + "\n"); // 2kB padding for IE
    this.response.write("retry: 2000\n");
    this.response.write("heartbeatTimeout: " + this.heartbeatTimeout + "\n");

    this.response.on("close", this.destroy);

    this.sendMessage('connectionId/-/' + this.connectionId);
  };

  module.exports = EventStream;
})();
