define(['../utils'], function (_) {

  /**
   * Fake text node with given text. Used to be able to easily compare
   * text nodes with FakeElement without type checking
   * @param {string} text
   * @constructor
   */
  function FakeComment(text) {
    // normalizing line endings
    text = text.replace(/\r\n|\r/g, '\n');
    this.innerHTML = text;
    this.outerHTML = '<!--' + text + '-->';
    this.childNodes = [];
    this.real = null;
    this.flushCache();
  }

  var p = FakeComment.prototype;

  /**
   * @type {string}
   */
  p.nodeName = 'comment#';

  /**
   * @type {string}
   */
  p.innerHTML = '';

  /**
   * @type {Number}
   */
  p.nodeHash = 0;

  /**
   * @type {FakeElement|FakeDocument}
   */
  p.parentElement = null;

  /**
   * @type {Node}
   */
  p.real = null;

  /**
   * Flushes all node caches
   * @this {FakeComment}
   */
  p.flushCache = function() {
    this.subTreeHash = this.nodeHash = _.hash(this.nodeName + this.outerHTML);
  };

  /**
   * Creates real DOM Node with matching properties
   * @this {FakeComment}
   * @return {Node}
   */
  p.toDomNode = function() {
    this.real = document.createComment(this.innerHTML);
    return this.real;
  };

  return FakeComment;
});
