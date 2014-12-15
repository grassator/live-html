define(['fake-dom/parse5', 'fake-dom/parse5-tree-adapter'], function (Parse5, treeAdapter) {
  describe('parse5', function () {
      it('should exist', function () {
        var parser = new Parse5(treeAdapter);
        expect(parser).toBeTruthy();
        ///* global console */
        // parser.parse('<html><!-- 1 --><span>2</span><!-- 3 --></html>');
      });
  });
});
