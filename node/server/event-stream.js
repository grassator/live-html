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
!function(){function a(a){var b,c=a.headers["user-agent"];return/firefox/i.test(c)?b="firefox":/chrome/i.test(c)?(b="chrome",/canary/i.test(c)&&(b="chrome-canary")):b=/safari/i.test(c)?"safari":/msie|trident/i.test(c)?"msie":"unknown",b}function b(b,c,d){this.connectionId=f(),this.browser=a(b),this.request=b,this.response=c,this.project=d,this.relevantFiles=[],["destroy","sendMessage"].forEach(function(a){this[a]=this[a].bind(this)},this),this.heartbeatInterval=setInterval(this.sendMessage,this.heartbeatTimeout),this.handleRequest(),g.write({browser:this.browser,connectionId:this.connectionId,project:this.project},"connect")}var c=require("events").EventEmitter,d=require("url"),e=require("util"),f=require("./guid.js"),g=require("./communication.js");e.inherits(b,c);var h=b.prototype;h.heartbeatTimeout=5e3,h.lastEventId=0,h.destroy=function(){g.write({connectionId:this.connectionId,project:this.project},"disconnect"),clearInterval(this.heartbeatInterval),this.emit("destroy"),this.response.end()},h.sendMessage=function(a){a?(this.response.write("id: "+ ++this.lastEventId+"\n"),this.response.write("data: "+a+"\n\n")):this.response.write("data: keepalive\n\n")},h.handleRequest=function(){var a=d.parse(this.request.url,!0);this.lastEventId=Number(this.request.headers["last-event-id"])||Number(a.query.lastEventId)||0,this.response.socket.setTimeout(0),this.response.writeHead(200,{"Content-Type":"text/event-stream","Cache-Control":"no-cache","Access-Control-Allow-Origin":"*"}),this.response.write(":"+new Array(2049).join(" ")+"\n"),this.response.write("retry: 2000\n"),this.response.write("heartbeatTimeout: "+this.heartbeatTimeout+"\n"),this.response.on("close",this.destroy),this.sendMessage("connectionId/-/"+this.connectionId)},module.exports=b}();