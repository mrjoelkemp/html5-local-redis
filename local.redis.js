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
  proto.mget = function(keys) {
    var results = [];

    if (keys instanceof Array) {
      for (var i in keys) {
        results[results.length] = proto.get(keys[i]);
      }
    } else {
      for (var j in arguments) {
        results[results.length] = proto.get(arguments[j]);
      }
    }

    return results;
  };

  // mset
  // Allows the setting of multiple key value pairs
  // Usage:   mset('key1', 'val1', 'key2', 'val2') or mset(['key1', 'val1', 'key2', 'val2'])
  proto.mset = function (keyVals) {

  // TODO: Allow passing in an object of keys values. Could this be something cool? {key1: val1, key2: val2}

    if (keyVals instanceof Array) {
      // If there's an odd number of elements, unset values default to undefined
      for (var i = 0; i < keyVals.length; i += 2) {
        proto.set(keyVals[i], keyVals[i + 1]);
      }
    } else {
      for (var j = 0; j < arguments.length; j += 2) {
        proto.set(arguments[j], arguments[j + 1]);
      }
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

})(window);