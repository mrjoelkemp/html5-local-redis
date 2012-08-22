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
  // Returns: [number | string | object | null] The value associated with the passed key, if it exists.
  // Note:    Auto JSON parses
  proto.get = function(key) {
    var res = storage.getItem(key);

    try {
      // If it's a literal string, parsing will fail
      res = JSON.parse(res);
    } finally {
      return res;
    }
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
  proto.mget = function(keys) {
    var results = [];

    // Determine the form of the parameters
    keys = (keys instanceof Array) ? keys : arguments;

    // Retrieve the value for each key
    for (var i in keys) {
      results[results.length] = proto.get(keys[i]);
    }

    return results;
  };

  // mset
  // Allows the setting of multiple key value pairs
  // Usage:   mset('key1', 'val1', 'key2', 'val2') or mset(['key1', 'val1', 'key2', 'val2'])
  proto.mset = function (keysVals) {

    // TODO: Allow passing in an object of keys values. Could this be something cool? {key1: val1, key2: val2}
    keysVals = (keysVals instanceof Array) ? keysVals : arguments;

    // If there's an odd number of elements, unset values default to undefined
    for (var i = 0, l = keysVals.length; i < l; i += 2) {
      proto.set(keysVals[i], keysVals[i + 1]);
    }
  };

  // incr
  proto.incr = function (key) {
  };

  // incrby
  proto.incrby = function (key, amount) {
  };

  // mincr
  proto.mincr = function (keys) {
  };

  // mincrby
  // Usage:   mincrby('key1', 1, 'key2', 4) or mincrby(['key1', 1, 'key2', 2])
  proto.mincrby = function (keysAmounts) {
  };

  // decr

  // decrby

  // mdecrby

  // del

  // expire

  // rpush

  // lpush

  // lrange

  // llen

  // lpop

  // rpop

  // sadd

  // srem
  
})(window);