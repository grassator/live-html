define(['fake-dom/text'], function (FakeTextNode) {
  describe('FakeTextNode', function () {

      var value = "some text",
          textNode;

      beforeEach(function(){
        textNode = new FakeTextNode(value);
      });

      it('should have correct properties', function () {
        expect(textNode.childNodes.length).toBe(0);
        expect(textNode.outerHTML).toBe(value);
      });

      it('should be able to create real DOM element', function () {
        var realNode = textNode.toDomNode();
        expect(realNode instanceof Node).toBe(true);
        expect(realNode.nodeValue).toBe(value);
      });


  });
});
