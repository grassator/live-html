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
!function(){{var a=require("./guid.js"),b=require("events").EventEmitter,c=module.exports=new b,d={},e=c.write=function(a,b){null==b&&(b="info");var c={timestamp:new Date,message:a,type:b},d="error"===a.type?process.stderr:process.stdout;d.write(JSON.stringify(c)+"\n\n","utf-8")};c.request=function(b,c,f){var g=a();d[g]=f,e({guid:g,name:b,parameters:c||{}},"request")}}process.stdin.setEncoding("utf-8"),process.stdin.on("readable",function(a){if(a=process.stdin.read(),null!==a){var b=JSON.parse(a);switch(b.type){case"response":b.guid?(d[b.guid](b.data),delete d[b.guid]):console.error("No guid in message:\n"+a);break;case"remove":c.emit("remove",b.data)}}})}();