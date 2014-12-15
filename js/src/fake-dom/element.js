define(['../utils'], function (_) {

  var EMPTY_TAGS = {
    "area": true,
    "base": true,
    "br": true,
    "col": true,
    "embed": true,
    "hr": true,
    "img": true,
    "input": true,
    "keygen": true,
    "link": true,
    "meta": true,
    "param": true,
    "source": true,
    "track": true,
    "wbr": true
  };

  /**
   * @constructor
   * @param {string} name
   * @param {Object} attributes
   */
  function FakeElement(name, attributes, namespaceURI) {
    this.setAttributes(attributes);
    this.tagName = name = name.toLowerCase();
    this.namespaceURI = namespaceURI;
    this.unary = !!EMPTY_TAGS[name];
    this.childNodes = [];
    this.nodeHash = _.hash(name + JSON.stringify(this.attrs));
  }

  FakeElement.prototype.unary = false;
  FakeElement.prototype.parentElement = null;
  FakeElement.prototype.real = null;
  FakeElement.prototype.attrs = null;
  FakeElement.prototype.childNodes = null;
  FakeElement.prototype.innerHTML = "";
  FakeElement.prototype.outerHTML = "";
  FakeElement.prototype.tagName = "";
  FakeElement.prototype.childHash = 0;
  FakeElement.prototype.nodeHash = 0;
  FakeElement.prototype.namespaceURI = "";

  /**
   * @param {Object} attributes [description]
   */
  FakeElement.prototype.setAttributes = function(attributes) {
    this.attrs = {};
    // sorting attributes so that hashing works correctly
    if(attributes) {
      Object.keys(attributes).sort().forEach(function(key){
        this.attrs[key] = attributes[key];
      }, this);
    }
  };

  /**
   * @param {string} key
   * @param {string} value
   */
  FakeElement.prototype.setAttribute = function(key, value) {
    this.attrs[key] = value;
  };

  /**
   * @param  {string} key
   */
  FakeElement.prototype.getAttribute = function(key) {
    return this.attrs[key];
  };

  /**
   * @param  {string} key
   */
  FakeElement.prototype.hasAttribute = function(key) {
    return key in this.attrs;
  };

  /**
   * @param  {string} key
   */
  FakeElement.prototype.removeAttribute = function(key) {
    delete this.attrs[key];
  };

  FakeElement.prototype.buildOuterHtml = function() {
    var html = '', el = this;
    for(var key in el.attrs) {
      html += ' ' + key + '="' + el.attrs[key] + '"';
    }
    html = '<' + el.tagName + html +
      (el.unary ? '>' : '>' + el.innerHTML + '</' + el.tagName + '>');
    this.outerHTML = html;
  };

  FakeElement.prototype.generateSubTreeHash = function() {
    var heuristicId = '<<' + this.tagName;
    if(this.attrs.id) {
      heuristicId += '|' + this.attrs.id;
    } else if(this.attrs['class']) {
      heuristicId += '|' + this.attrs['class'];
    } else if(this.isGeneralTag()) { // general tags without class or id
      heuristicId += Math.random();  // cant be distingushed from one another
    }
    heuristicId += '>>';
    this.subTreeHash =  _.hash(heuristicId, this.childHash);
  };

  FakeElement.prototype.isGeneralTag = function() {
    var tag = this.tagName;
    return tag === 'div' || tag === 'span' ||
           tag === 'dd'  || tag === 'dt'   || tag === 'li';
  };

  /**
   * Flushes all node caches
   */
  FakeElement.prototype.flushCache = function() {
    // script / style tags don't need to recalculate innerHTML
    if(this.tagName !== 'script' && this.tagName !== 'style') {
      var html = '';
      this.childHash = this.childNodes.reduce(function(hash, child){
        html += child.outerHTML;
        return _.hash(child.outerHTML, hash);
      }, 0);
      this.innerHTML = html;
    }
    this.buildOuterHtml();
    this.nodeHash = _.hash(this.tagName + JSON.stringify(this.attrs));
    this.generateSubTreeHash();
  };

  /**
   * Makes this node have same attributes as the passed node,
   * except for childNodes which are not copied. It also drops
   * reference to real node from the passed node if it's present.
   * 
   * @param  {FakeElement} other
   */
  FakeElement.prototype.mutateInto = function(other) {
    this.unary = other.unary;
    this.real = other.real;
    this.attrs = other.attrs;
    this.innerHTML = other.innerHTML;
    this.outerHTML = other.outerHTML;
    this.tagName = other.tagName;
    this.nodeHash = other.nodeHash;

    other.real = null;
  };

  /**
   * Append a child to this element and auto-adjust hashes accordingly
   * @param  {FakeElement|FakeTextNode} fakeChild
   */
  FakeElement.prototype.appendChild = function(fakeChild) {
    if(fakeChild.parentElement) {
      fakeChild.parentElement.removeChild(fakeChild);
    }
    fakeChild.parentElement = this;

    // style and script tags can't have children
    if(this.tagName !== 'script' && this.tagName !== 'style') {
      this.childNodes.push(fakeChild);
    }
    this.innerHTML += fakeChild.outerHTML;
    this.childHash = _.hash(fakeChild.outerHTML, this.childHash);
  };

  /**
   * Inserts given fakeChild before given fakeReference into the list
   * of child nodes for this element. 
   * 
   * @param  {FakeElement|FakeTextNode} fakeChild
   * @param  {FakeElement|FakeTextNode} fakeReference
   */
  FakeElement.prototype.insertBefore = function(fakeChild, fakeReference) {
    if(fakeChild.parentElement) {
      fakeChild.parentElement.removeChild(fakeChild);
    }
    fakeChild.parentElement = this;
    var index = this.childNodes.indexOf(fakeReference);
    if(index > -1) {
      this.childNodes.splice(index, 0, fakeChild);
    } else {
      throw "ref node not found";
    }
  };

  /**
   * Removes child from element. 
   * @param  {FakeElement|FakeTextNode} fakeChild
   */
  FakeElement.prototype.removeChild = function(fakeChild) {
    var index = this.childNodes.indexOf(fakeChild);
    if(index > -1) {
      this.childNodes.splice(index, 1);
    } else {
      throw "child not found";
    }
  };

  /**
   * Converts fake element to a real DOM node
   * @param  {bool} recursive whether to convert children as well
   * @return {Node}
   */
  FakeElement.prototype.toDomNode = function(recursive) {
    var el = document.createElement(this.tagName);
    for(var key in this.attrs) {
      el.setAttribute(key, this.attrs[key]);
    }
    if(this.tagName === 'script' || this.tagName === 'style') {
      el.innerHTML = this.innerHTML;
    } else if(recursive) {
      this.childNodes.forEach(function(fakeChild){
        el.appendChild(fakeChild.toDomNode(true));
      });
    }
    this.real = el;
    return el;
  };

  return FakeElement;
});
