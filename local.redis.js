// Author:  Joel Kemp
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Local Storage
// Notes:   Adds methods to the browser's localStorage object, if exists.

(function (window) {
  "use strict";

  // TODO: Fallback to some other means of storage
  if (! window.localStorage) return;

  var storage = window.localStorage;
  var proto   = Object.getPrototypeOf(window.localStorage);

  // get
  // Returns: [num | string | object | null] The value associated with the passed key, if it exists.
  // Params:  parse = Whether or not to return the data in its intended datatype/form. Default is true.
  proto.get = function(key, parse) {
    parse = (parse === true) ? true : false;

    var val = storage.getItem(key);

    // Return the value's parsed or string representation
    return (parse === true) ? JSON.parse(val) : val;
  };

  // set
  // Stores the passed value indexed by the passed key
  // Note: Auto stringifies
  proto.set = function(key, value) {
    // Stringify the key and value, if necessary
    value = (typeof value !== 'string') ? JSON.stringify(value) : value;
    key   = (typeof key   !== 'string') ? JSON.stringify(key)   : key;

    // Use the default setItem
    storage.setItem(key, value);
  };

  // mget
  // Returns: A list of values for the passed key(s).
  // Note:    Values match keys by index.
  proto.mget = function(key) {
    var results = [];

    results[0] = proto.get(key);

    // If there are additional arguments, get each
    if (arguments.length) {
      for (var i in arguments) {
        results[results.length] = proto.get(arguments[i]);
      }
    }
  };

})(window);