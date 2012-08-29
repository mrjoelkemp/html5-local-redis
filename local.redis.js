// Author:  Joel Kemp
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Local Storage
// Notes:   Adds methods to the browser's localStorage object, if exists.

(function (window) {
  "use strict";

  // TODO: Fallback to some other means of storage - polyfills exist
  if (! window.localStorage) {
    // Set the localStorage object to {}
    // Create getItem, setItem, and key methods
    // Create JSON.stringify if it doesn't exist
    return;
  }

  // Using the prototype grants both localStorage and sessionStorage the redis methods
  var proto = window.localStorage.constructor.prototype;

  ///////////////////////////
  // Expiration Helpers
  ///////////////////////////

  // Used for expiration key generation
  var expDelimiter = ':',
      expKeyPrefix = 'exp';

  // Creates the expiration key format for a given storage key
  // Returns: the expiration key associated with the passed storage key
  proto._createExpirationKey = function (storageKey) {
    // Stringify if it's an object
    storageKey = (typeof storageKey === 'string') ? storageKey : JSON.stringify(storageKey);
    return expKeyPrefix + expDelimiter + storageKey;
  };

  // Creates the expiration value/data format for an expiration
  //  event's ID and millisecond delay
  // Returns: A string representation of an object created from the data
  // Note:    Keys are as short as possible to save space when stored
  proto._createExpirationValue = function (timeoutID, delay) {
    return JSON.stringify({
      id: timeoutID,
      d: delay
    });
  };

  // Retrieves the expiration data associated with the storage key
  // Precond: key is storage key
  // Returns: A parsed expiration value object of the retrieved data
  proto._getExpirationValue = function (storageKey) {
    var expKey = this._createExpirationKey(key),
        expVal = this.get(expKey);

    return expVal;
  }

  // Creates expiration data for the passed storage key and its
  //  expiration event's data
  proto._setExpirationOf = function (storageKey, timeoutID, delay) {
    var expKey = this._createExpirationKey(storageKey),
        expVal = this._createExpirationValue(timeoutID, delay);

    this.set(expKey, expVal);
  };


  ///////////////////////////
  // Key Commands
  ///////////////////////////

  // get
  // Returns: [number | string | object | null] The value associated with the passed key, if it exists.
  // Note:    Auto JSON parses
  proto.get = function(key) {
    key = (typeof key === 'string') ? key : JSON.stringify(key);

    var res = this.getItem(key);

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
    value = (typeof value === 'string') ? value : JSON.stringify(value);
    key   = (typeof key   === 'string') ? key   : JSON.stringify(key);

    // Use the default setItem
    try {
      this.setItem(key, value);
    } catch (e) {
      if (e === QUOTA_EXCEEDED_ERR) {
        throw e;
      }
    }
    // Makes chainable
    return this;
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
      results[results.length] = this.get(keys[i]);
    }

    return results;
  };

  // mset
  // Allows the setting of multiple key value pairs
  // Usage:   mset('key1', 'val1', 'key2', 'val2') or mset(['key1', 'val1', 'key2', 'val2'])
  // Notes:   If there's an odd number of elements, unset values default to undefined
  proto.mset = function (keysVals) {
    var isArray   = keysVals instanceof Array,
        isObject  = keysVals instanceof Object,
        i, l, prop;

    if (isArray) {
      for (i = 0, l = keysVals.length; i < l; i += 2) {
        this.set(keysVals[i], keysVals[i + 1]);
      }
    } else if (isObject) {
      for (prop in keysVals) {
        this.set(prop, keysVals[prop]);
      }
    } else {
      for (i = 0, l = arguments.length; i < l; i += 2) {
        this.set(arguments[i], arguments[i + 1]);
      }
    }

    return this;
  };

  // incr
  // If the key does not exists, incr sets it first
  proto.incr = function (key) {
    this.incrby(key, 1);
  };

  // incrby
  // If the key does not exists, incrby sets it first
  proto.incrby = function (key, amount) {
    var value = this.get(key);

    // Should test that it is not NaN before addition, to avoid
    // cases with strings.
    if (!isNaN(parseInt(value, 10))) {
      value += amount;
    } else {
      value = 0 + amount;
    }
    this.set(key, value);
  };

  // mincr
  proto.mincr = function (keys) {
    var i, l;
    keys = (keys instanceof Array) ? keys : arguments;
    for(i = 0, l = keys.length; i < l; i++) {
      this.incr(keys[i]);
    }
  };

  // mincrby (custom)
  // Usage:   mincrby('key1', 1, 'key2', 4) or
  //          mincrby(['key1', 1, 'key2', 2]) or
  //          mincrby({'key1': 1, 'key2': 2})
  proto.mincrby = function (keysAmounts) {
    var i, l, key;

    if (typeof keysAmounts === 'string') {
      // String literals need to be 'boxed' in order to register as an instance.
      keysAmounts = new String(keysAmounts);
    }

    if (keysAmounts instanceof Array || keysAmounts instanceof String) {
      keysAmounts = (keysAmounts instanceof Array) ? keysAmounts : arguments;
      // Need to make sure an even number of arguments is passed in
      if ((keysAmounts.length & 0x1) !== 0) {
        return;
      }
      for (i = 0, l = keysAmounts.length; i < l; i += 2) {
        this.incrby(keysAmounts[i], keysAmounts[i + 1]);
      }
    } else if (keysAmounts instanceof Object) {
      for (key in keysAmounts) {
        this.incrby(key, keysAmounts[key]);
      }
    }
  };

  // decr

  // decrby

  // mdecrby

  // del
  // Removes the specified key(s)
  // Returns: the number of keys removed.
  // Note:    if the key doesn't exist, it's ignored.
  // Usage:   del('k1') or del('k1', 'k2') or del(['k1', 'k2'])
  proto.del = function (key) {
    var numKeysDeleted = 0,
        i, l;

    key = (key instanceof Array) ? key : arguments;

    for (i = 0, l = key.length; i < l; i++) {
      if (this.exists(key[i])) {
        this.removeItem(key[i]);
        ++numKeysDeleted;
      }
    }

    return numKeysDeleted;
  };

  // exists
  // Returns: 1 if the key exists, 0 if they key doesn't exist.
  // Throws:  TypeError if more than one argument is supplied
  proto.exists = function (key) {
    if (arguments.length > 1) {
      throw new TypeError('exists: wrong number of arguments');
    }

    return (this.get(key) !== null) ? 1 : 0;
  };

  // rename
  // Renames key to newkey
  // Returns:
  // Throws:  TypeError if key == newkey
  //          ReferenceError if key does not exist
  // Usage:  rename(key, newkey)
  proto.rename = function (key, newkey) {
    if (arguments.length !== 2) {
      throw new TypeError('rename: wrong number of arguments');
    } else if (key === newkey) {
      throw new TypeError('rename: source and destination objects are the same');
    } else if (! this.exists(key)) {
      throw new ReferenceError('rename: no such key');
    }

    var val = this.get(key);
    this.set(newkey, val);
    this.del(key);
  };

  // renamenx
  // Renames key to newkey if newkey does not exist
  // Returns: 1 if key was renamed; 0 if newkey already exists
  // Usage:   renamenx(key, newkey)
  // Throws:  TypeError if key == newkey
  //          ReferenceError if key does not exist
  //          Fails under the same conditions as rename
  proto.renamenx = function (key, newkey) {
    if (arguments.length !== 2) {
      throw new TypeError('renamenx: wrong number of arguments');
    } else if (key === newkey) {
      throw new TypeError('renamenx: source and destination objects are the same');
    } else if (! this.exists(key)) {
      throw new ReferenceError('renamenx: no such key');
    }

    if(this.exists(newkey)) {
      return 0;
    } else {
      this.rename(key, newkey);
      return 1;
    }
  };

  // getKey (custom)
  // Retrieves the first key associated with the passed value
  // Returns:   [key | keys | null]
  //            a single key or
  //            a list of keys if true is passed as second param or
  //            null if no keys were found
  // Params:    all = whether or not to retrieve all of the keys that match
  proto.getKey = function (val) {
    if (arguments.length > 2) {
      throw new TypeError('getKey: wrong number of arguments');
    }

    var i, l, k, v, keys = [], all;

    // Get whether or not the all flag was set
    all = !! arguments[1];

    // Look for keys with a value that matches val
    for (i = 0, l = this.length; i < l; i++) {
      k = this.key(i);
      v = this.getItem(k);

      if (val === v) {
        keys.push(k);
        if (! all) break;
      }
    }

    // Return the single element or null if undefined
    // Otherwise, return the populated array
    if (keys.length === 1) {
      keys = keys[0];
    } else if (! keys.length) {
      keys = null;
    }

    return keys;
  };

  // getset
  // Sets key to value and returns the old value stored at key
  // Throws:  Error when key exists but does not hold a string value
  // Usage:   getset(key, value)
  // Returns: the old value stored at key or null when the key does not exist
  proto.getset = function (key, value) {
    // Grab the existing value or null if the key doesn't exist
    var oldVal = this.get(key);

    // Throw an exception if the value isn't a string
    if (typeof oldVal !== 'string' && oldVal !== null) {
      throw new Error('getset: not a string value');
    }

    this.set(key, value);
    return oldVal;
  };

  // expire
  // Returns: 1 if the timeout was set
  //          0 if the key does not exist or the timeout couldn't be set
  // Notes:   We "refresh" an existing expire by clearing it and creating a new one
  proto.expire = function (key, delay) {
    var expKey = this._createExpirationKey(key),
        that   = this,
        tid;

    // Delete an existing expiration, if any
    // del won't fail if the key doesn't exist
    this.del(expKey);

    tid = setTimeout(function () {
      that.del(key);
      // Remove key's expiration information
      that.del(expKey);
    }, delay);

    // Create the key's new expiration data
    this._setExpirationOf(key, tid, delay);
  };

  // rpush

  // lpush

  // lrange

  // llen

  // lpop

  // rpop

  // sadd

  // srem

})(window);