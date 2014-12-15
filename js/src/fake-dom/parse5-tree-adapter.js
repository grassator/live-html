define(['./text', './element', './comment', './document'],
function(FakeTextNode, FakeElement, FakeComment, FakeDocument){

    var exports = {};

    // Node construction
    exports.createDocument = function() {
        return new FakeDocument();
    };

    // TODO create DocumentFragment
    exports.createDocumentFragment = function() {
        return new FakeDocument();
    };

    exports.createElement = function(tagName, namespaceURI, attrs) {
        var attributeHash = {};
        attrs.forEach(function(attr){
            attributeHash[attr.name] = attr.value;
        });
        return new FakeElement(tagName, attributeHash, namespaceURI);
    };

    exports.createCommentNode = function (data) {
        return new FakeComment(data);
    };

    //Tree mutation
    exports.setDocumentType = function (/*document, name, publicId, systemId*/) {
        // TODO Investigate if this is needed
    };

    exports.setQuirksMode = function (document) {
        document.quirksMode = true;
    };

    exports.isQuirksMode = function (document) {
        return document.quirksMode;
    };

    exports.appendChild = function (parentNode, newNode) {
        parentNode.appendChild(newNode);
    };

    exports.insertBefore = function (parentNode, newNode, referenceNode) {
        parentNode.insertBefore(newNode, referenceNode);
    };

    exports.detachNode = function (node) {
        if (node.parentElement) {
            node.parentElement.removeChild(node);
        }
    };

    exports.insertText = function (parentNode, text) {
        if (parentNode.childNodes.length) {
            var prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];

            if (prevNode.constructor === FakeTextNode) {
                prevNode.setText(prevNode.outerHTML + text);
                return;
            }
        }

        parentNode.appendChild(new FakeTextNode(text));
    };

    exports.insertTextBefore = function (parentNode, text, referenceNode) {
        var prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];

        if (prevNode && prevNode.constructor === FakeTextNode) {
            prevNode.setText(prevNode.outerHTML + text);
        } else {
            parentNode.insertBefore(new FakeTextNode(text, referenceNode));
        }
    };

    exports.adoptAttributes = function (recipientNode, attrs) {
        // var recipientAttrsMap = [];

        // for (var i = 0; i < recipientNode.attrs.length; i++)
        //     recipientAttrsMap.push(recipientNode.attrs[i].name);

        // for (var j = 0; j < attrs.length; j++) {
        //     if (recipientAttrsMap.indexOf(attrs[j].name) === -1)
        //         recipientNode.attrs.push(attrs[j]);
        // }

        // TODO check if this is working as intended by parser
        for (var i = 0; i < attrs.length; ++i) {
            if(!recipientNode.hasAttribute(attrs[i].name)) {
                recipientNode.setAttribute(attrs[i].name, attrs[i].value);
            }
        }
    };


    //Tree traversing
    exports.getFirstChild = function (node) {
        return node.childNodes[0];
    };

    exports.getChildNodes = function (node) {
        return node.childNodes;
    };

    exports.getParentNode = function (node) {
        return node.parentElement;
    };

    exports.getAttrList = function (node) {
        var attrList = [];
        for(var name in node.attrs) {
            attrList.push({
                name: name,
                value: node.attrs[name]
            });
        }
        return attrList;
    };

    //Node data
    exports.getTagName = function (element) {
        return element.tagName;
    };

    exports.getNamespaceURI = function (element) {
        return element.namespaceURI;
    };

    exports.getTextNodeContent = function (textNode) {
        return textNode.outerHTML;
    };

    exports.getCommentNodeContent = function (commentNode) {
        return commentNode.innerHTML;
    };

    exports.getDocumentTypeNodeName = function (doctypeNode) {
        return doctypeNode.tagName;
    };

    exports.getDocumentTypeNodePublicId = function (doctypeNode) {
        return doctypeNode.publicId;
    };

    exports.getDocumentTypeNodeSystemId = function (doctypeNode) {
        return doctypeNode.systemId;
    };

    //Node types
    exports.isTextNode = function (node) {
        return node.constructor === FakeTextNode;
    };

    exports.isCommentNode = function (node) {
        return node.constructor === FakeComment;
    };

    exports.isDocumentTypeNode = function (node) {
        return node.constructor === FakeDocument;
    };

    exports.isElementNode = function (node) {
        return node.constructor === FakeElement;
    };

    return exports;

});
