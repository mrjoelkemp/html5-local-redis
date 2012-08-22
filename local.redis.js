// Author:  Joel Kemp
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Local Storage
// Notes:   Adds methods to the browser's localStorage object, if exists.

(function (window) {
  "use strict";

  // TODO: Fallback to some other means of storage
  if (! window.localStorage) return;

  var storage = window.localStorage;
  var proto   = window.localStorage.constructor.prototype;

  // get
  // Returns: [num | string | object | null] The value associated with the passed key, if it exists.
  // Note:    Auto JSON parses
  proto.get = function(key) {
    return JSON.parse(storage.getItem(key));
  };

  // set
  // Stores the passed value indexed by the passed key
  // Note: Auto stringifies
  proto.set = function(key, value) {

    // Stringify the key and value, if necessary
    value = (typeof value === "string") ? value : JSON.stringify(value);
    key   = (typeof key   === "string") ? key   : JSON.stringify(key);

    // Use the default setItem
    storage.setItem(key, value);
  };

  // mget
  // Returns: A list of values for the passed key(s).
  // Note:    Values match keys by index.
  // Usage:   mget('key1', 'key2', 'key3') or mget(['key1', 'key2', 'key3'])
  proto.mget = function(key) {
    var results = [];

    if (key instanceof Array) {
      for (var i in key) {
        results[results.length] = proto.get(key[i]);
      }
    } else {
      for (var j in arguments) {
        results[results.length] = proto.get(arguments[j]);
      }
    }

    return results;
  };

})(window);