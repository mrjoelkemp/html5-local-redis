describe('suite', function () {
  var storage = window.localStorage;

  describe('commands', function() {

    // Dummy data
    // Need to use this or we have to manually remove the items and can't leverage afterEach()
    var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14],
        keysValsObj = { 
          'first2': 'Bob', 
          'last2': 'Saget', 
          'age2': 94, 
          'person2': { 'name': 'Yogi Bear'},
          'pi2': 3 
        };

    // Remove dummy data from the local store.
    afterEach(function() {
      var i, l;
      // Iterate over the keys
      for (i = 0, l = keysVals.length; i < l; i += 2) {
        storage.removeItem(keysVals[i]);
      }

      for (key in keysValsObj) {
        storage.removeItem(key);
      }
    });

    describe('set', function () {
      it('should store a value indexed by its key', function () {
        // Attempt to store
        storage.set(keysVals[0], keysVals[1]);

        // Retrieve the value and make sure it's equal to the stored value
        // Uses getItem to avoid the dependency on the untested get()
        var val = storage.getItem(keysVals[0]);
        expect(val).toBe(keysVals[1]);
      });

      // it should return an exception if the storage exceeds capacity (hard to replicate)
    });

    describe('get', function () {
      it('should retrieve a value for a key that exists', function () {
        // Set the data – uses the safer setItem to avoid dependency on untested set().
        storage.setItem(keysVals[0], keysVals[1]);

        expect(storage.get(keysVals[0])).toBe(keysVals[1]);
      });

      // it should return a string if the value is a string literal (alphabetical)

      // it should return an object for a string value that contains an object

      // it should return a number for a string value that contains a number

    });

    describe('incr', function () {
      it('should increment a key\'s value by 1, and set it first if it does not exist', function () {
        var baseKeys = Object.keys(keysValsObj),
            keys = [],
            key, 
            i;

        for (i = 0; i < baseKeys.length; i++) {
          if (typeof keysValsObj[baseKeys[i]] === 'number') {
            keys.push(baseKeys[i]);
          }
        }

        key = keys[Math.ceil(Math.random() * (keys.length - 1))]; // Get a random key
        storage.set(key, keysValsObj[key]);

        // Attempt to increment
        storage.incr(key);
   
        expect(storage.get(key)).toBe(keysValsObj[key] + 1);
      });
    });

    describe('incrby', function () {
      it('should increment a key\'s value by \'amount\', and set it first if it does not exist', function () {
        var baseKeys = Object.keys(keysValsObj),
            keys = [],
            key, 
            i,
            amount;

        for (i = 0; i < baseKeys.length; i++) {
          if (typeof keysValsObj[baseKeys[i]] === 'number') {
            keys.push(baseKeys[i]);
          }
        }

        key = keys[Math.ceil(Math.random() * (keys.length - 1))]; // Get a random key
        storage.set(key, keysValsObj[key]);

        amount = Math.ceil(Math.random() * 100);
        // Attempt to increment
        storage.incrby(key, amount);
   
        expect(storage.get(key)).toBe(keysValsObj[key] + amount);
      });
    });

    describe('mincr', function () {
      it('should increment a set of keys by 1, and set them first if they do not exist', function () {
        var baseKeys = Object.keys(keysValsObj),
            keys = [],
            key, 
            i;

        for (i = 0; i < baseKeys.length; i++) {
          if (typeof keysValsObj[baseKeys[i]] === 'number') {
            keys.push(baseKeys[i]);
            storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
          }
        }

        storage.mincr(keys);

        for (key in keys) {
          expect(storage.get(keys[key])).toBe(keysValsObj[keys[key]] + 1);
        }
      });
    });

    describe('mincrby', function () {
      it('should increment a set of keys by amount, and set them first if they do not exist', function () {
        var baseKeys = Object.keys(keysValsObj),
            keys = [],
            key, 
            i,
            amount,
            array = [];

        for (i = 0; i < baseKeys.length; i++) {
          if (typeof keysValsObj[baseKeys[i]] === 'number') {
            keys.push(baseKeys[i]);
            storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
          }
        }

        amount = Math.ceil(Math.random() * 100);

        // Input format: List
        for (key in keys) {
          array.push(keys[key]);
          array.push(amount);
        }

        storage.mincrby(array);

        for (i = 0; i < array.length; i += 2) {
          expect(storage.get(array[i])).toBe(keysValsObj[array[i]] + array[i + 1]);
        }
      });
    });
  });

});