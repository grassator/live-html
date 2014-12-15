define(['./text', './element', '../utils'],
function (FakeTextNode, FakeElement,  _) {

  /**
   * @constructor
   */
  function FakeDocument() {
    this.childNodes = [];
  }

  var p = FakeDocument.prototype;

  /**
   * @type {Boolean}
   */
  p.quirksMode = false;
  
  /**
   * @type {FakeElement}
   */
  p.head = null;

  /**
   * @type {FakeElement}
   */
  p.body = null;

  /**
   * @type {FakeElement}
   */
  p.documentElement = null;


  /**
   * @type {Array.<FakeElement|FakeTextNode|FakeComment>}
   */
  p.childNodes = undefined;

  /**
   * @this {FakeDocument}
   * @param {FakeElement|FakeTextNode|FakeComment} fakeChild
   */
  p.appendChild = function(fakeChild) {
    fakeChild.parentElement = this;
    if(fakeChild.constructor === FakeElement) {
      switch(fakeChild.tagName) {
        case 'html':
          this.documentElement = fakeChild;
          break;
        case 'head':
          this.head = fakeChild;
          break;
        case 'body':
          this.body = fakeChild;
          break;
      }
    }
    this.childNodes.push(fakeChild);
  };

  /**
   * Recalculates innerHTML, outerHTML properties and hashes
   * @this {FakeDocument}
   * @param  {FakeElement|FakeTextNode=} fake
   */
  p.flushCache = function(fake) {
    fake = fake || this.documentElement;
    fake.childNodes.forEach(this.flushCache, this);
    fake.flushCache();
  };

  /**
   * @param  {Array} changes
   * @param  {FakeElement|FakeTextNode|FakeComment} one
   * @param  {FakeElement|FakeTextNode|FakeComment} two
   */
  function handleAttributeAndPropertyChanges(changes, one, two) {
    if(one.tagName === 'style' && two.tagName === 'style') {
      if(one.innerHTML !== two.innerHTML) {
        changes.push({
          command: 'setProperty',
          params: { node: one, name: 'innerHTML', value: two.innerHTML }
        });
      }
    }

    var diff = _.shallowObjectDiff(one.attrs, two.attrs);
    if(!diff){ return; }

    // If there are changes to attributes we add each one
    // as a separate operation function to `changes` array
    for(var key in diff.set) {
      changes.push({
        command: 'setAttribute',
        params: { node: one, name: key, value: diff.set[key] }
      });
    }

    // arr.push.apply(arr, [...]) is just fancy way to concat one array
    // to another but in place rather than creating a copy like
    // regular concat() method does.
    changes.push.apply(changes, diff.removed.map(function(key) {
      return {
        command: 'removeAttribute',
        params: { node: one, name: key }
      };
    }));
  }

  function handleSimpleCase(changes, one, two) {
    // if identical don't do anything
    if(one.nodeHash === two.nodeHash && one.childHash === two.childHash) {
      return true;
    }

    // these special nodes can't be easily converted
    if(one.tagName === 'script' || two.tagName === 'script' ||
       one.tagName === 'style' || two.tagName === 'style' ||
       one.tagName === 'title' || two.tagName === 'title' ||
       one.tagName === 'meta' || two.tagName === 'meta') {
      return false;
    }

    if(one.childHash != null && one.childHash === two.childHash) { 
      // tag change
      if(one.tagName !== two.tagName) {
        changes.push({
          command: 'rename',
          params: { fromNode: one, toNode: two }
        });
      } else {
        // using `else` instead of regular flow because when changing
        // tags attributes will be automatically transferred from new node
        handleAttributeAndPropertyChanges(changes, one, two);
      }
      return true;
    }

    return false;
  }

  /**
   * Compares two nodes based on real world usage where you rarely
   * see general tags like <span> or <div> being used without `id`
   * or `class` attribute high up in the tree. And other specific
   * cases where you can be fairly certain if you have different
   * elements rather than same one only mutated.
   * 
   * @param  {FakeElement|FakeTextNode} node1
   * @param  {FakeElement|FakeTextNode} node2
   * @return {bool}
   */
  function heuristicallySimilar(node1, node2) {
    var tag = node1.tagName,
        classes1, classes2;

    // first comparing tagnames so that we can use only
    // one in further comparisons
    if(tag !== node2.tagName) {
      return false;
    }

    if(!tag) { // text node
      return false;
    }

    // TODO replace with more general heuristics
    if(node1.nodeHash === node2.nodeHash) {
      return true;
    }

    // If script has src attribute then all contents are ignored
    // so we can compare src'es to determine if it's the same node
    if(tag === 'script') {
      return node1.attrs.src === node2.attrs.src;
    }

    // for style nodes it easier to consider them different nodes
    // if any of the content changed rather trying to parse css
    // inside and determine minimal set of rules, although this
    // is definitely possible to do
    if(tag === 'style') {
      return false;
    }

    // these tags without class or id are too general to be sure
    // that they are indeed same ones
    if(tag === 'div' || tag === 'span' ||
       tag === 'dd' || tag === 'dt' || tag === 'li'
    ) {
      if(node1.attrs.id !== node2.attrs.id) {
        return false;
      } else if(
        (classes1 = node1.attrs['class']) &&
        (classes2 = node2.attrs['class'])
      ){
        // removing extra whitespace and then sort alphabetically
        // to be able to use simple indexOf later to test if 
        // they are similar except for classes added / removed.
        // If one class is replaced with the other it won't work.
        // TODO develop better heuristic to support class replacement
        classes1 = classes1.trim().split(/\s+/).sort().join(' ');
        classes2 = classes2.trim().split(/\s+/).sort().join(' ');

        // test again because class attrubute could consist only of spaces
        if(classes1 && classes2) {
          if(classes1.length > classes2.length) {
            return classes1.indexOf(classes2) > -1;
          } else {
            return classes2.indexOf(classes1) > -1;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Pushes object with given key into map ensuring that
   * if there is a key collision an array will be created
   * @param  {Object} map
   * @param  {string} key
   * @param  {*} value
   */
  function pushWithCollisions(map, key, value) {
    if(map[key]) {
      if(map[key].constructor !== Array) {
        map[key] = [map[key]];
      }
      map[key].push(value);
    } else {
      map[key] = value;
    }
  }
  
  function pushNode(mapSubTree, mapChild, node, parent, ref) {
    var params = {
      ref: ref || null,
      node: node,
      parent: parent
    };

    // Storing both hashes in the map for faster lookup
    pushWithCollisions(mapSubTree, node.subTreeHash, params);
    if(node.childHash != null) {
      pushWithCollisions(mapChild, node.childHash, params);
    }
  }

  function getWithCollisions(map, hash) {
    var result = map[hash];
    if(result && result.constructor === Array) {
      result = result[0];
    }
    return result;
  }

  function deleteWithCollisions(map, hash) {
    if(map[hash] && map[hash].constructor === Array && map[hash].length > 1) {
      map[hash].shift();
    } else {
      delete map[hash];
    }
  }

  /**
   * Iterates down the tree with it's root as `node` and adds to `changes`
   * array insert commands if node isn't found among removed ones.
   * @param  {Array} changes (implicit output)
   * @param  {Object} mapSubTree
   * @param  {Object} mapChildHash
   * @param  {FakeElement|FakeTextNode} node
   * @param  {FakeElement} parent
   * @param  {FakeElement|FakeTextNode} ref
   * @return {boolean}
   */
  function recursiveMerge(changes, mapSubTree, mapChild, node, parent, ref, recursion) {
    var hash = node.childHash == null ? node.subTreeHash : node.childHash,
        found;
    if((found = getWithCollisions(mapSubTree, hash))) {
      // if we found text node it's simple move,
      // so all the extra logic is elements
      if(node.childHash != null) { 
        parent = found.node;
      }
    } else if((found = getWithCollisions(mapChild, hash))) {
      if(!handleSimpleCase(changes, found.node, node)) {
        found = false;
      }
    }

    if(found) {
      var moveChange = {
        command: 'move',
        params: {
          node: found.node,
          parent: parent,
          ref: ref
        }
      };

      changes.push(moveChange);

      // If we are moving into newly created node
      node.parentElement.removeChild(node);

      // avoid matching this removal again with some other node in new tree
      deleteWithCollisions(mapChild, found.node.childHash);
      deleteWithCollisions(mapSubTree, found.node.subTreeHash);
      return true;
    }

    if(!recursion) {
      changes.push({
        command: 'insert',
        params: {
          node: node,
          parent: parent,
          ref: ref,
          recursive: true
        }
      });
    }

    for(var i = node.childNodes.length - 1; i >= 0; --i) {
      recursiveMerge(
        changes, mapSubTree, mapChild,
        node.childNodes[i], node, node.childNodes[i + 1] || null,
        true // recursion flag
      );
    }
  }

  /**
   * @this {FakeDocument}
   * @param  {FakeDocument} doc
   * @return {Array}
   */
  p.merge = function(doc) {
    var changes = [],
        inserted = [],
        removedSubTreeHashes = {},
        removedChildHashes = {},
        root1 = this.documentElement || this.childNodes[0],
        root2 = doc.documentElement || doc.childNodes[0],
        hash, removed, params;
    
    // if not change or only root changed we don't do deep reconciliation
    if(handleSimpleCase(changes, root1, root2)) {
      return changes;
    }

    var stack = [],
        node1, node2, i1, i2,
        childNodes1, childNodes2,
        child1, child2, pair;

    // using arrays for pairs based on this:
    // http://jsperf.com/array-vs-object-as-pair
    stack.push([root1, root2]);

    while((pair = stack.pop())) {
      node1 = pair[0]; i1 = 0; childNodes1 = node1.childNodes;
      node2 = pair[1]; i2 = 0; childNodes2 = node2.childNodes;

      // Comparing children
      childiteration: for(; i1 < childNodes1.length && i2 < childNodes2.length; ++i1, ++i2) {
        child1 = childNodes1[i1];
        child2 = childNodes2[i2];

        if(handleSimpleCase(changes, child1, child2)) {
          continue childiteration;
        }

        // skipping text nodes because they are easy to deal with later
        if(child1.childHash == null) {
          pushNode(removedSubTreeHashes, removedChildHashes, child1, node1);
          --i2;
          continue childiteration;
        }

        if(heuristicallySimilar(child1, child2)){
          handleAttributeAndPropertyChanges(changes, child1, child2);
          stack.push([child1, child2]);
        } else {
          inserted.push({
            node: child2,
            parent: node1,
            ref: child1 || null
          });
          --i1; // next time comparing with same child of old tree
        }
      }

      // if there are still children left in new tree they are also insertions
      for(; i2 < childNodes2.length; ++i2) {
        inserted.push({
          node: childNodes2[i2],
          parent: node1,
          ref: null
        });
      }

      // if there are still children left in old tree they are removed
      for(; i1 < childNodes1.length; ++i1) {
        pushNode(removedSubTreeHashes, removedChildHashes, childNodes1[i1], node1);
      }
    }

    inserted.forEach(function(params){
      recursiveMerge(
        changes, removedSubTreeHashes, removedChildHashes,
        params.node, params.parent, params.ref
      );
    });

    // have to check if we have to move ref node because if we do then
    // another node has to to be used as a reference
    for(var i = 0; i < changes.length; ++i) {
      if(changes[i].command === 'move') {
        for(var j = 0; j < changes.length; ++j) {
          if(changes[j].command === 'move' && changes[j].params.node === changes[i].params.ref) {
            var parent = changes[j].params.node.parentElement,
                // TODO check if this is indeed correct to insert before previous
                newIndex = parent.childNodes.indexOf(changes[j].params.node) - 1;
            if(newIndex >= parent.childNodes.length) {
              changes[i].params.ref = null;
            } else {
              changes[i].params.ref = parent.childNodes[newIndex];
            }
          }
        }
      }
    }

    // This goes through remaining removals and adds them as commands.
    // If there was a hash collision it correctly loops throug that
    // collision array as well.
    for(hash in removedSubTreeHashes) {
      removed = removedSubTreeHashes[hash];
      do {
        params = removed.constructor === Array ? removed.shift() : removed;
        changes.push({
          command: 'remove',
          params: params
        });
      } while(removed.length);
    }

    changes.sort(function(a, b){
      if(a.command === b.command) {
        return 0;
      } else if(a.command === 'insert' || (a.command === 'move' && b.command !== 'insert')) {
        return -1;
      } else {
        return 1;
      }
    });

    return changes;
  };

  return FakeDocument;
});
