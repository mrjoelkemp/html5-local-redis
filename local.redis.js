// Authors: Joel Kemp and Eudis Duran
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Storage Objects
// Usage:   window.localStorage.command where command is any of the
//          supported redis-like commands. window.sessionStorage can also be used.

// Fetch the utils
var LocalRedis    = LocalRedis || {};
LocalRedis.Utils  = LocalRedis.Utils || {};

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
  // be cautious to include calls to those functions when requiring
  // storage operations with no side effects.
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

  // Returns true if the key(s) exists, false otherwise.
  // Notes:   A key with a set value of null still exists.
  // Usage:   _exists('foo') or _exists(['foo', 'bar'])
  proto._exists = function (key) {
    var allExist = true,
    i, l;

    if (key instanceof Array) {
      for (i = 0, l = key.length; i < l; i++) {
        if (! this.hasOwnProperty(key[i])) {
          allExist = false;
        }
      }
    } else {
      allExist = !! this.hasOwnProperty(key);
    }

    return allExist;
  };

  ///////////////////////////
  // Key Commands
  ///////////////////////////

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

  // Returns: 1 if the key exists, 0 if they key doesn't exist.
  // Throws:  TypeError if more than one argument is supplied
  proto.exists = function (key) {
    if (arguments.length > 1) {
      throw new TypeError('exists: wrong number of arguments');
    }

    return (this._exists(key)) ? 1 : 0;
  };

  // Renames key to newkey
  // Throws:  TypeError if key == newkey
  //          ReferenceError if key does not exist
  // Usage:   rename(key, newkey)
  // Notes:   Transfers the key's TTL to the newKey
  proto.rename = function (key, newKey) {
    if (arguments.length !== 2) {
      throw new TypeError('rename: wrong number of arguments');
    } else if (key === newKey) {
      throw new TypeError('rename: source and destination objects are the same');
    } else if (! this._exists(key)) {
      throw new ReferenceError('rename: no such key');
    }

    // Remove newKey's existing expiration
    // since newKey inherits all characteristics from key
    if (exp.hasExpiration(newKey, this)) {
      exp.removeExpirationOf(newKey, this);
    }

    var val = this._retrieve(key);
    this._store(newKey, val);

    // Transfer an existing expiration to newKey
    if (exp.hasExpiration(key, this)) {
      // Get the TTL
      var ttl = exp.getExpirationTTL(key, this);

      // Transfer the TTL (ms) to the new key
      this.pexpire(newKey, ttl);

      // Remove the old key's expiration
      exp.removeExpirationOf(key, this);
    }

    this._remove(key);
  };

  // Renames key to newkey if newkey does not exist
  // Returns: 1 if key was renamed; 0 if newkey already exists
  // Usage:   renamenx(key, newkey)
  // Notes:   Does not affect expiry
  // Throws:  TypeError if key == newkey
  //          ReferenceError if key does not exist
  //          Fails under the same conditions as rename
  proto.renamenx = function (key, newKey) {
    if (arguments.length !== 2) {
      throw new TypeError('renamenx: wrong number of arguments');
    } else if (key === newKey) {
      throw new TypeError('renamenx: source and destination objects are the same');
    } else if (! this._exists(key)) {
      throw new ReferenceError('renamenx: no such key');
    }

    if(this._exists(newKey)) {
      return 0;
    } else {
      var val = this._retrieve(key);
      this._store(newKey, val);
      this._remove(key);
      return 1;
    }
  };

  // Retrieves the first key associated with the passed value
  // Returns:   a single key or
  //            a list of keys if true is passed as second param or
  //            null if no keys were found
  // Params:    all = whether or not to retrieve all of the keys that match
  // Notes:     Custom, non-redis method
  proto.getkey = function (val) {
    if (arguments.length > 2) {
      throw new TypeError('getkey: wrong number of arguments');
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

  // expire
  // Expires the passed key after the passed seconds
  // Precond: delay in seconds
  // Returns: 1 if the timeout was set
  //          0 if the key does not exist or the timeout couldn't be set
  proto.expire = function (key, delay) {
    if (arguments.length !== 2) {
      throw new TypeError('expire: wrong number of arguments');
    }

    var expKey = exp.createExpirationKey(key),
        that   = this,
        tid;

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);
    if (! delay) {
      throw new TypeError('expire: delay should be convertible to a number');
    } else if(! this._exists(key)) {
      return 0;
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

    // If then timeout couldn't be set
    if (! tid) return 0;

    // Subsequent calls to expire on the same key
    // will refresh the expiration with the new delay
    if (exp.hasExpiration(key, this)) {
      exp.removeExpirationOf(key, this);
    }

    // Create the key's new expiration data
    exp.setExpirationOf(key, tid, delay, new Date().getTime(), this);
    return 1;
  };

  // Expiry in milliseconds
  // Returns: the same output as expire
  proto.pexpire = function (key, delay) {
    if (arguments.length !== 2) {
      throw new TypeError('pexpire: wrong number of arguments');
    }

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);
    if (! delay) {
      throw new TypeError('pexpire: delay should be convertible to a number');
    }

    // Expire will convert the delay to seconds,
    // so we account for that by canceling out the conversion from ms to s
    return this.expire(key, delay / 1000);
  };

  // Removes the expiration associated with the key
  // Returns:   0 if the key does not exist or does not have an expiration
  //            1 if the expiration was removed
  proto.persist = function (key) {
    if (arguments.length !== 1) {
      throw new TypeError('persist: wrong number of arguments');
    }

    if (! (this._exists(key) && exp.hasExpiration(key, this))) {
      return 0;
    } else {
      clearTimeout(exp.getExpirationID(key, this));
      this._remove(exp.createExpirationKey(key));
      return 1;
    }
  };

  // Returns: the time to live in seconds
  //          -1 when key does not exist or does not have an expiration
  // Notes:   Due to the possible delay between expiration timeout
  //          firing and the callback execution, this ttl only reflects
  //          the TTL for the timeout firing
  proto.ttl = function (key) {
    if (arguments.length !== 1) {
      throw new TypeError('ttl: wrong number of arguments');
    }

    if(! (this._exists(key) && exp.hasExpiration(key, this))) {
      return -1;
    }

    // 1sec = 1000ms
    return exp.getExpirationTTL(key, this) / 1000;
  };

  // Returns: the time to live in milliseconds
  //          -1 when key does not exist or does not have an expiration
  // Note:    this command is just like ttl with ms units
  proto.pttl = function (key) {
    if (arguments.length !== 1) {
      throw new TypeError('pttl: wrong number of arguments');
    }

    return this.ttl(key) * 1000;
  };

  // Returns:   a random key from the calling storage object.
  //            null when the database is empty
  proto.randomkey = function () {
    var keys = Object.keys(this),
        length = this.length,
        // Random position within the list of keys
        rindex = Math.floor(Math.random() * length);


    if (! length) {
      return null;
    }

    return keys[rindex];
  };

  // Returns:   all keys matching the supplied pattern
  proto.keys = function (pattern) {
    var regex = new RegExp(pattern),
        i, l,
        results = [],
        keys = Object.keys(this);

    for (i = 0, l = keys.length; i < l; i++) {
      if (regex.test(keys[i])) {
        results.push(keys[i]);
      }
    }

    return results;
  };

  ///////////////////////////
  // String Commands
  ///////////////////////////

  // Returns: The (parsed) value associated with the passed key, if it exists.
  proto.get = function(key) {
    return this._retrieve(key);
  };

  // Stores the passed value indexed by the passed key
  // Notes:   Auto stringifies
  //          resets an existing expiration if set was called directly
  proto.set = function(key, value) {
    var hasExpiration = exp.hasExpiration(key, this),
        expDelay;

    try {
      this._store(key, value);
      // Cancel the expiration of the key
      if (hasExpiration) {
        expDelay = exp.getExpirationDelay(key, this);

        this.persist(key);
      }
    } catch (e) {
      throw e;
    }

    // Makes chainable
    return this;
  };

  // Sets key to value and returns the old value stored at key
  // Throws:  Error when key exists but does not hold a string value
  // Usage:   getset(key, value)
  // Notes:   Removes an existing expiration for key
  // Returns: the old value stored at key or null when the key does not exist
  proto.getset = function (key, value) {
    if (arguments.length !== 2) {
      throw new TypeError('getset: wrong number of arguments');
    }

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

  // Returns: A list of values for the passed key(s).
  // Note:    Values match keys by index.
  // Usage:   mget('key1', 'key2', 'key3') or mget(['key1', 'key2', 'key3'])
  proto.mget = function(keys) {
    var results = [],
        i, l;

    // Determine the form of the parameters
    keys = (keys instanceof Array) ? keys : arguments;

    // Retrieve the value for each key
    for (i = 0, l = keys.length; i < l; i++) {
      results[results.length] = this._retrieve(keys[i]);
    }

    return results;
  };

  // Allows the setting of multiple key value pairs
  // Usage:   mset('key1', 'val1', 'key2', 'val2') or
  //          mset(['key1', 'val1', 'key2', 'val2']) or
  //          mset({key1: val1, key2: val2})
  // Notes:   If there's an odd number of elements,
  //          unset values default to undefined.
  proto.mset = function (keysVals) {
    var isArray   = keysVals instanceof Array,
        isObject  = keysVals instanceof Object,
        i, l,
        keys;

    // Arrays are both an array and an object
    // but an object is solely an object
    if (isObject && !isArray) {
      keys = Object.keys(keysVals);
      for (i = 0, l = keys.length; i < l; i++) {
        this._store(keys[i], keysVals[keys[i]]);
      }
    } else {

      keysVals = isArray ? keysVals : arguments;

      for (i = 0, l = keysVals.length; i < l; i += 2) {
        this._store(keysVals[i], keysVals[i + 1]);
      }
    }

    return this;
  };

  // Sets the given keys to their respective values.
  // Returns:   1 if the all the keys were set.
  //            0 if no key was set (at least one key already existed).
  // Notes:     Accepts the same types of params as mset.
  //            If just a single key already exists,
  //            no set operations are performed
  proto.msetnx = function (keysVals) {
    var isArray = keysVals instanceof Array,
        isObject = keysVals instanceof Object,
        i, l,
        keys = [];

    // Grab all of the keys
    if (isObject && ! isArray) {
      keys = Object.keys(keysVals);
    } else {
      keysVals = isArray ? keysVals : arguments;
      for (i = 0, l = keysVals.length; i < l; i += 2) {
        keys.push(keysVals[i]);
      }
    }

    // If any key exists, then don't store anything
    for (i = 0, l = keys.length; i < l; i++) {
      if (this._exists(keys[i])) {
        return 0;
      }
    }

    // We don't call mset because splat arguments
    // are passed in as an object, when it should be
    // processed like an array
    for (i = 0, l = keysVals.length; i < l; i += 2) {
      this._store(keysVals[i], keysVals[i + 1]);
    }
    return 1;
  };

  // Sets key to value and returns the old value stored at key
  // Throws:  Error when key exists but does not hold a string value
  // Usage:   getset(key, value)
  // Notes:   Removes an existing expiration for key
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

  // If the key does not exist, incr sets it to 1
  proto.incr = function (key) {
    if (arguments.length !== 1) {
      throw new TypeError('incr: wrong number of arguments');
    }
    var value          = this._retrieve(key),
        keyType        = typeof key,
        valType        = typeof value,
        parsedValue    = parseInt(value, 10),
        valueIsNaN     = isNaN(parsedValue),
        isValNumber    = valType === 'number',
        isNumberStr    = valType === 'string' && !valueIsNaN,
        isNotNumberStr = valType === 'string' && valueIsNaN,
        valOutOfRange  = false;

    // Test to see if the value is out of range.
    if (!valueIsNaN && (value >= Number.MAX_VALUE)) {
      valOutOfRange = true;
    }

    // Before we decide whether to throw an error or to increment, we
    // must distinguish between keys that have a value of null,
    // and keys that simply do not exist in the local/session
    // storage.  In the former case, we want to throw an error
    // if the key exists, has a value of null and there is an attempt
    // to increment.  In the former case we want to create the key
    // and set it to 1.  This follows the Redis spec.

    if ((!isValNumber && isNotNumberStr) || valOutOfRange || (valueIsNaN && this.hasOwnProperty(key))) {
      // If the key exists and is set to null, an increment should throw an error
      throw new TypeError('incr: value is not an integer or out of range');
    } else if (isValNumber || isNumberStr) {
      value = parsedValue + 1;
    } else {
      value = 1;
    }
    this._store(key, value);
  };

  // If the key does not exist, incrby sets it to amount
  proto.incrby = function (key, amount) {
    if (arguments.length !== 2) {
      throw new TypeError('incrby: wrong number of arguments');
    }
    var value                = this._retrieve(key),
        valType              = typeof value,
        amountType           = typeof amount,
        parsedValue          = parseInt(value, 10),
        parsedAmount         = parseInt(amount, 10),
        amountIsNaN          = isNaN(parsedAmount),
        valueIsNaN           = isNaN(parsedValue),
        isValNumber          = valType === 'number',
        isAmountNumber       = amountType === 'number',
        isValNumberStr       = valType === 'string' && !valueIsNaN,
        isValNotNumberStr    = valType === 'string' && valueIsNaN,
        isAmountNumberStr    = amountType === 'string' && !amountIsNaN,
        isAmountNotNumberStr = amountType === 'string' && amountIsNaN,
        anyOutOfRange        = false;

    // Test to see if value or amount is out of range.
    if (!valueIsNaN && (value >= Number.MAX_VALUE) || !amountIsNaN && (amount >= Number.MAX_VALUE)) {
      anyOutOfRange = true;
    }
    if ((!isValNumber && isValNotNumberStr || (valueIsNaN && this.hasOwnProperty(key)) || amountIsNaN)
       || (!isAmountNumber && isAmountNotNumberStr)
       || anyOutOfRange) {
      throw new TypeError('incrby: value is not an integer or out of range');
    } else if ((isValNumber || isValNumberStr) && (isAmountNumber || isAmountNumberStr)) {
      value = parsedValue + parsedAmount;
    } else if (isAmountNumber || isAmountNumberStr) {
      value = parsedAmount;
    }
    this._store(key, value);
  };

  // Increments multiple keys by 1
  proto.mincr = function (keys) {
    var i, l;
    keys = (keys instanceof Array) ? keys : arguments;
    for(i = 0, l = keys.length; i < l; i++) {
      this.incr(keys[i]);
    }
  };

  // Usage:   mincrby('key1', 1, 'key2', 4) or
  //          mincrby(['key1', 1, 'key2', 2]) or
  //          mincrby({'key1': 1, 'key2': 2})
  // Notes:   Custom, non-redis method
  proto.mincrby = function (keysAmounts) {
    var i, l, key;

    if (keysAmounts instanceof Array || typeof keysAmounts === 'string') {
      keysAmounts = (keysAmounts instanceof Array) ? keysAmounts : arguments;
      // Need to make sure an even number of arguments is passed in
      if ((keysAmounts.length & 0x1) !== 0) {
        throw new TypeError('mincrby: wrong number of arguments');
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

  // Appends the value at the end of the string
  // Returns: the length of the string after appending
  //          the original length for non-string values
  // Notes:   Appends if the key exists and is a string
  //          If key does not exist, we initialize it to empty
  //          and perform the append
  proto.append = function (key, value) {
    var val = this._exists(key) ? this._retrieve(key) : "",
        isString = typeof val === 'string';

    if (isString) {
      val += value;
      this._store(key, val);
    }

    return isString ? val.length : 1;
  };

  // Returns: the length of the string value stored at key.
  //          0 when key does not exist
  // Throws:  when the key holds a non-string value
  proto.strlen = function (key) {
    var val = this._retrieve(key);

    if (! val) return 0;

    if (typeof val === 'string') {
      return val.length;
    } else {
      throw new Error('strlen: non-string value');
    }
  };


})(window, LocalRedis.Utils.Expiration);