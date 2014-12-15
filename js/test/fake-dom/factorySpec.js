/* global console */
define(['fake-dom/factory', 'process'], function (FakeFactory, process) {
  describe('Fake DOM Factory', function () {

    var srcHtml =
      '<!-- some comment -->\n' +
      '<html>\n' +
      '<!-- other comment -->\n' +
      '<head>\n' +
      '  <title>Test document</title>\n' +
      '  <link href="styles.css" rel="stylesheet" type="text/css">\n' +
      '  <script>\n' +
      '    var works = true' +
      '  </script>\n' +
      '  <style>\n' +
      '    body { color: red; }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <table>\n' +
      '    <tr><td>456</td></tr>\n' +
      '  </table>\n' +
      '  <ul>\n' +
      '    <li><a>123</a></li>\n' +
      '  </ul>\n' +
      '</body>\n' +
      '</html>';

    function ensureReal(node, level) {
      level = level || 0;
      if(!node.real) {
        console.error(new Array(level).join(' ') + (node.tagName || node.outerHTML) + ' not real');
        expect(node.real).toBeTruthy();
      }
      // console.log(new Array(level).join(' ') + (node.tagName || node.outerHTML));
      node.childNodes.forEach(function(child){
        ensureReal(child, level + 1);
      });
    }

    function nativeDom(html) {
      if('DOMParser' in window) {
        return (new DOMParser()).parseFromString(html, 'text/html');
      } else {
        var doc = document.implementation.createHTMLDocument('');
        doc = doc.open();
        doc.write(html);
        doc.close();
        return doc;
      }
    }

    // PhantomJS doesn't properly support DOMParser API
    if(!navigator.userAgent.match(/PhantomJS/)) {
      it('should generate correct fake tree from DOM', function () {
        var doc = nativeDom(srcHtml);
        var fakeTree = FakeFactory.fromDomNode(doc, true);
        expect(fakeTree.documentElement.outerHTML)
          .toBe(doc.documentElement.outerHTML);
      });

      it('should discard any tags in html besides <head> and <body>', function () {
        var doc = nativeDom(srcHtml);
        var scriptTag = doc.createElement('script');
        doc.documentElement.insertBefore(scriptTag, doc.documentElement.firstChild);
        var fakeTree = FakeFactory.fromDomNode(doc, true);
        var children = fakeTree.documentElement.childNodes;
        for(var i = 0; i < children.length; ++i) {
          expect(children[i].tagName).not.toBe('script');
        }
      });

      it('should retain real nodes after multiple merges', function () {
        var doc = nativeDom(srcHtml);
        var fakeTree = FakeFactory.fromDomNode(doc, true);
        var fakeTreeFromHtml = FakeFactory.fromHtml(srcHtml.replace('</li>', '\n    </li>'), true);

        var changes = fakeTree.merge(fakeTreeFromHtml);
        process(changes);
        fakeTree.flushCache();
        ensureReal(fakeTree.documentElement);

        fakeTreeFromHtml = FakeFactory.fromHtml(srcHtml.replace('</li>', '\n  </li>'), true);
        changes = fakeTree.merge(fakeTreeFromHtml);
        process(changes);
        fakeTree.flushCache();
        ensureReal(fakeTree.documentElement);
      });

      it('should generate consistent fake tree using DOM and own parser', function () {
        var doc = nativeDom(srcHtml);
        var fakeTreeFromDom = FakeFactory.fromDomNode(doc, true);
        var fakeTreeFromHtml = FakeFactory.fromHtml(srcHtml, true);
        expect(fakeTreeFromDom.documentElement.outerHTML)
          .toBe(fakeTreeFromHtml.documentElement.outerHTML);
        expect(fakeTreeFromDom.documentElement.subTreeHash)
          .toBe(fakeTreeFromHtml.documentElement.subTreeHash);
        expect(fakeTreeFromDom.documentElement.childHash)
          .toBe(fakeTreeFromHtml.documentElement.childHash);
      });

      it('should support non-closed tag', function () {
        var fakeTreeFromDom = FakeFactory.fromDomNode(
          nativeDom("<html><body>\n  <hr></body></html>"),
          true
        );
        var fakeTreeFromHtml = FakeFactory.fromHtml(
          "<html><body>\n  <h>\n  <hr></body></html>",
          true
        );

        var changes = fakeTreeFromDom.merge(fakeTreeFromHtml);
        process(changes);

        fakeTreeFromDom.flushCache();
        
        ensureReal(fakeTreeFromDom.documentElement);
        expect(fakeTreeFromDom.documentElement.outerHTML)
          .toBe(fakeTreeFromHtml.documentElement.outerHTML);
      });

      it('should support text in head', function () {
        var fakeTreeFromDom = FakeFactory.fromDomNode(
          nativeDom('<html>\n<head>\n  \n<script src="1.js"></script></head>\n<body>\n  <hr></body>\n</html>'),
          true
        );
        var fakeTreeFromHtml = FakeFactory.fromHtml(
          '<html>\n<head>\n  <\n  <script src="1.js"></script>\n</head>\n<body>\n  <hr></body>\n</html>',
          true
        );

        var changes = fakeTreeFromDom.merge(fakeTreeFromHtml);
        // changes = changes.slice(0, 4);
        // console.log(changes[3].command, changes[3].params);
        // changes.forEach(function(c){
        //   console.log(c.command, c.params);
        // });

        process(changes);

        fakeTreeFromDom.flushCache();
        
        ensureReal(fakeTreeFromDom.documentElement);
        // FIXME whitespace should be handled correctly as well
        expect(fakeTreeFromDom.documentElement.outerHTML.replace(/\s+/g, ''))
          .toBe(fakeTreeFromHtml.documentElement.outerHTML.replace(/\s+/g, ''));
      });

      it('should support moving from body to head', function () {
        var fakeTreeFromDom = FakeFactory.fromDomNode(
          nativeDom('<html>\n<head>\n  title\n  <script src="1.js"></script></head>\n<body>\n  <h1>sdfsdf</h1>\n  <hr>\n</body>\n</html>'),
          true
        );
        var fakeTreeFromHtml = FakeFactory.fromHtml(
          '<html>\n<head>\n  <title></title>\n  <script src="1.js"></script>\n</head>\n<body>\n  <h1>sdfsdf</h1>\n  <hr>\n</body>\n</html>',
          true
        );

        var changes = fakeTreeFromDom.merge(fakeTreeFromHtml);

        // console.log(changes[3].command, changes[3].params);
        // changes.forEach(function(c){
        //   console.log(c.command, c.params);
        // });

        process(changes);

        fakeTreeFromDom.flushCache();
        
        ensureReal(fakeTreeFromDom.documentElement);
        // FIXME whitespace should be handled correctly as well
        expect(fakeTreeFromDom.documentElement.outerHTML.replace(/\s+/g, ''))
          .toBe(fakeTreeFromHtml.documentElement.outerHTML.replace(/\s+/g, ''));
      });
    }

    it('should generate handle html, head and body autocreation', function () {
      var fakeTreeFromHtml = FakeFactory.fromHtml('<br>', true);
      expect(fakeTreeFromHtml.documentElement.outerHTML)
        .toBe('<html><head></head><body><br></body></html>');
    });

    it('should generate put <title> inside head if encountered before body', function () {
      var fakeTreeFromHtml = FakeFactory.fromHtml('<title>abc</title><br>', true);
      expect(fakeTreeFromHtml.documentElement.outerHTML)
        .toBe('<html><head><title>abc</title></head><body><br></body></html>');
    });

  });
});
