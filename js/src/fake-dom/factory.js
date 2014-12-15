define(['../utils', './parse5', './parse5-tree-adapter', './text', './element', './document', './comment'],
function (_, Parse5, fakeTreeAdapter, FakeTextNode, FakeElement, FakeDocument, FakeComment) {
  
  var Parser = new Parse5(fakeTreeAdapter);

  /**
   * Transforms NamedNodeMap into plain object
   * @param  {Array} namedNodeMap
   * @return {Object}
   */
   function getAttributeObject(namedNodeMap) {
    // Transforming attributes into hash
    var attrObject = {};
    if(namedNodeMap) {
      [].slice.call(namedNodeMap).forEach(function(attr){
        attrObject[attr.name] = _.decodeHtmlEntities(attr.value);
      });
    }
    return attrObject;
  }

  var DOCUMENT_TAG_TO_PROPERTY_MAP = {
    'html': 'documentElement',
    'head': 'head',
    'body': 'body'
  };

  var factory = {};

  /**
   * Converts given html to a FakeDocument instance with complete tree
   * @param  {string} html
   * @return {FakeDocument}
   */
  factory.fromHtml = function(html, autoCreateHtmlHeadBody) {
    var doc;
    if(autoCreateHtmlHeadBody) {
      doc = Parser.parse(html);
    } else {
      doc = Parser.parseFragment(html);
    }
    // TODO see if this can be optimised
    doc.flushCache();
    return doc;
  };

  /**
   * Recursive function that can build fake DOM elements (or trees
   * if `recursive` parameter is set). `doc` is an 
   * @param  {Node} real
   * @param  {bool} recursive
   * @param  {FakeDocument=} doc internal parameter
   * @return {FakeDocument|FakeElement|FakeTextNode}
   */
  function processDomNode(real, recursive, doc) {
    var fake = null;

    switch(real.nodeType) {
      case 3: // text node
        fake = new FakeTextNode(real.nodeValue);
        break;
      case 9: // document node
        doc = fake = new FakeDocument();
        break;
      case 8: // comment
        fake = new FakeComment(real.nodeValue);
        break;
      case 10: // doctype
        break;
      default:
        fake = new FakeElement(real.nodeName, getAttributeObject(real.attributes));

        // adding direct links to head, body etc for document
        if(doc && DOCUMENT_TAG_TO_PROPERTY_MAP[fake.tagName]) {
          doc[DOCUMENT_TAG_TO_PROPERTY_MAP[fake.tagName]] = fake;
        }
    }

    // saving object reference to real node to be able to access it in merge
    // but it could replaced with any kind of unique id that can be used to
    // identify a real node inside browser DOM
    if(fake) {
      fake.real = real;
    }

    if(!fake || !recursive) {
      return fake;
    }

    var realChildNodes = real.childNodes,
        length = realChildNodes.length,
        i = -1, fakeChild;

    while(++i < length) {
      // if it turned out to be a node that we don't care about just go on
      if((fakeChild = processDomNode(realChildNodes[i], true, doc))) {
        // ignoring any tag children of <html> that are not <head> or <body>
        // because they could have gotten there only programmatically after
        // DOM has been parsed because all tags during parsing stage are
        // pushed inside either <head> or <body>
        if(fake.tagName === 'html' && fakeChild.constructor === FakeElement &&
           fakeChild.tagName !== 'head' && fakeChild.tagName !== 'body'
        ){
          continue;
        }
        fake.appendChild(fakeChild);
      }
    }
    
    if(fake.constructor === FakeElement) {
      fake.generateSubTreeHash();
      fake.buildOuterHtml();
    }

    return fake;
  }
  factory.fromDomNode = processDomNode;

  return factory;
});
