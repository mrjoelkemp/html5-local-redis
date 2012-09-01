// Authors: Joel Kemp and Eudis Duran
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Storage Objects

(function (window, exp) {
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
  // Storage Internals
  ///////////////////////////

  // Redis commands typically have side effects and so we should
  //  be cautious to include calls to those functions when requiring
  //  storage operations with no side effects.
  // These internal functions are safer to use for storage within commands

  // Stores the key/value pair
  // Note:    Auto-stringifies non-strings
  // Throws:  Exception on reaching the storage quota
  proto._store = function (key, value) {
    key   = (typeof key   !== 'string') ? JSON.stringify(key)   : key;
    value = (typeof value !== 'string') ? JSON.stringify(value) : value;

    try {
      this.setItem(key, value);
    } catch (e) {
      if (e === QUOTA_EXCEEDED_ERR) {
        throw e;
      }
    }
  };

  // Returns the (parsed) value associated with the given key
  proto._retrieve = function (key) {
    key = (typeof key !== 'string') ? JSON.stringify(key) : key;

    var res = this.getItem(key);

    try {
      // If it's a literal string, parsing will fail
      res = JSON.parse(res);
    } catch (e) {
      // We couldn't parse the literal string
      // so just return the literal in the finally block.
    } finally {
      return res;
    }
  };

  // Remove the key/value pair identified by the passed key
  // Note:  Auto stringifies non-strings
  proto._remove = function (key) {
    key = (typeof key !== 'string') ? JSON.stringify(key) : key;
    this.removeItem(key);
  };

  // Returns true if the key exists, false otherwise.
  proto._exists = function (key) {
    return !! this._retrieve(key);
  };

  ///////////////////////////
  // Key Commands
  ///////////////////////////

  // get
  // Returns: [number | string | object | null] The (parsed) value associated with the passed key, if it exists.
  proto.get = function(key) {
    return this._retrieve(key);
  };

  // set
  // Stores the passed value indexed by the passed key
  // Notes:   Auto stringifies
  //          resets an existing expiration if set was called directly
  proto.set = function(key, value) {
    try {
      this._store(key, value);
      // Reset the expiration of the key, if it should expire
      if (exp.hasExpiration(key, this)) {
        this.expire(key, exp.getExpirationDelay(key, this));
      }
    } catch (e) {
      throw e;
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
      results[results.length] = this._retrieve(keys[i]);
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
        this._store(keysVals[i], keysVals[i + 1]);
      }
    } else if (isObject) {
      for (prop in keysVals) {
        this._store(prop, keysVals[prop]);
      }
    } else {
      for (i = 0, l = arguments.length; i < l; i += 2) {
        this._store(arguments[i], arguments[i + 1]);
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
    var value = this._retrieve(key);

    // Should test that it is not NaN before addition, to avoid
    // cases with strings.
    if (!isNaN(parseInt(value, 10))) {
      value += amount;
    } else {
      value = 0 + amount;
    }
    this._store(key, value);
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
  // Notes:   if the key doesn't exist, it's ignored.
  //          clears existing expirations on the keys
  // Usage:   del('k1') or del('k1', 'k2') or del(['k1', 'k2'])
  proto.del = function (keys) {
    var numKeysDeleted = 0,
        i, l;

    keys = (keys instanceof Array) ? keys : arguments;

    for (i = 0, l = keys.length; i < l; i++) {

      if (this._exists(keys[i])) {
        exp.removeExpirationOf(keys[i], this);
        this._remove(keys[i]);
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

    return (this._exists(key)) ? 1 : 0;
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
    } else if (! this._exists(key)) {
      throw new ReferenceError('rename: no such key');
    }

    var val = this._retrieve(key);
    this._store(newkey, val);
    this._remove(key);
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
    } else if (! this._exists(key)) {
      throw new ReferenceError('renamenx: no such key');
    }

    if(this._exists(newkey)) {
      return 0;
    } else {
      // Call rename command to refresh an existing expiration
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
    var oldVal = this._retrieve(key);

    // Throw an exception if the value isn't a string
    if (typeof oldVal !== 'string' && oldVal !== null) {
      throw new Error('getset: not a string value');
    }

    // Use set to refresh an existing expiration
    this.set(key, value);
    return oldVal;
  };

  // expire
  // Expires the passed key after the passed seconds
  // Precond: delay in seconds
  // Returns: 1 if the timeout was set
  //          0 if the key does not exist or the timeout couldn't be set
  // Notes:   We "refresh" an existing expire by clearing it and creating a new one
  proto.expire = function (key, delay) {
    var expKey = exp.createExpirationKey(key),
        that   = this,
        msInSec= 1000,
        tid;

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);
    if (! delay) {
      throw new TypeError('expire: delay should be convertible to a number');
    }

    // Convert the delay to ms (1000ms in 1s)
    delay *= 1000;

    // Create an async task to delete the key
    // If the key doesn't exist, then the deletions do nothing
    tid = setTimeout(function () {
      // Avoid calling del() for side effects
      that._remove(key);
      that._remove(expKey);
    }, delay);

    // If the key didn't exist or the timeout couldn't be set
    if (! (this._exists(key) && tid)) {
      return 0;
    }

    // Delete an existing expiration
    if (exp.hasExpiration(key, this)) {
      // Should cancel existing timeout
      clearTimeout(exp.getExpirationID(key, this));
      this._remove(expKey);
    }

    // Create the key's new expiration data
    exp.setExpirationOf(key, tid, delay, this);
    return 1;
  };

  // rpush

  // lpush

  // lrange

  // llen

  // lpop

  // rpop

  // sadd

  // srem

})(window, LocalRedis.Utils.Expiration);