// Authors: Joel Kemp and Eudis Duran
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Storage Objects
// Usage:   window.localRedis along with any supported commands.

(function (window) {
  "use strict";

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

  var JSON = {
    parse:
        window.JSON && (window.JSON.parse || window.JSON.decode) ||
        String.prototype.evalJSON && function(str){return String(str).evalJSON();},
    stringify:
        Object.toJSON ||
        window.JSON && (window.JSON.stringify || window.JSON.encode)
  };

  // Break if no JSON support was found
  if(! (JSON.parse && JSON.stringify)){
    throw new Error('No JSON support found');
  }

  // Constructor that allows the caller to pass in a particular
  // storage context like sessionStorage. Otherwise, it default
  // to localStorage.
  var storage    = window.localStorage || {},
      localRedis = {
        // Expose the native storage methods for convenience
        setItem: function (key, value) {
          storage.setItem(key, value);
        },
        getItem: function (key) {
          return storage.getItem(key);
        },
        key: function (index) {
          return storage.key(index);
        },
        clear: function () {
          storage.clear();
        },
        removeItem: function (key) {
          storage.removeItem(key);
        }
      };

  window.localRedis = localRedis;

  ///////////////////////////
  // Error Helper
  // TODO: MOVE TO EXTERNAL PLUGIN
  ///////////////////////////

  var err = {
        errors: [
          'wrong number of arguments',
          'non-string value',
          'value is not an integer or out of range',
          'not a string value',
          'timestamp already passed',
          'delay not convertible to a number',
          'source and destination objects are the same',
          'no such key',
          'missing storage context'
        ],
        generateError: function (type /*, functionName, errorType */) {
          var error,
              message,
              functionName  = arguments[1],
              errorType     = arguments[2];

          if (typeof type !== 'number' || (functionName && typeof functionName !== 'string')) {
            throw new TypeError('wrong arg types');
          }

          message = this.errors[type];
          if (errorType) {
            errorType = errorType.toLowerCase();

            if (errorType === 'typeerror') {
              error = new TypeError(message);
            }
          } else {
            error = new Error(message);
          }

          return error;
        }
      };

  ///////////////////////////
  // Expiration Internals
  ///////////////////////////

  var
      // Creates and returns the expiration key format for a given storage key
      createExpirationKey = function (key) {
        var delimiter = ":",
            prefix    = "e";

        key = isString(key) ? key : JSON.stringify(key);
        return prefix + delimiter + key;
      },

      // Creates the expiration value/data format for an expiration
      // event's ID and millisecond delay
      // Returns: A string representation of an object created from the data
      // Note:    Keys are as short as possible to save space when stored
      createExpirationValue = function (delay, currentTime) {
        return JSON.stringify({
          c: currentTime,
          d: delay
        });
      },

      // Retrieves the parsed expiration data for the storage key
      getExpirationValue = function (key) {
        var expKey = createExpirationKey(key),
            expVal = localRedis.getItem(expKey);

        return JSON.parse(expVal);
      },

      // Retrieves the expiration delay of the key
      getExpirationDelay = function (key) {
        var expVal = getExpirationValue(key);
        return (expVal && expVal.d) ? expVal.d : null;
      },

      // Returns the expiration's creation time in ms
      getExpirationCreationTime = function (key) {
        var expVal = getExpirationValue(key);
        return (expVal && expVal.c) ? expVal.c : null;
      },

      // Returns the time remaining (in ms) for the expiration
      getExpirationTTL = function (key) {
        var expVal = getExpirationValue(key),
            ttl;

        if (expVal && expVal.d && expVal.c) {
          // TTL is the difference between the creation time w/ delay and now
          ttl = (expVal.c + expVal.d) - new Date().getTime();
        }
        return ttl;
      },

      // Stores expiration data for the passed key
      setExpirationOf = function (key, delay, currentTime) {
        var expKey = createExpirationKey(key),
            expVal = createExpirationValue(delay, currentTime);

        localRedis.setItem(expKey, expVal);
      },

      // Removes/Cancels the key's expiration
      removeExpirationOf = function (key) {
        var expKey = createExpirationKey(key),
            expVal = getExpirationValue(key);

        localRedis.removeItem(expKey);
      },

      // Whether or not the given key has existing expiration data
      // Returns:   true if expiry data exists, false otherwise
      hasExpiration = function (key) {
        var expKey = createExpirationKey(key);
        return !! localRedis.getItem(expKey);
      },

      // Whether or not the key's ttl indicates that it should be removed
      shouldExpire = function (key) {
        var ttl = getExpirationTTL(key),
            shouldExpire = ttl < 0;
        return shouldExpire;
      },

      // Removes a key and its expiration data if the key should expire
      // Note: Each process is responsible for cleaning out expired keys
      cleanIfExpired = function (key) {
        if (shouldExpire(key)) {
          localRedis._remove(key);
          localRedis._remove(createExpirationKey(key));
        }
      };

  ///////////////////////////
  // Storage Internals
  ///////////////////////////
  // Redis commands typically have side effects and so we should
  // be cautious to include calls to those functions when requiring
  // storage operations with no side effects.
  // These internal functions are safer to use for storage within commands

  var
      isString = function (element) {
        return typeof element === 'string';
      },
      stringified = function (element) {
        return isString(element) ? element : JSON.stringify(element);
      };

  // Expose the hasExpiration helper for expiration testing
  localRedis._hasExpiration = hasExpiration;

  // Stores the key/value pair
  // Note:    Auto-stringifies non-strings
  // Throws:  Exception on reaching the storage quota
  localRedis._store = function (key, value) {
    key   = stringified(key);
    value = stringified(value);

    try {
      this.setItem(key, value);
    } catch (e) {
      // Quota exception
      throw e;
    }
  };

  // Returns the (parsed) value associated with the given key
  // Note:  to ensure that expired keys are removed,
  //        we have to do it in core retrieval that all
  //        other commands use
  localRedis._retrieve = function (key) {
    key = stringified(key);

    cleanIfExpired(key);

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
  localRedis._remove = function (key) {
    key = stringified(key);
    this.removeItem(key);
  };

  // Returns true if the key(s) exists, false otherwise.
  // Notes:   A key with a set value of null still exists.
  // Usage:   _exists('foo') or _exists(['foo', 'bar'])
  localRedis._exists = function (key) {
    cleanIfExpired(key);

    var allExist = true,
    i, l;

    if (key instanceof Array) {
      for (i = 0, l = key.length; i < l; i++) {
        if (! storage.hasOwnProperty(key[i])) {
          allExist = false;
        }
      }
    } else {
      // localRedis object doesn't hold key/value pairs
      allExist = !! storage.hasOwnProperty(key);
    }

    return allExist;
  };

  ///////////////////////////
  // Keys Commands
  ///////////////////////////

  // Removes the specified key(s)
  // Returns: the number of keys removed.
  // Notes:   if the key doesn't exist, it's ignored.
  //          clears existing expirations on the keys
  // Usage:   del('k1') or del('k1', 'k2') or del(['k1', 'k2'])
  localRedis.del = function (keys) {
    var numKeysDeleted = 0,
        i, l;

    keys = (keys instanceof Array) ? keys : arguments;

    for (i = 0, l = keys.length; i < l; i++) {

      if (this._exists(keys[i])) {
        removeExpirationOf(keys[i]);
        this._remove(keys[i]);
        ++numKeysDeleted;
      }
    }

    return numKeysDeleted;
  };

  // Returns: 1 if the key exists, 0 if they key doesn't exist.
  // Throws:  TypeError if more than one argument is supplied
  localRedis.exists = function (key) {
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
  localRedis.rename = function (key, newKey) {
    if (arguments.length !== 2) {
      throw new err.generateError(0);
    } else if (key === newKey) {
      throw new err.generateError(6);
    } else if (! this._exists(key)) {
      throw new err.generateError(7);
    }

    // Remove newKey's existing expiration
    // since newKey inherits all characteristics from key
    if (hasExpiration(newKey)) {
      removeExpirationOf(newKey);
    }

    var val = this._retrieve(key);
    this._store(newKey, val);

    // Transfer an existing expiration to newKey
    if (hasExpiration(key)) {
      var ttl = getExpirationTTL(key);

      // Transfer the TTL (ms) to the new key
      this.pexpire(newKey, ttl);

      // Remove the old key's expiration
      removeExpirationOf(key);
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
  localRedis.renamenx = function (key, newKey) {
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
  localRedis.getkey = function (val) {
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
  localRedis.expire = function (key, delay) {
    if (arguments.length !== 2) {
      throw new err.generateError(0);
    } else if (! this._exists(key)) {
      return 0;
    }

    var expKey = createExpirationKey(key);

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);

    if (! delay) {
      throw new err.generateError(5);
    }

    // Convert the delay to ms (1000ms in 1s)
    delay *= 1000;

    // Subsequent calls to expire on the same key
    // will refresh the expiration with the new delay
    if (hasExpiration(key)) {
      removeExpirationOf(key);
    }

    // Create the key's new expiration data
    setExpirationOf(key, delay, new Date().getTime());
    return 1;
  };

  // Expiry in milliseconds
  // Returns: the same output as expire
  localRedis.pexpire = function (key, delay) {
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
  localRedis.expireat = function (key, timestamp) {
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
  localRedis.pexpireat = function (key, timestamp) {
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
  localRedis.persist = function (key) {
    if (arguments.length !== 1) {
      throw err.generateError(0);
    }

    if (! (this._exists(key) && hasExpiration(key))) {
      return 0;
    } else {
      this._remove(createExpirationKey(key));
      return 1;
    }
  };

  // Returns: the time to live in seconds
  //          -1 when key does not exist or does not have an expiration
  // Notes:   Due to the possible delay between expiration timeout
  //          firing and the callback execution, this ttl only reflects
  //          the TTL for the timeout firing
  localRedis.ttl = function (key) {
    if (arguments.length !== 1) {
      throw err.generateError(0);
    }

    if(! (this._exists(key) && hasExpiration(this))) {
      return -1;
    }

    // 1sec = 1000ms
    return getExpirationTTL(key, this) / 1000;
  };

  // Returns: the time to live in milliseconds
  //          -1 when key does not exist or does not have an expiration
  // Note:    this command is just like ttl with ms units
  localRedis.pttl = function (key) {
    if (arguments.length !== 1) {
      throw err.generateError(0);
    }

    return this.ttl(key) * 1000;
  };

  // Returns:   a random key from the calling storage object.
  //            null when the database is empty
  localRedis.randomkey = function () {
    var keys = Object.keys(this),
        length = this.length,
        // Random position within the list of keys
        rindex = Math.floor(Math.random() * length);

    if (! length) return null;

    return keys[rindex];
  };

  // Returns:   all keys matching the supplied pattern
  localRedis.keys = function (pattern) {
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
  localRedis.get = function(key) {
    return this._retrieve(key);
  };

  // Stores the passed value indexed by the passed key
  // Notes:   Auto stringifies
  //          resets an existing expiration if set was called directly
  // Usage:   set('foo', 'bar') or set('foo', 'bar').set('bar', 'car')
  localRedis.set = function(key, value) {
    var hasExp = hasExpiration(key),
        expDelay;

    try {
      this._store(key, value);

      // Cancel the expiration of the key
      if (hasExp) {
        expDelay = getExpirationDelay(key);

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
  localRedis.getset = function (key, value) {
    if (arguments.length !== 2) {
      throw err.generateError(0);
    }

    // Grab the existing value or null if the key doesn't exist
    var oldVal = this._retrieve(key);

    // Throw an exception if the value isn't a string
    if (! isString(oldVal) && oldVal !== null) {
      throw err.generateError(1);
    }

    // Use set to refresh an existing expiration
    this.set(key, value);
    return oldVal;
  };

  // Returns: A list of values for the passed key(s).
  // Note:    Values match keys by index.
  // Usage:   mget('key1', 'key2', 'key3') or mget(['key1', 'key2', 'key3'])
  localRedis.mget = function(keys) {
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
  localRedis.mset = function (keysVals) {
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
  localRedis.setnx = function (key, value) {
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
  localRedis.msetnx = function (keysVals) {
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
  localRedis.incr = function (key) {
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
  localRedis.incrby = function (key, amount) {
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
  localRedis.mincr = function (keys) {
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
  localRedis.mincrby = function (keysAmounts) {
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
  localRedis.append = function (key, value) {
    var val = this._exists(key) ? this._retrieve(key) : "",
        valIsString = isString(val);

    if (valIsString) {
      val += value;
      this._store(key, val);
    }

    return valIsString ? val.length : 1;
  };

  // Returns: the length of the string value stored at key.
  //          0 when key does not exist
  // Throws:  when the key holds a non-string value
  localRedis.strlen = function (key) {
    var val = this._retrieve(key);

    if (! val) return 0;

    if (isString(val)) {
      return val.length;
    } else {
      throw err.generateError(1);
    }
  };

  // Set key to hold the string value and set key to
  // timeout after a given number of seconds.
  localRedis.setex = function (key, value, delay) {
    if (arguments.length !== 3) {
      throw err.generateError(0);
    }

    this._store(key, value);
    this.expire(key, delay);
  };

  // Set key to hold the string value and set key to
  // timeout after a given number of milliseconds.
  localRedis.psetex = function (key, value, delay) {
    if (arguments.length !== 3) {
      throw err.generateError(0);
    }

    this._store(key, value);
    this.pexpire(key, delay);
  };

})(window);