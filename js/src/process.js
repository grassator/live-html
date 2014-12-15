define(function(){
  /**
   * @param  {{node: FakeElement, parent: FakeElement, position: number}}  params
   */
  function insert(params) {
    var el = params.node.toDomNode(!!params.recursive);

    if(!params.ref) { // special case for insertion on last position
      params.parent.appendChild(params.node);
      params.parent.real.appendChild(el);
    } else {
      params.parent.insertBefore(params.node, params.ref);
      params.parent.real.insertBefore(el, params.ref.real);
    }
  }

  /**
   * @param  {{node: FakeElement, parent: FakeElement}}  params
   */
  function remove(params) {
    params.parent.real.removeChild(params.node.real);
    params.parent.removeChild(params.node);
    params.node.real = null;
  }

  /**
   * @param  {{node: FakeElement, parent: FakeElement, position: number}}  params
   */
  function move(params) {
    if(!params.ref) { // special case for insertion on last position
      params.parent.real.appendChild(params.node.real);
      params.parent.appendChild(params.node);
    } else {
      params.parent.real.insertBefore(params.node.real, params.ref.real);
      params.parent.insertBefore(params.node, params.ref);
    }
  }

  /**
   * @param  {{node: FakeElement, name: string, value: string}}  params
   */
  function setProperty(params) {
    params.node[params.name] = params.value;
    params.node.real[params.name] = params.value;
  }

  /**
   * @param  {{node: FakeElement, name: string, value: string}}  params
   */
  function setAttribute(params) {
    params.node.setAttribute(params.name, params.value);
    params.node.real.setAttribute(params.name, params.value);
  }

  /**
   * @param  {{node: FakeElement, name: string}}  params
   */
  function removeAttribute(params) {
    params.node.removeAttribute(params.name);
    params.node.real.removeAttribute(params.name);
  }

  /**
   * @param  {{fromNode: FakeElement, toNode: FakeElement}}  params
   */
  function rename(params) {
    var el = params.toNode.toDomNode(),
        fromReal = params.fromNode.real,
        childNodes = params.fromNode.real.childNodes;

    // moving children to a new node
    while(childNodes.length) {
      el.appendChild(childNodes[0]);
    }

    // TODO transfer events here
    fromReal.parentElement.insertBefore(el, fromReal);
    fromReal.parentElement.removeChild(fromReal);

    params.fromNode.mutateInto(params.toNode);
  }

  var commandRegistry = {
    "insert": insert,
    "remove": remove,
    "move": move,
    "setProperty": setProperty,
    "setAttribute": setAttribute,
    "removeAttribute": removeAttribute,
    "rename": rename
  };

  /**
   * @param  {Array.<{command: string, params: Object}>}  changes
   */
  return function(changes) {
    var length = changes.length,
        i, command;

    for(i = 0; i < length; ++i) {
      if((command = commandRegistry[changes[i].command])) {
        command(changes[i].params);
      } else {
        throw "Unrecognized command '" + changes[i].command + "'.";
      }
    }
  };
});
