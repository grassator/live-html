define(['fake-dom/document', 'fake-dom/factory'], function (FakeDocument, FakeFactory) {
  describe('FakeDocument', function () {

    var original, altered, changes;

    function recurseCompare(actual, expected) {
      if(typeof expected === 'object') {
        for(var key in expected) {
          if(expected.hasOwnProperty(key)) {
            recurseCompare(actual[key], expected[key]);
          }
        }
      } else {
        expect(actual).toBe(expected);
      }
    }

    function testMerge(beforeHtml, afterHtml, expectedChanges) {
      original = FakeFactory.fromHtml(beforeHtml, true);
      altered = FakeFactory.fromHtml(afterHtml, true);
      changes = original.merge(altered);
      // /* global console */
      // changes.forEach(function(c){
      //   console.log(c.command, c.params);
      // });
      try {

        expect(changes.length).toBe(expectedChanges.length);
        for(var i = 0; i < changes.length; ++i) {
          recurseCompare(changes[i], expectedChanges[i]);
        }
      } catch(e) {
        throw 'merge test failed';
      }
      return changes;
    }

    // -----------------------------------------------------------------------
    
    describe('Attribute / Tag changes', function(){

      it('should handle attribute addition', function () {
        testMerge(
          '<html></html>',
          '<html id="top"></html>',
          [{ command: 'setAttribute', params: { name: 'id', value: 'top' }}]
        );
      });

      it('should handle attribute change', function () {
        testMerge(
          '<html id="test"></html>',
          '<html id="top"></html>',
          [{ command: 'setAttribute', params: { name: 'id', value: 'top' }}]
        );
      });

      it('should handle attribute removal', function () {
        testMerge(
          '<html id="test"></html>',
          '<html></html>',
          [{ command: 'removeAttribute', params: { name: 'id' }}]
        );
      });

      it('should handle tag name change', function () {
        testMerge(
          '<div>test</div>',
          '<span>test</span>',
          [{
            command: 'rename',
            params: { fromNode: {tagName: 'div'}, toNode: {tagName: 'span'} }
          }]
        );
      });

    });

    // -----------------------------------------------------------------------
    
    describe('special cases', function(){

      it('should handle style tag update', function () {
        testMerge(
          '<html><style>a { color: red }</style></html>',
          '<html><style>a { color: blue }</style></html>',
          [{
            command: 'setProperty',
            params: { name: 'innerHTML', value: 'a { color: blue }' }
          }]
        );
      });

    });

    // -----------------------------------------------------------------------
    
    describe('text', function(){

      it('should handle text change in nested general tag', function () {
        testMerge(
          '<html><ul><li><i>123</i></li></ul></html>',
          '<html><ul><li><i>321</i></li></ul></html>',
          [{
            command: 'insert',
            params: { ref: null, parent: {tagName: 'i'} }
          },{
            command: 'remove',
            params: { ref: null, parent: {tagName: 'i'} }
          }]
        );
      });

    });

    // -----------------------------------------------------------------------
    
    describe('Removal', function(){

      it('should handle subtree removal', function () {
        testMerge(
          '<html><br><header><h1>123</h1></header></html>',
          '<html><br></html>',
          [{
            command: 'remove',
            params: { node: {tagName: 'header'}, parent: { tagName: 'body'} }
          }]
        );
      });

      it('should handle removal with hash collisions', function () {
        testMerge(
          '<html><br><br></html>',
          '<html></html>',
          [{
            command: 'remove',
            params: { node: {tagName: 'br'}, parent: { tagName: 'body'} }
          },{
            command: 'remove',
            params: { node: {tagName: 'br'}, parent: { tagName: 'body'} }
          }]
        );
      });

    });

    //-------------------------------------------------------------------------

    describe('Node Movement', function(){

      it('should handle next/prev swap', function () {
        testMerge(
          '<html><div>1</div><span>2</span></html>',
          '<html><span>2</span><div>1</div></html>',
          [{
            command: 'move',
            params: { ref: { tagName: 'div'}, node: {tagName: 'span'} }
          }]
        );
      });

      it('should handle sibling reorder', function () {
        testMerge(
          '<html><div>1</div><span>2</span><span>3</span></html>',
          '<html><span>3</span><span>2</span><div>1</div></html>',
          [{
            command: 'move',
            params: { ref: { tagName: 'div'}, node: {tagName: 'span', innerHTML: '3'} }
          },{
            command: 'move',
            params: { ref: { tagName: 'div'}, node: {tagName: 'span', innerHTML: '2'} }
          }]
        );
      });

      it('should handle text reorder', function () {
        testMerge(
          '<html>1<span>2</span>3</html>',
          '<html>3<span>2</span>1</html>',
          [{
            command: 'move',
            params: { ref: { tagName: 'span'}, node: {outerHTML: '3'} }
          },{
            command: 'move',
            params: { ref: null, node: {outerHTML: '1'} }
          }]
        );
      });

      it('should handle comment reorder', function () {
        testMerge(
          '<html><body><!-- 1 --><span>2</span><!-- 3 --></body></html>',
          '<html><body><!-- 3 --><span>2</span><!-- 1 --></body></html>',
          [{
            command: 'move',
            params: { ref: { tagName: 'span'}, node: {outerHTML: '<!-- 3 -->'} }
          },{
            command: 'move',
            params: { ref: null, node: {outerHTML: '<!-- 1 -->'} }
          }]
        );
      });

      it('should handle element move to different subtree', function () {
        testMerge(
          '<body><header></header><div>1</div></body>',
          '<body><header><div>1</div></header></body>',
          [{
            command: 'move',
            params: {
              ref: null,
              node: {tagName: 'div', innerHTML: '1'},
              parent: {tagName: 'header'}
            }
          }]
        );
      });

      it('should handle text move to different subtree', function () {
        testMerge(
          '<body>1<header></header></body>',
          '<body><header>1</header></body>',
          [{
            command: 'move',
            params: {
              ref: null,
              node: {outerHTML: '1'},
              parent: {tagName: 'header'}
            }
          }]
        );
      });

      it('should handle move with hash collisions', function () {
        testMerge(
          '<body><h1></h1>1<br>1</body>',
          '<body>1<h1></h1><br></body>',
          [{
            command: 'move',
            params: { ref: { tagName: 'h1'},  node: {outerHTML: '1'}, parent: {tagName: 'body'} }
          },{
            command: 'remove',
            params: { node: {outerHTML: '1'}, parent: {tagName: 'body'} }
          }]
        );
      });

      it('should handle nested element wrapping ', function () {
        testMerge(
          '<body><div>1</div></body>',
          '<body><section><footer><div>1</div></footer></section></body>',
          [{
            command: 'insert',
            params: {
              ref: null,
              node: {tagName: 'section'},
              parent: {tagName: 'body'}
            }
          },{
            command: 'move',
            params: {
              ref: null,
              node: {tagName: 'div', innerHTML: '1'},
              parent: {tagName: 'footer'}
            }
          }]
        );
      });

    });

  });
});
