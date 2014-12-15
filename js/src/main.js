define(['fake-dom/factory', 'process'], function(FakeFactory, process){

  // user api will live here
  var api = {
    "document": null,
    "debug":    true,
    "now":      false,
    "port":     55555,
    "host":    '127.0.0.1'
  };

  var scripts = document.getElementsByTagName('script'),
      thisScript = scripts[scripts.length - 1],
      configOptions = [
        {name:'debug', type: 'bool'},
        {name:'now', type: 'bool'},
        {name:'port', type: 'int'},
        {name:'host', type: 'string'}
      ];

  // Parsing options defined as data-* attributes on script tag
  configOptions.forEach(function(option){
    var attr = 'data-' + option.name,
        has = thisScript.hasAttribute(attr),
        value;
    if(has) {
      value = thisScript.getAttribute(option.name);
      if(option.type === 'bool') {
        api[option.name] = has;
      } else if(option.type === 'int') {
        api[option.name] = parseInt(value, 10);
      } else {
        api[option.name] = value;
      }
    }
  });

  /**
   * Returns object with host, protocol and pathname properties of the url
   * @param  {string} url
   * @return {URLUtils}
   */
  function parseUrl(url) {
    var a = document.createElement('a');
    a.href = url;
    return a;
  }

  /**
   * Returns pathname for urls on the same host
   * and false for urls to any other domain
   * @param  {string} url
   * @return {string|false}
   */
  function getLocalUrl(url) {
    url = parseUrl(url);
    // we only care about files that are located on the same host
    if(url.protocol === 'file:' || document.location.host === url.host) {
      return url.pathname;
    }
    return false;
  }

  /**
   * Tries to get a local url for link tag
   * @param  {Element} link
   * @return {string|undefined}
   */
  function processLinkTag(link) {
    if(link.getAttribute('rel') === 'stylesheet') {
      link.setAttribute('data-link-href', link.getAttribute('href'));
      return getLocalUrl(link.getAttribute('href'));
    }
  }

  /**
   * Tries to get a local url for script tag
   * @param  {Element} script
   * @return {string|undefined}
   */
  function processScriptTag(script) {
    if(!script.hasAttribute('data-ignore') && script.hasAttribute('src')) {
      return getLocalUrl(script.getAttribute('src'));
    }
  }

  /**
   * @param  {Array.<Element>} nodes
   * @param  {Function} processor
   * @return {Array.<string>}
   */
  function processNodeUrls(nodes, processor) {
    var result = [],
        resourceUrl;

    for(var i = 0; i < nodes.length; ++i) {
      if((resourceUrl = processor(nodes[i]))) {
        requestUrlWatch(resourceUrl);
        result.push(resourceUrl);
      }
    }
    return result;
  }

  /**
   * Extracts script urls that local to current domain from DOM
   * @return {Array.<string>}
   */
  function parseScripts() {
    return processNodeUrls(document.getElementsByTagName('script'), processScriptTag);
  }

  /**
   * Extracts stylesheet urls that local to current domain from DOM
   * @return {Array.<string>}
   */
  function parseCssLinks() {
    return processNodeUrls(document.getElementsByTagName('link'), processLinkTag);
  }

  /**
   * Notifies server that we are interested in passed url
   * and it should watch it for changes
   * @param  {string} url
   */
  function requestUrlWatch(url) {
    /* global XMLHttpRequest */
    var oReq = new XMLHttpRequest();
    oReq.open(
      "get",
      "http://" + api.host + ":" + api.port + "/watch" +
        "?connectionId=" + api.connectionId + '&file=' + encodeURIComponent(url),
      true
    );
    oReq.send();
  }

  /**
   * Notifies server that we are no longer interested in passed url
   * and it should stop watching it for changes
   * @param  {string} url
   */
  function removeUrlWatch(url) {
    /* global XMLHttpRequest */
    var oReq = new XMLHttpRequest();
    oReq.open(
      "get",
      "http://" + api.host + ":" + api.port + "/stopWatch" +
        "?connectionId=" + api.connectionId + '&file=' + encodeURIComponent(url),
      true
    );
    oReq.send(); 
  }

  /**
   * Gathers all interesting assets urls from DOM and CSS
   * and sends them to the server for watching.
   * @param  {string} connectionId
   */
  function beginAssetWatch(connectionId) {
    api.connectionId = connectionId;
    if(!api.styleSheets) {
      api.styleSheets = parseCssLinks();
    } else {
      api.styleSheets.forEach(requestUrlWatch);
    }
    if(!api.scripts) {
      api.scripts = parseScripts();
    } else {
      api.scripts.forEach(requestUrlWatch);  
    }
  }

  /**
   * Listens to events coming from server
   * and dispatches to apporiate actions.
   * @param  {Event} event
   */
  function listener(event) {
    if(event.type === 'message' && event.data) {
      var data = event.data.split('/'),
          type = decodeURIComponent(data[0]),
          file = decodeURIComponent(data[1]),
          payload = decodeURIComponent(data[2]);
      if(type === 'html') {
        api['updateHtml'](payload);
      } else if(type === 'css') {
        api.updateCss(file, payload);
      } else if(type === 'js') {
        // TODO need a way to update stateless libraries on the fly
        document.location = document.location; // reload
      } else if(type === 'connectionId') {
        beginAssetWatch(payload);
      }
    }
  }

  /**
   * Since we are tracking css and script changes we ned to track when
   * urls change for them or they are inserted / removed from the document
   * @param  {Array.<Object>} changes
   */
  function checkWatchedAssetChanges(changes) {
    var params,
        url;
    changes.forEach(function(change){
      params = change.params;
      switch(change.command) {
        case 'insert':
          if(params.node.tagName === 'link') {
            if((url = processLinkTag(params.node))) {
              requestUrlWatch(url);
              api.styleSheets.push(url);
            }
          } else if(params.node.tagName === 'script') {
            if((url = processScriptTag(params.node))) {
              requestUrlWatch(url);
              api.scripts.push(url);
            }
          }
          break;
        case 'setAttribute':
          if(params.node.tagName === 'link') {
            if(params.name === 'href') {
              url = params.node.real.getAttribute('data-link-href'); 
              if(url) {
                if(params.node.real.tagName.toLowerCase() === 'style') {
                  params.name = 'data-link-href';
                } else {
                  params.node.real.setAttribute('data-link-href', params.value);
                }
                api.styleSheets.splice(api.styleSheets.indexOf(url), 1);
                removeUrlWatch(url);
                requestUrlWatch(params.value);
                api.styleSheets.push(params.value);
              }
            }
          } else if(params.node.tagName === 'script') {
            url = params.node.getAttribute('src');
            if(url) { 
              api.scripts.splice(api.scripts.indexOf(url), 1);
              removeUrlWatch(url);
              requestUrlWatch(change.value);
              api.scripts.push(change.value);
            }
          }
          break;
        case 'remove':
          if(params.node.tagName === 'link') {
            url = params.node.real.getAttribute('data-link-href'); 
            if(url) {
              api.styleSheets.splice(api.styleSheets.indexOf(url), 1);
              removeUrlWatch(url);
            }
          } else if(params.node.tagName === 'script') {
            url = params.node.getAttribute('src');
            if(url) { 
              api.scripts.splice(api.scripts.indexOf(url), 1);
              removeUrlWatch(url);
            }
          }
          break;
      }
    });
  }

  /**
   * @param  {string} html
   */
  api['updateHtml'] = function(html) {
    if(api.debug) {
      console.time('HTML CHANGE');
    }
    var doc;
    try {
      // FIXME this should be built into parser
      if(html.match(/(<[\w\d]+[^'">]*?)(\s*)</gi)) {
        return;
      }
      doc = FakeFactory.fromHtml(html, true);
    } catch(e) { // if it's invalid can't do anything
      console.timeEnd('HTML CHANGE');
      return;
    }
    // console.log(doc);
    var changes = api['document'].merge(doc);
    checkWatchedAssetChanges(changes);

    if(api.debug) {
      changes.forEach(function(c){
        console.log(' ', c.command, c.params);
      });
    }

    try {
      process(changes);
      api['document'].flushCache();
      console.timeEnd('HTML CHANGE');
    } catch(e) {
      // if something went wrong just relaod the page.
      document.location = document.location;
    }
    return changes;
  };

  /**
   * @param  {Element} link
   * @param  {string} file
   * @param  {string} cssText
   */
  function replaceLinkWithStyle(link, file, cssText) {
    var newStyle = document.createElement('style');
    newStyle.setAttribute('data-link-href', file);
    link.parentElement.insertBefore(newStyle, link);
    link.parentElement.removeChild(link);
    newStyle.textContent = cssText;

    // switching node in a fake tree so that removing it still works
    // TODO This probably needs to be done in a better way
    api.document.head.childNodes.some(function(child){
      if(child.real === link) {
        child.real = newStyle;
        return true;
      }
    });
  }

  /**
   * @param  {CSSStyleSheet} sheet
   * @param  {string} cssText
   */
  function updateCssRules(sheet, cssText) {
    // clearing previous rules
    while(sheet.cssRules.length) {
      sheet.deleteRule(0);
    }
    var newStyle = document.createElement('style');
    document.head.appendChild(newStyle);
    newStyle.textContent = cssText;
    for(var i = 0; i < newStyle.sheet.cssRules.length; ++i) {
      sheet.insertRule(newStyle.sheet.cssRules[i].cssText, i);
    }
    document.head.removeChild(newStyle);
  }

  function adjustCssUrls(cssText, file) {
    var cssBasePath = file.replace(/[^\/]*$/, '');
    return cssText.replace(/url\(\s*['"]?([^'"\)]+)['"]?\s*\)/gi, function(m, url){
      return 'url(' + cssBasePath + url + ')';
    });
  }

  /**
   * @param  {string} file
   * @param  {string} cssText
   */
  api.updateCss = function(file, cssText) {
    if(api.debug) {
      console.time('CSS CHANGE');
    }
    [].some.call(document.querySelectorAll('[data-link-href]'), function(styleOrLink){
      if(styleOrLink.getAttribute('data-link-href').replace(/^\//, '') === file) {
        // @charset can't be handled correctly when reloading styles
        // so we remove it from text
        cssText = cssText.replace(/@charset\s+['"][^'"]+['"]\s*;?/gi, '');

        // since our replacement style will be relative to html and not css
        // we have to adjust urls manually
        if(styleOrLink.tagName.toLowerCase() === 'style') {
          cssText = adjustCssUrls(cssText, file);
        }
        var sheet = styleOrLink.sheet;

        // Unfortunately when opening a file:// page Webkit doesn't
        // provide cssRules property for stylesheets (probably for security)
        // so we have to replace <link> tags with <style> tags which
        // in turn creates some problems with debugging and live html
        // updates, but this is the only solution for now.
        if(sheet.cssRules == null) {
          cssText = adjustCssUrls(cssText, file);
          replaceLinkWithStyle(styleOrLink, file, cssText);
        } else {
          updateCssRules(sheet, cssText);
          // FIXME only update href if it was triggered by file change
          // if(styleOrLink.tagName.toLowerCase() === 'link') {
          //   styleOrLink.setAttribute(
          //     'href',
          //     styleOrLink.getAttribute('href').replace(/(\?\d+)?$/, '?' + new Date().getTime())
          //   );
          // }
        }
      }
    });
    if(api.debug) {
      console.timeEnd('CSS CHANGE');
    }
  };

  api.connect = function() {
    /* global EventSource */
    var docLocation = document.location;
    var url = "http://" + api.host + ":" + api.port + "/events?";
    var params = {
      host: docLocation.host
    };
    if(docLocation.protocol === 'file:') {
      var pathParts = docLocation.pathname.split(/[\/\\](?=[^\/\\]*$)/);
      params.basePath = pathParts[0];
      params.url = pathParts[1];
      params.host = '';
    } else {
      params.url = docLocation.pathname.replace(/^\//, '');
    }
    for(var key in params) {
      url += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
    }
    var es = new EventSource(url);
    if(api.debug) {
      es.addEventListener("open", function(){
        console.log("CONNECTED TO LIVE HTML SERVER");
      });
    }
    // es.addEventListener("error", listener);
    es.addEventListener("message", listener);
  };

  api.init = function() {
    api['document'] = FakeFactory.fromDomNode(document, true);
    if(!api['oninit'] || api['oninit']() !== false) {
      api.connect();
    }
  };

  // User can decide if script will parse current
  // html on dom ready or right away
  if(api['now']) {
    api.init();
  } else {
    // use capture to be the first
    window.addEventListener('DOMContentLoaded', api.init, true);
    document.addEventListener('LiveHtmlStart', api.init, true);
  }

  window["__liveHtml"] = api;
});
