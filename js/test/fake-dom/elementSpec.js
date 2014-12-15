define(['fake-dom/element', 'fake-dom/text'], function (FakeElement, FakeTextNode) {
  describe('FakeElement', function () {

      it('should have correct properties', function () {
        var fakeEl = new FakeElement('span', {
          "class": "test"
        });
        expect(fakeEl.tagName).toBe('span');
        expect(fakeEl.childNodes.length).toBe(0);
        expect(fakeEl.innerHTML).toBe('');
        fakeEl.buildOuterHtml();
        expect(fakeEl.outerHTML).toBe('<span class="test"></span>');
      });

      it('should be able to create real DOM element', function () {
        var fakeEl = new FakeElement('span', {
          "class": "test"
        });
        var realNode = fakeEl.toDomNode();
        expect(realNode instanceof Element).toBe(true);
        expect(realNode.getAttribute('class')).toBe('test');

      });

      it('should be able to create real script / style elements', function () {
        var fakeEl = new FakeElement('script');
        var scriptContent = 'var a = 5;';
        fakeEl.appendChild(new FakeTextNode(scriptContent));

        var realNode = fakeEl.toDomNode(true);
        expect(realNode instanceof Element).toBe(true);
        expect(realNode.innerHTML).toBe(scriptContent);
      });

  });
});
