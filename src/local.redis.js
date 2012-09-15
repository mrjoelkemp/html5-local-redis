// Authors: Joel Kemp and Eudis Duran
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Storage Objects
// Usage:   window.localStorage.command where command is any of the
//          supported redis-like commands. window.sessionStorage can also be used.

// Fetch the utils
window.LocalRedis         = window.LocalRedis || {};
window.LocalRedis.Utils   = window.LocalRedis.Utils || {};

(function (window, utils) {
  "use strict";

  // TODO: Fallback to some other means of storage - polyfills exist
  if (! window.localStorage) {
    Object.defineProperty(window, "localStorage", new (function () {
      var aKeys = [], oStorage = {};
      Object.defineProperty(oStorage, "getItem", {
        value: function (sKey) { return sKey ? this[sKey] : null; },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "key", {
        value: function (nKeyId) { return aKeys[nKeyId]; },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "setItem", {
        value: function (sKey, sValue) {
          if(!sKey) { return; }
          document.cookie = window.escape(sKey) + "=" + window.escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "length", {
        get: function () { return aKeys.length; },
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(oStorage, "removeItem", {
        value: function (sKey) {
          if(!sKey) { return; }
          document.cookie = window.escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        },
        writable: false,
        configurable: false,
        enumerable: false
      });
      this.get = function () {
        var iThisIndx;
        for (var sKey in oStorage) {
          iThisIndx = aKeys.indexOf(sKey);
          if (iThisIndx === -1) { oStorage.setItem(sKey, oStorage[sKey]); }
          else { aKeys.splice(iThisIndx, 1); }
          delete oStorage[sKey];
        }
        for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) { oStorage.removeItem(aKeys[0]); }
        for (var aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
          aCouple = aCouples[nIdx].split(/\s*=\s*/);
          if (aCouple.length > 1) {
            oStorage[iKey = window.unescape(aCouple[0])] = window.unescape(aCouple[1]);
            aKeys.push(iKey);
          }
        }
        return oStorage;
      };
      this.configurable = false;
      this.enumerable = true;
    })());
    // Create JSON.stringify if it doesn't exist
    return;
  }

  // Using the prototype grants both localStorage and sessionStorage the redis methods
  var proto = window.localStorage.constructor.prototype,
      exp   = utils.Expiration,
      err   = utils.Error;

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
  // Note:  to ensure that expired keys are removed,
  //        we have to do it in core retrieval that all
  //        other commands use
  proto._retrieve = function (key) {
    key = (typeof key !== 'string') ? JSON.stringify(key) : key;

    // Remove a key if it should be expired
    if (exp.hasExpiration(key, this) && exp.getExpirationTTL(key, this) < 0) {
      exp.removeExpirationOf(key, this);
      this._remove(key);
      return null;
    }

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
      throw new err.generateError(0);
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
      throw new err.generateError(0);
    } else if (key === newKey) {
      throw new err.generateError(6);
    } else if (! this._exists(key)) {
      throw new err.generateError(7);
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
      throw new err.generateError(0);
    } else if (key === newKey) {
      throw new err.generateError(6);
    } else if (! this._exists(key)) {
      throw new err.generateError(7);
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
      throw new err.generateError(0);
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
      throw new err.generateError(0);
    } else if (! this._exists(key)) {
      return 0;
    }

    var expKey = exp.createExpirationKey(key);

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);

    if (! delay) {
      throw new err.generateError(5);
    }

    // Convert the delay to ms (1000ms in 1s)
    delay *= 1000;

    // Subsequent calls to expire on the same key
    // will refresh the expiration with the new delay
    if (exp.hasExpiration(key, this)) {
      exp.removeExpirationOf(key, this);
    }

    // Create the key's new expiration data
    exp.setExpirationOf(key, delay, new Date().getTime(), this);
    return 1;
  };

  // Expiry in milliseconds
  // Returns: the same output as expire
  proto.pexpire = function (key, delay) {
    if (arguments.length !== 2) {
      throw err.generateError(0);
    }

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);
    if (! delay) {
      throw err.generateError(5);
    }

    // Expire will convert the delay to seconds,
    // so we account for that by canceling out the conversion from ms to s
    return this.expire(key, delay / 1000);
  };

  // Expires a key at the supplied, second-based UNIX timestamp
  // Returns:   1 if the timeout was set.
  //            0 if key does not exist or the timeout could not be set
  // Usage:     expireat('foo', 1293840000)
  proto.expireat = function (key, timestamp) {
    if (arguments.length !== 2) {
      throw err.generateError(0);
    }

    // Compute the delay (in seconds)
    var nowSeconds  = new Date().getTime() / 1000,
        delay       = timestamp - nowSeconds;

    if (delay < 0) {
      throw err.generateError(4);
    }

    return this.expire(key, delay);
  };

  // Expires a key a the supplied, millisecond-based UNIX timestamp
  // Returns:   1 if the timeout was set.
  //            0 if key does not exist or the timeout could not be set
  proto.pexpireat = function (key, timestamp) {
    if (arguments.length !== 2) {
      throw err.generateError(0);
    }

    // Delay in milliseconds
    var delay = timestamp - new Date().getTime();

    if(delay < 0) {
      throw err.generateError(4);
    }

    return this.pexpire(key, delay);
  };

  // Removes the expiration associated with the key
  // Returns:   0 if the key does not exist or does not have an expiration
  //            1 if the expiration was removed
  proto.persist = function (key) {
    if (arguments.length !== 1) {
      throw err.generateError(0);
    }

    if (! (this._exists(key) && exp.hasExpiration(key, this))) {
      return 0;
    } else {
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
      throw err.generateError(0);
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
      throw err.generateError(0);
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
      throw err.generateError(0);
    }

    // Grab the existing value or null if the key doesn't exist
    var oldVal = this._retrieve(key);

    // Throw an exception if the value isn't a string
    if (typeof oldVal !== 'string' && oldVal !== null) {
      throw err.generateError(1);
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

  // Set key to hold string value if key does not exist.
  // Returns:   1 if the key was set
  //            0 if the key was not set
  // Note:      When key already holds a value, no operation is performed.
  proto.setnx = function (key, value) {
    if(arguments.length !== 2) {
      throw err.generateError(0);
    }

    if (this._exists(key)) return 0;

    this._store(key, value);
    return 1;
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

  // If the key does not exist, incr sets it to 1
  proto.incr = function (key) {
    if (arguments.length !== 1) {
      throw err.generateError(0);
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
      throw err.generateError(2);
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
      throw err.generateError(0);
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
      throw err.generateError(2);
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
        throw err.generateError(0);
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
      throw err.generateError(1);
    }
  };

  // Set key to hold the string value and set key to
  // timeout after a given number of seconds.
  proto.setex = function (key, value, delay) {
    if (arguments.length !== 3) {
      throw err.generateError(0);
    }

    this._store(key, value);
    this.expire(key, delay);
  };

  // Set key to hold the string value and set key to
  // timeout after a given number of milliseconds.
  proto.psetex = function (key, value, delay) {
    if (arguments.length !== 3) {
      throw err.generateError(0);
    }

    this._store(key, value);
    this.pexpire(key, delay);
  };

})(window, window.LocalRedis.Utils);