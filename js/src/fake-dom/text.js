define(['../utils'], function (_) {

  /**
   * Fake text node with given text. Used to be able to easily compare
   * text nodes with FakeElement without type checking
   * @param {string} text
   * @constructor
   */
  function FakeTextNode(text) {
    this.childNodes = [];
    this.real = null;
    this.setText(text);
  }

  FakeTextNode.prototype.nodeName = 'text#';
  FakeTextNode.prototype.innerHTML = '';
  FakeTextNode.prototype.nodeHash = 0;
  FakeTextNode.prototype.real = null;
  FakeTextNode.prototype.parentElement = undefined;

  FakeTextNode.prototype.setText = function(text) {
    // normalizing line endings
    text = text.replace(/\r\n|\r/g, '\n');
    this.outerHTML = text;
    this.flushCache();
  };

  /**
   * Flushes all node caches
   */
  FakeTextNode.prototype.flushCache = function() {
    this.subTreeHash = this.nodeHash = _.hash(this.nodeName + this.outerHTML);
  };

  /**
   * Creates real DOM Node with matching properties
   * @return {Node}
   */
  FakeTextNode.prototype.toDomNode = function() {
    this.real = document.createTextNode(this.outerHTML);
    return this.real;
  };

  return FakeTextNode;
});
