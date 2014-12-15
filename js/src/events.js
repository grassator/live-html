define(function(){
  /* global Element */
  var originalAddEventListener = Element.prototype.addEventListener,
      events = []; // keep a list of event listeners

  function interceptor(name, func, capture) {
    // saving listener so we can later reattach it to updated node.
    events.push({
      'type'       : name,
      'function'   : func,
      'useCapture' : capture,
      'element'    : this
    });

    // register the listener so the page doesn't break
    originalAddEventListener.apply(this, arguments);
  }

  // hijack the addEventListener method to keep track of subscriptions
  window.addEventListener = Element.prototype.addEventListener = interceptor;

  return {
    original: originalAddEventListener,
    events: events
  };
});
