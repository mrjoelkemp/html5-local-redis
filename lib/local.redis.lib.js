var LocalRedis    = LocalRedis || {};
LocalRedis.Utils  = LocalRedis.Utils || {};

(function (Utils) {
  "use strict";

  ///////////////////////////
  // Profiling Helpers
  ///////////////////////////

  // Call tic() before and toc() after the code you
  //  want profiled. The elapsed seconds will then
  //  be printed to the console.
  Utils.Tictoc = {
    start: 0,

    tic: function () {
      this.start = new Date().getTime();
    },

    toc: function () {
      var elapsedSeconds = (new Date().getTime() - this.start) / 1000,
          output  = elapsedSeconds + "s";

      if(typeof console === "undefined") {
        alert(output);
      } else {
        console.log(output);
      }
    }
  };

  ///////////////////////////
  // Expiration Helpers
  ///////////////////////////
  Utils.Expiration = {
    expDelimiter: ":",
    expKeyPrefix: "e",

    // Creates the expiration key format for a given storage key
    // Returns: the expiration key associated with the passed storage key
    createExpirationKey: function (storageKey) {
      // Stringify if it's an object
      storageKey = (typeof storageKey === 'string') ? storageKey : JSON.stringify(storageKey);
      return this.expKeyPrefix + this.expDelimiter + storageKey;
    },

    // Creates the expiration value/data format for an expiration
    //  event's ID and millisecond delay
    // Returns: A string representation of an object created from the data
    // Note:    Keys are as short as possible to save space when stored
    createExpirationValue: function (timeoutID, delay) {
      return JSON.stringify({
        id: timeoutID,
        d: delay
      });
    },

    // Retrieves the expiration data associated with the storage key
    // Precond: key is storage key
    //          storageContext is the current storage object
    // Returns: A parsed expiration value object of the retrieved data
    getExpirationValue: function (storageKey, storageContext) {

      if (! storageContext) {
        throw new TypeError('getExpirationValue: expected storage context');
      }

      var expKey = this.createExpirationKey(storageKey),
          expVal = storageContext._retrieve(expKey);

      return expVal;
    },

    // Retrieves the timeout id associated with the key's expiration
    // Returns:   the timeout id or null
    getExpirationID: function (storageKey, storageContext) {
      if (! storageContext) {
        throw new TypeError('getExpirationID: expected storage context');
      }

      var expVal = this.getExpirationValue(storageKey, storageContext);
      return (expVal && expVal.id) ? expVal.id : null;
    },

    // Retrieves the timeout delay associated with the key's expiration
    // Returns:   the timeout delay or null
    getExpirationDelay: function (storageKey, storageContext) {
      if (! storageContext) {
        throw new TypeError('getExpirationDelay: expected storage context');
      }

      var expVal = this.getExpirationValue(storageKey, storageContext);
      return (expVal && expVal.d) ? expVal.d : null;
    },

    // Creates expiration data for the passed storage key and its
    //  expiration event's data
    setExpirationOf: function (storageKey, timeoutID, delay, storageContext) {
      if (! storageContext) {
        throw new TypeError('setExpirationOf: expected storage context');
      }

      var expKey = this.createExpirationKey(storageKey),
          expVal = this.createExpirationValue(timeoutID, delay);

      // Use setItem to avoid resetting expiry
      storageContext.setItem(expKey, expVal);
    },

    // Removes/Cancels an existing expiration of the passed key
    removeExpirationOf: function (storageKey, storageContext) {
      if (! storageContext) {
        throw new TypeError('removeExpirationOf: expected storage context');
      }

      var expKey = this.createExpirationKey(storageKey),
          expVal = this.getExpirationValue(storageKey, storageContext);

      if (expVal && expVal.id) {
        // Clear the existing timeout
        clearTimeout(expVal.id);
      }

      // Delete the expiration data
      storageContext._remove(expKey);
    },

    // Whether or not the given key has existing expiration data
    // Returns:   true if expiry data exists, false otherwise
    hasExpiration: function (storageKey, storageContext) {
      if (! storageContext) {
        throw new TypeError('hasExpiration: expected storage context');
      }

      return !! this.getExpirationValue(storageKey, storageContext);
    }

  };

})(LocalRedis.Utils);