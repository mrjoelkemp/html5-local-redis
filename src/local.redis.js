// Authors: Joel Kemp and Eudis Duran
// File:    local.redis.js
// Purpose: Replicates the Redis API for use with HTML5 Storage Objects
// Usage:   window.localRedis along with any supported commands.

(function (window, document, undefined) {
  "use strict";

  if (! window.localStorage) {
    Object.defineProperty(window, "localStorage", (function () {
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
        var iThisIndx, sKey, aCouple, aCouples, iKey, nIdx;
        for (sKey in oStorage) {
          iThisIndx = aKeys.indexOf(sKey);
          if (iThisIndx === -1) { oStorage.setItem(sKey, oStorage[sKey]); }
          else { aKeys.splice(iThisIndx, 1); }
          delete oStorage[sKey];
        }
        for (aKeys; aKeys.length > 0; aKeys.splice(0, 1)) { oStorage.removeItem(aKeys[0]); }
        for (aCouple, iKey, nIdx = 0, aCouples = document.cookie.split(/\s*;\s*/); nIdx < aCouples.length; nIdx++) {
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


  var storage = window.localStorage,
      localRedis = {};

  window.localRedis = localRedis;

  ///////////////////////////
  // Utilities
  ///////////////////////////

  var
      isString = function (element) {
        return typeof element === 'string';
      },
      isNumber = function (element) {
        return typeof element === 'number';
      },
      stringified = function (element) {
        return isString(element) ? element : JSON.stringify(element);
      },
      parsed = function (element) {
        try {
          // If it's a literal string, parsing will fail
          element = JSON.parse(element);
        } catch (e) {
          // We couldn't parse the literal string
          // so just return the literal in the finally block.
        } finally {
          return element;
        }
      },

      // Used to emit cross-browser events
      // Note: Checks for IE support, then Jquery, then other browsers
      eventName = 'storagechange',
      fireEvent = function (element, event){
        var evt,
            $ = window.$ || window.jQuery;

        // dispatch for IE
        if (document.createEventObject){
            evt = document.createEventObject();
            return element.fireEvent('on' + event, evt);

        // If jQuery exists, dispatch with jquery
        } else if($) {
          $(element).trigger(event);

        // dispatch for firefox + others
        } else{
          evt = document.createEvent("HTMLEvents");
          // event type, bubbling, cancelable
          evt.initEvent(event, true, true);
          return !element.dispatchEvent(evt);
        }
      },

      // Fired when the storage changes
      // Attaches events to the document to avoid
      fireStorageChangedEvent = function () {
        return fireEvent(document, eventName);
      };



  ///////////////////////////
  // Error Helper
  ///////////////////////////

  var
      WRONG_ARGUMENTS           = 'wrong number of arguments',
      NON_STRING_VALUE          = 'non-string value',
      NOT_INT_VALUE_OR_RANGE    = 'value is not an integer or out of range',
      NOT_STRING_VALUE          = 'not a string value',
      TIMESTAMP_PASSED          = 'timestamp already passed',
      DELAY_NOT_NUMBER          = 'delay not convertible to a number',
      SOURCE_EQUALS_DESTINATION = 'source and destination objects are the same',
      NO_SUCH_KEY               = 'no such key',
      MISSING_CONTEXT           = 'missing storage context',
      VALUE_NOT_ARRAY           = 'value is not an array',

      throwError = function (message) {
        throw new Error(message);;
      };

  ///////////////////////////
  // Expiration Internals
  ///////////////////////////

  var
      // Creates and returns the expiration key format for a given storage key
      createExpirationKey = function (key) {
        var delimiter = ":",
            prefix    = "e";

        key = stringified(key);
        return prefix + delimiter + key;
      },

      // Creates the expiration value/data format for an expiration
      // event's ID and millisecond delay
      // Returns: A string representation of an object created from the data
      // Note:    Keys are as short as possible to save space when stored
      createExpirationValue = function (delay, currentTime) {
        return stringified({
          c: currentTime,
          d: delay
        });
      },

      // Retrieves the parsed expiration data for the storage key
      getExpirationValue = function (key) {
        var expKey = createExpirationKey(key),
            expVal = storage.getItem(expKey);

        return parsed(expVal);
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

        storage.setItem(expKey, expVal);
      },

      // Removes/Cancels the key's expiration
      removeExpirationOf = function (key) {
        var expKey = createExpirationKey(key),
            expVal = getExpirationValue(key);

        storage.removeItem(expKey);
      },

      // Whether or not the given key has existing expiration data
      // Returns:   true if expiry data exists, false otherwise
      hasExpiration = function (key) {
        var expKey = createExpirationKey(key);
        return !! storage.getItem(expKey);
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
          remove(key);
          remove(createExpirationKey(key));
        }
      };

  ///////////////////////////
  // Native Storage Methods
  ///////////////////////////

  localRedis.setItem = function (key, value) {
    storage.setItem(key, value);
    fireStorageChangedEvent();
  },
  localRedis.getItem = function (key) {
    // Have to clean otherwise we have an expiration loophole
    cleanIfExpired(key);
    return storage.getItem(key);
  },
  localRedis.key = function (index) {
    return storage.key(index);
  };
  localRedis.clear = function () {
    storage.clear();
    fireStorageChangedEvent();
  };
  localRedis.removeItem = function (key) {
    storage.removeItem(key);
    fireStorageChangedEvent();
  };

  ///////////////////////////
  // Storage Internals
  ///////////////////////////

  // Redis commands typically have side effects and so we should
  // be cautious to include calls to those functions when requiring
  // storage operations with no side effects.
  // These internal functions are safer to use for storage within commands

  var
      // Stores the key/value pair
      // Note:    Auto-stringifies non-strings
      // Throws:  Exception on reaching the storage quota
      store = function (key, value) {
        key   = stringified(key);
        value = stringified(value);

        try {
          storage.setItem(key, value);
          fireStorageChangedEvent();
        } catch (e) {
          // Quota exception
          throw e;
        }
      },

      // Returns the (parsed) value associated with the given key
      // Note:  to ensure that expired keys are removed,
      //        we have to do it in core retrieval that all
      //        other commands use
      retrieve = function (key) {
        key = stringified(key);

        cleanIfExpired(key);

        var res = storage.getItem(key);

        return parsed(res);
      },

      // Remove the key/value pair identified by the passed key
      // Note:  Auto stringifies non-strings
      remove = function (key) {
        key = stringified(key);
        storage.removeItem(key);
      },

      // Returns true if the key(s) exists, false otherwise.
      // Notes:   A key with a set value of null still exists.
      // Usage:   exists('foo') or exists(['foo', 'bar'])
      exists = function (key) {
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

      if (exists(keys[i])) {
        removeExpirationOf(keys[i]);
        remove(keys[i]);
        ++numKeysDeleted;
      }
    }

    return numKeysDeleted;
  };

  // Returns: 1 if the key exists, 0 if they key doesn't exist.
  // Throws:  Error if more than one argument is supplied
  localRedis.exists = function (key) {
    if (arguments.length > 1) throwError(WRONG_ARGUMENTS);

    return exists(key) ? 1 : 0;
  };

  // Renames key to newKey
  // Throws:  Error if key == newKey
  //          Error if key does not exist
  // Usage:   rename(key, newKey)
  // Notes:   Transfers the key's TTL to the newKey
  localRedis.rename = function (key, newKey) {
    var errorType, ttl;

    if (arguments.length !== 2) {
      errorType = WRONG_ARGUMENTS;
    } else if (key === newKey) {
      errorType = SOURCE_EQUALS_DESTINATION;
    } else if (! exists(key)) {
      errorType = NO_SUCH_KEY;
    }
    // errorType could be 0, so don't do if (errorType)
    if (errorType !== undefined) throwError(errorType);

    // Remove newKey's existing expiration
    // since newKey inherits all characteristics from key
    if (hasExpiration(newKey)) removeExpirationOf(newKey);

    // Assign the value of key to newKey
    store(newKey, retrieve(key));

    // Transfer an existing expiration to newKey
    if (hasExpiration(key)) {
      ttl = getExpirationTTL(key);

      // Transfer the TTL (ms) to the new key
      this.pexpire(newKey, ttl);

      // Remove the old key's expiration
      removeExpirationOf(key);
    }

    remove(key);
  };

  // Renames key to newkey if newkey does not exist
  // Returns: 1 if key was renamed; 0 if newkey already exists
  // Usage:   renamenx(key, newkey)
  // Notes:   Affects expiry like rename
  // Throws:  Error if key == newkey
  //          Error if key does not exist
  //          Fails under the same conditions as rename
  localRedis.renamenx = function (key, newKey) {
    var typeError;

    if (arguments.length !== 2) {
      typeError = WRONG_ARGUMENTS;
    } else if (key === newKey) {
      typeError = SOURCE_EQUALS_DESTINATION;
    } else if (! exists(key)) {
      typeError = NO_SUCH_KEY;
    }

    if (typeError) throwError(typeError);

    if (exists(newKey)) return 0;

    // Rename and transfer expirations
    this.rename(key, newKey);
    return 1;
  };

  // Retrieves the first key associated with the passed value
  // Returns:   a single key or
  //            a list of keys if true is passed as second param or
  //            null if no keys were found
  // Params:    all = whether or not to retrieve all of the keys that match
  // Notes:     Custom, non-redis method
  localRedis.getkey = function (val /*, all */) {
    if (arguments.length > 2) throwError(WRONG_ARGUMENTS);

    var i, l, k, v, keys = [], all;

    // Get whether or not the all flag was set
    all = !! arguments[1];

    // Look for keys with a value that matches val
    for (i = 0, l = storage.length; i < l; i++) {
      k = storage.key(i);
      v = storage.getItem(k);

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
  // Returns: 1 if the expiration was set
  //          0 if the key does not exist or the expiration couldn't be set
  localRedis.expire = function (key, delay) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    if (! exists(key)) return 0;

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);

    if (! delay) throwError(DELAY_NOT_NUMBER);

    // Convert the delay to ms (1000ms in 1s)
    delay *= 1000;

    // Subsequent calls to expire on the same key
    // will refresh the expiration with the new delay
    if (hasExpiration(key)) removeExpirationOf(key);

    // Create the key's new expiration data
    setExpirationOf(key, delay, new Date().getTime());
    return 1;
  };

  // Whether or not the key is going to expire
  // Returns: 1 if the key has expiration data
  //          0 if the key does not have expiration data
  // Notes:   Custom function
  localRedis.expires = function (key) {
    key = stringified(key);
    return Number(hasExpiration(key));
  };

  // Expiry in milliseconds
  // Returns: the same output as expire
  localRedis.pexpire = function (key, delay) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    // Check if the delay is/contains a number
    delay = parseFloat(delay, 10);

    if (! delay) throwError(DELAY_NOT_NUMBER);

    // Expire will convert the delay to seconds,
    // so we account for that by canceling out the conversion from ms to s
    return this.expire(key, delay / 1000);
  };

  // Expires a key at the supplied, second-based UNIX timestamp
  // Returns:   1 if the timeout was set.
  //            0 if key does not exist or the expiration could not be set.
  // Usage:     expireat('foo', 1293840000)
  // Throws if the timestamp has already expired
  localRedis.expireat = function (key, timestamp) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    // Compute the delay (in seconds)
    var nowSeconds  = new Date().getTime() / 1000,
        delay       = timestamp - nowSeconds;

    if (delay < 0) throwError(TIMESTAMP_PASSED);

    return this.expire(key, delay);
  };

  // Expires a key a the supplied, millisecond-based UNIX timestamp
  // Returns:   1 if the timeout was set.
  //            0 if key does not exist or the timeout could not be set
  // Throws if the timestamp has already expired
  localRedis.pexpireat = function (key, timestamp) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    // Delay in milliseconds
    var delay = timestamp - new Date().getTime();

    if(delay < 0) throwError(TIMESTAMP_PASSED);

    return this.pexpire(key, delay);
  };

  // Removes the expiration associated with the key
  // Returns:   0 if the key does not exist or does not have an expiration
  //            1 if the expiration was removed
  localRedis.persist = function (key) {
    if (arguments.length !== 1) throwError(WRONG_ARGUMENTS);

    if (! (exists(key) && hasExpiration(key))) return 0;

    remove(createExpirationKey(key));
    return 1;
  };

  // Returns: the time to live in seconds
  //          -1 when key does not exist or does not have an expiration
  localRedis.ttl = function (key) {
    if (arguments.length !== 1) throwError(WRONG_ARGUMENTS);

    if(exists(key) && hasExpiration(key)) {
      // 1sec = 1000ms
      return getExpirationTTL(key) / 1000;
    }

    return -1;
  };

  // Returns: the time to live in milliseconds
  //          -1 when key does not exist or does not have an expiration
  // Note:    this command is just like ttl with ms units
  localRedis.pttl = function (key) {
    if (arguments.length !== 1) throwError(WRONG_ARGUMENTS);

    return this.ttl(key) * 1000;
  };

  // Returns:   a random key from the calling storage object.
  //            null when the database is empty
  localRedis.randomkey = function () {
    var keys    = Object.keys(storage),
        length  = storage.length,
        // Random position within the list of keys
        rindex  = Math.floor(Math.random() * length);

    if (! length) return null;

    return keys[rindex];
  };

  // Returns:   all keys matching the supplied pattern
  //            null if no keys were found
  // Usage:     keys('foo*') for all keys with foo
  localRedis.keys = function (pattern) {
    var regex = new RegExp(pattern),
        i, l,
        results = [],
        keys = Object.keys(storage);

    for (i = 0, l = keys.length; i < l; i++) {
      if (regex.test(keys[i])) {
        results.push(keys[i]);
      }
    }

    return results.length ? results : null;
  };

  ///////////////////////////
  // String Commands
  ///////////////////////////

  // Returns: The (parsed) value associated with the passed key, if it exists.
  localRedis.get = function(key) {
    return retrieve(key);
  };

  // Stores the passed value indexed by the passed key
  // Notes:   Auto stringifies
  //          resets an existing expiration if set was called directly
  // Usage:   set('foo', 'bar') or set('foo', 'bar').set('bar', 'car')
  localRedis.set = function(key, value) {
    var hasExp = hasExpiration(key),
        expDelay;

    try {
      store(key, value);

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
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    // Grab the existing value or null if the key doesn't exist
    var oldVal = retrieve(key);

    // Throw an exception if the value isn't a string
    if (! isString(oldVal) && oldVal !== null) throwError(NON_STRING_VALUE);

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
      results[results.length] = retrieve(keys[i]);
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
        store(keys[i], keysVals[keys[i]]);
      }
    } else {

      keysVals = isArray ? keysVals : arguments;

      for (i = 0, l = keysVals.length; i < l; i += 2) {
        store(keysVals[i], keysVals[i + 1]);
      }
    }

    return this;
  };

  // Set key to hold string value if key does not exist.
  // Returns:   1 if the key was set
  //            0 if the key was not set
  // Note:      When key already holds a value, no operation is performed.
  localRedis.setnx = function (key, value) {
    if(arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    if (exists(key)) return 0;

    store(key, value);
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
      if (exists(keys[i])) {
        return 0;
      }
    }

    // We don't call mset because splat arguments
    // are passed in as an object, when it should be
    // processed like an array
    for (i = 0, l = keysVals.length; i < l; i += 2) {
      store(keysVals[i], keysVals[i + 1]);
    }
    return 1;
  };

  // If the key does not exist, incr sets it to 1
  // Note:  incr does not affect expiry
  localRedis.incr = function (key) {
    if (arguments.length !== 1) throwError(WRONG_ARGUMENTS);

    this.incrby(key, 1);
  };

  // If the key does not exist, incrby sets it to amount
  // Notes:   Incrby does not affect key expiry
  //          keys set with null values cannot be incremented
  //          amount must be a number or string containing a number
  // Usage:   incrby('foo', '4') or incrby('foo', 4)
  localRedis.incrby = function (key, amount) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    var value                = retrieve(key),
        valType              = typeof value,
        amountType           = typeof amount,
        parsedValue          = parseInt(value, 10),
        parsedAmount         = parseInt(amount, 10),
        amountIsNaN          = isNaN(parsedAmount),
        amountIsFloat        = Math.round(amount) !== amount,
        valueIsNaN           = isNaN(parsedValue),

        // Check the value
        isValNull            = value === null,
        isValNumber          = isNumber(valType),
        isValNumberStr       = isString(valType) && !valueIsNaN,
        isValNotNumberStr    = isString(valType) && valueIsNaN,

        // Value should be a number or string representation of a number
        // Example values: 1 or "1"
        isValNotValid        = !isValNumber && isValNotNumberStr,

        // Key exists with a value of null
        existsNullVal        = valueIsNaN && exists(key),

        // Check the amount
        isAmountNumber       = isNumber(amountType),
        isAmountNumberStr    = isString(amountType) && !amountIsNaN,
        isAmountNotNumberStr = isString(amountType) && amountIsNaN,
        isAmountNotValid     = !isAmountNumber && isAmountNotNumberStr,

        // Out of range checks
        valOutOfRange        = !valueIsNaN && (value >= Number.MAX_VALUE),
        amountOutOfRange     = !amountIsNaN && (amount >= Number.MAX_VALUE),
        anyOutOfRange        = valOutOfRange || amountOutOfRange;

    if ((isValNotValid  && !isValNull) || existsNullVal || amountIsNaN || isAmountNotValid || anyOutOfRange || amountIsFloat) {
      // out of range or not an integer
      throwError(NOT_INT_VALUE_OR_RANGE);

    // The value and incr amount are valid
    } else if ((isValNumber || isValNumberStr) && (isAmountNumber || isAmountNumberStr)) {
      value = parsedValue + parsedAmount;

    // Key didn't exist, so set the value to the amount
    } else if (isAmountNumber || isAmountNumberStr) {
      value = parsedAmount;
    }

    store(key, value);
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
  // Notes:   Custom, non-redis method
  localRedis.mincrby = function (keysAmounts) {
    var i, l, key;

    if (keysAmounts instanceof Array || isString(keysAmounts)) {
      keysAmounts = (keysAmounts instanceof Array) ? keysAmounts : arguments;

      // Need to make sure an even number of arguments is passed in
      if ((keysAmounts.length & 0x1) !== 0) throwError(WRONG_ARGUMENTS);

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
  localRedis.decr = function (key) {
    if (arguments.length !== 1) throwError(WRONG_ARGUMENTS);
    this.incrby(key, -1);
  };

  // decrby
  localRedis.mdecr = function (keys) {
    var i, l;
    keys = (keys instanceof Array) ? keys : arguments;
    for(i = 0, l = keys.length; i < l; i++) {
      this.decr(keys[i]);
    }
  };

  // decrby
  localRedis.decrby = function (key, amount) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);
    this.incrby(key, -amount);
  };

  // mdecrby
  localRedis.mdecrby = function (keysAmounts) {
    var oddIndexCallback = function (elem, index) {
      // Return the negation of odd-index elements on the list since we're using mincrby.
      // For mdecrby, we expect the input to be ['elem1', value1, 'elem2', value2, ...,]
      return (! (index & 0x1)) ? elem : -elem;
    };
    // 'arguments' is not a canonical Array. The slice call makes it one.
    // We should probably do this for all functions that do this type of transformation.
    keysAmounts = (keysAmounts instanceof Array) ? keysAmounts : Array.prototype.slice.call(arguments);
    this.mincrby(keysAmounts.map(oddIndexCallback));
  };

  // Appends the value at the end of the string
  // Returns: the length of the string after appending
  //          the original length for non-string values
  // Notes:   Appends if the key exists and is a string
  //          If key does not exist, we initialize it to empty
  //          and perform the append
  localRedis.append = function (key, value) {
    if (arguments.length !== 2) throwError(WRONG_ARGUMENTS);

    var val         = retrieve(key) || "",
        valIsString = isString(val);

    if (valIsString) {
      val += value;
      store(key, val);
    }

    return valIsString ? val.length : 1;
  };

  // Returns: the length of the string value stored at key.
  //          0 when key does not exist
  // Throws:  when the key holds a non-string value
  localRedis.strlen = function (key) {
    var val = retrieve(key);

    if (! val) return 0;

    if (! isString(val)) throwError(NON_STRING_VALUE);

    return val.length;
  };

  // Set key to hold the string value and set key to
  // expire after a given number of seconds.
  // Throws if the delay is not valid
  localRedis.setex = function (key, delay, value) {
    if (arguments.length !== 3) throwError(WRONG_ARGUMENTS);

    this.set(key, value);
    this.expire(key, delay);
  };

  // Set key to hold the string value and set key to
  // expire after a given number of milliseconds.
  // Throws if the delay is not valid
  localRedis.psetex = function (key, delay, value) {
    if (arguments.length !== 3) throwError(WRONG_ARGUMENTS);

    this.set(key, value);
    this.pexpire(key, delay);
  };

  ///////////////////////////
  // List Commands
  ///////////////////////////

  // Insert all the specified values at the head of the list stored at key.
  // Note:    If key does not exist, it is created as empty list
  //          before performing the push operations.
  // Throws:  When key holds a value that is not a list, an error is returned.
  // Returns: The length of the list after the push
  // Usage:   lpush(key, val1) or lpush(key, val1, val2, ...)
  localRedis.lpush = function (key, value) {
    if (arguments.length < 2) throwError(WRONG_ARGUMENTS);

    var val     = retrieve(key),
        values  = [],
        i, end;

    if (exists(key) && ! (val instanceof Array)) throwError(VALUE_NOT_ARRAY);

    // The caller supplied splats
    if (arguments.length > 2) {
      key = arguments[0];

      // Args should be added in LIFO fashion
      values = Array.prototype.slice.call(arguments, 1);
      values.reverse();

    // The caller supplied an array as the second param
    } else if (value instanceof Array) {
      values = value.reverse();
    } else {
      values = [value];
    }

    val = val || [];

    // Add the supplied values to the front of the key's list value
    val = values.concat(val);

    store(key, val);

    return val.length;
  };

  // Helper for pushx type commands (lpushx and rpushx)
  var pushx = function (key, left, values) {
    var val       = retrieve(key),
        keyExists = exists(key),
        isArray   = val instanceof Array;

    if (keyExists && isArray) {
      return left ? this.lpush(key, values) : this.rpush(key, values);
    }

    return 0;
  };

  // Inserts the value(s) at the head of the list stored at key,
  // only if key already exists and holds a list.
  // Returns:   the length of the post-insertion list
  //            0 if the key does not contain a value
  localRedis.lpushx = function (key, value) {
    if (arguments.length < 2) throwError(WRONG_ARGUMENTS);

    return pushx.call(this, key, true, Array.prototype.splice.call(arguments, 1));
  };

  // Inserts the value(s) at the tail of the list stored at key
  // Returns: the length of the list post-insertion
  // Note:    defaults the value of a non-existent key to the empty list
  // Usage:   rpush(key, val) or rpush(key, val1, val2, ...) or rpush(key, [val1, val2, ...])
  localRedis.rpush = function (key, value) {
    if (arguments.length < 2) throwError(WRONG_ARGUMENTS);

    var values,
        i, l,
        val = retrieve(key);

    if (exists(key) && ! (val instanceof Array)) throwError(VALUE_NOT_ARRAY);

    if (arguments.length > 2) {
      values = Array.prototype.splice.call(arguments, 1);

    // If value is already an array, pass it along
    } else if (value instanceof Array) {
      values = value;

    // Convert single values to an array to use concat
    } else {
      values = [value];
    }

    val = val || [];
    val = val.concat(values);
    store(key, val);

    return val.length;
  };

  // Inserts the value(s) at the tail of the list stored at key,
  // only if key already exists and holds a list.
  // Returns:   the length of the post-insertion list
  //            0 if the key does not contain a value
  localRedis.rpushx = function (key, value) {
    if (arguments.length < 2) throwError(WRONG_ARGUMENTS);
    return pushx.call(this, key, false, Array.prototype.splice.call(arguments, 1));
  };

  // Returns:   the length of the list value of key
  //            0 if the key does not exist.
  // Throws when the value at key is not a list.
  localRedis.llen = function (key) {
    if(arguments.length < 1) throwError(WRONG_ARGUMENTS);
    var val = retrieve(key);

    if (! exists(key)) return 0;

    if (! (val instanceof Array)) throwError(VALUE_NOT_ARRAY);

    return val.length;
  };

  // Returns: the specified elements (indexed by start and stop)
  //          of the list at key.
  //          An empty list if the start is larger than the end of the list
  // Note:    the offsets can also be negative numbers
  //          If stop is larger than the end of the list, stop will be the end of the list
  localRedis.lrange = function (key, start, stop) {
    var results = [],
        val     = retrieve(key),
        // We need to include stop index in the slice
        // This works even for a negative stop
        indexModifier = 1,
        stopIndex = stop + indexModifier;

    if (! (val instanceof Array)) throwError(VALUE_NOT_ARRAY);
    
    if (start > val.length || ! exists(key)) return results;
        
    // Clamp to the end of the list
    if (stopIndex > val.length) stopIndex = val.length;

    // If stop is -1, then go to the end of the list
    // including the last element
    if (stop === -1) stopIndex = undefined;

    results = val.slice(start, stopIndex);
    return results;
  };

  // Removes the first count ocurrences of value in the list
  // stored at key.
  // Precond:   count > 0 removes from start to finish
  //            count < 0 removes from finish to start
  //            count = 0 removes all elements equal to value
  // Returns:   the number of removed elements
  //            0 when the key does not exist
  // Throws when the value at key is not a list.
  localRedis.lrem = function (key, count, value) {
    if (arguments.length !== 3) throwError(WRONG_ARGUMENTS);

    var val = retrieve(key),
        numRemoved = 0,
        removeAll  = count === 0,
        i, end;

    if (! exists(key)) return numRemoved;
    if (! (val instanceof Array)) throwError(VALUE_NOT_ARRAY);

    // Remove from the tail
    if (count < 0) {
      count = Math.abs(count);

      for (i = val.length - 1; i >= 0; i--) {
        if (val[i] !== value) continue;

        // Stop if we've removed count instances
        if (! count) break;

        val.splice(i, 1);
        numRemoved++;
        count--;
      }

    // Remove from the head and check for remove all
    } else {
      for (i = 0, end = val.length; i < end; i++) {
        if (val[i] !== value) continue;

        // If we're to removeAll
        if (removeAll) {
          val.splice(i, 1);
          numRemoved++;
          // Since the element was removed,
          // adjust for the elements shifting left
          i--;

        // Otherwise, count was originally greater than zero
        } else {
          val.splice(i, 1);
          // Counter the in-place removal
          i--;
          numRemoved++;
          count--;
          if (! count) break;
        }
      }
    }

    store(key, val);
    return numRemoved;
  };

})(window, document);