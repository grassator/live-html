define(function () {
  var exports = {};

  /**
   * Hashes string with a guarantee that if you need to hash a new string
   * that contains already hashed string at it's start, you can pass only
   * added part of that string along with the hash of already computed part
   * and will get correctly hash as if you passed full string.
   * 
   * @param  {string} str
   * @param  {number=} hash
   * @return {number}
   */
  exports.hash = function (str, hash) {
    hash = hash || 5381;

    // alghorithm by Dan Bernstein
    var i = -1, length = str.length;

    while(++i < length) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return hash;
  };

  var entityDecoder = document.createElement('div');

  /**
   * Correctly decodes all hex, decimal and named entities
   * @param  {string} text
   * @return {string}
   */
  exports.decodeHtmlEntities = function(text){
    return text.replace(/&(?:#(x)?(\d+)|(\w+));/g, function(match, hexFlag, decOrHex, name) {
      if(decOrHex) {
        return String.fromCharCode(parseInt(decOrHex, hexFlag ? 16 : 10));
      }
      switch(name) {
        case 'lt':
          return '<';
        case 'gt':
          return '>';
        case 'amp':
          return '&';
        case 'quote':
          return '"';
        default:
          entityDecoder.innerHTML = '&' + name + ';';
          return entityDecoder.textContent;
      }
    });
  };

  /**
   * Calculates shallow difference between two object
   * @param  {Object} one
   * @param  {Object} other
   * @return {Object}
   */
  exports.shallowObjectDiff = function(one, other) {
    // since we will be calling setAttribute there is no need to
    // differentiate between changes and additions
    var set = {},
        removed = [],
        haveChanges = false,
        keys = Object.keys(one),
        length, key, i;

    // first go through all keys of `one`
    for(i = 0, length = keys.length; i < length; ++i) {
      key = keys[i];
      if(other[key] != null) {
        if(one[key] !== other[key]) {
          set[key] = other[key];
          haveChanges = true;
        }
      } else {
        removed.push(key);
        haveChanges = true;
      }
    }

    // then add all missing from the `other` into `one`
    keys = Object.keys(other);
    for(i = 0, length = keys.length; i < length; ++i) {
      key = keys[i];
      if(one[key] == null) {
        set[key] = other[key];
        haveChanges = true;
      }
    }

    return haveChanges ? { set: set, removed: removed } : false;
  };
  
  return exports;
});
