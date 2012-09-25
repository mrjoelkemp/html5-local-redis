describe('Incr Commands - ', function () {
  var keysValsObj = {
        'number': 23,
        'number1': 1,
        'number2': '0',
        'string': 'abcd',
        'null': null,
        'undefined': undefined,
        'really-big-number': Number.MAX_VALUE + Number.MAX_VALUE
      },
      baseKeys = Object.keys(keysValsObj),
      keys = [],
      key,
      i,
      amount,
      array = [],
      keysThatThrow = [],
      keysThatDontThrow = [];

  describe('incr', function() {
    it('increments a key\'s value by 1', function () {
      keys = [];  // This actually mutates from test to test, so we reset
                  // it at every function scope.
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);

        storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
      }

      //Attempt to increment
      for(i = 0; i < keys.length; i++) {
        // Javascript does late binding, we must call a lambda to bind at the point
        // of iteration.
        (function (key) {
          // We provide closure so that the inner (throwing) function knows about 'key'
          var f = (function (k) { var key = k; return function () { storage.incr(key); }; })(key);
          // There are a few special cases that we explicitly handle.
          switch(key) {
            case 'string':
            case 'undefined':
            case 'null':
            case 'really-big-number':
              expect(f).toThrow();
             break;
            default:
              storage.incr(key);
              expect(storage.get(key)).toBe(parseInt(keysValsObj[key] + 1, 10));
              break;
          }
        })(keys[i]);
      }
    });

    it('sets the value of a non-existent key to 1', function () {
      //Attempt to increment with no value set in storage.
      storage.incr('foo');
      storage.incr('bar');
      expect(storage.get('foo')).toBe(parseInt(1, 10));
      expect(storage.get('bar')).toBe(parseInt(1, 10));
    });
  });

  describe('incrby', function() {
    it('increments a key\'s value by \'amount\', and sets it to 1 if it does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
        storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
      }

      amount = Math.ceil(Math.random() * 100);

      for(i = 0; i < keys.length; i++) {
        (function (key, a) {
          var f = (function (k) { var key = k, amount = a; return function () { storage.incrby(key, amount); }; })(key, amount);
          switch(key) {
            case 'string':
            case 'undefined':
            case 'null':
            case 'really-big-number':
              expect(f).toThrow();
             break;
            default:
              storage.incrby(key, amount);
              expect(storage.get(key)).toBe(parseInt(keysValsObj[key] + amount, 10));
              break;
          }
        })(keys[i], amount);
      }
    });

    it('is \'amount\' if the key does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
      }

      amount = Math.ceil(Math.random() * 100);

      // Attempt to increment with no value set in storage.
      for(i = 0; i < keys.length; i++) {
        storage.incrby(keys[i], amount);
        expect(storage.get(keys[i])).toBe(parseInt(amount, 10));
      }
    });

  });

  describe('mincr', function() {
    var f = function (k) { var keys = k; return function () { storage.mincr(keys); }; };
    it('increments a set of keys by 1', function () {
      keysThatThrow = [];
      keysThatDontThrow = [];
      for (i = 0; i < baseKeys.length; i++) {
          keys.push(baseKeys[i]);
          storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
          switch(baseKeys[i]) {
            case 'number':
            case 'number1':
            case 'number2':
              keysThatDontThrow.push(baseKeys[i]);
              break;
            default:
              keysThatThrow.push(baseKeys[i]);
              break;
          }
      }

      expect(f(keysThatThrow)).toThrow();
      expect(f(keysThatDontThrow)).not.toThrow();

      // Check that keys that do not throw have the proper values
      for (i in keysThatDontThrow) {
        key = keysThatDontThrow[i];
        expect(storage.get(key)).toBe(parseInt(keysValsObj[key], 10) + 1);
      }
    });

    it('sets a key\'s value to 1 if it does not exist in the key set', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
          keys.push(baseKeys[i]);
      }

      // We do not expect keys to throw on increment, if the keys do not exist in localStorage
      // (provided these are valid keys).
      expect(f(keys)).not.toThrow();

      // Check that keys that do not throw have the proper values
      for (i in keys) {
        key = keys[i];
        expect(storage.get(key)).toBe(1);
      }
    });
  });

  describe('mincrby', function() {
    var f = function (k) { var keys = k; return function () { storage.mincrby(keys); }; };
    it('increments a set of keys by their respective amounts', function () {
      keysThatThrow = [];
      keysThatDontThrow = [];
      amount = Math.ceil(Math.random() * 100);
      for (i = 0; i < baseKeys.length; i++) {
          storage.set(baseKeys[i], keysValsObj[baseKeys[i]]);
          switch(baseKeys[i]) {
            case 'number':
            case 'number1':
            case 'number2':
              keysThatDontThrow.push(baseKeys[i]);
              keysThatDontThrow.push(amount);
              break;
            default:
              keysThatThrow.push(baseKeys[i]);
              keysThatThrow.push(amount);
              break;
          }
      }

      expect(f(keysThatThrow)).toThrow();
      expect(f(keysThatDontThrow)).not.toThrow();

      for (i = 0; i < keysThatDontThrow.length; i += 2) {
        key = keysThatDontThrow[i];
        amount = keysThatDontThrow[i + 1];
        expect(storage.get(key)).toBe(parseInt(keysValsObj[key], 10) + amount);
      }
    });

    it('sets a key\'s value to its respective amount if it does not exist in the key set', function () {
      keys = [];
      amount = Math.ceil(Math.random() * 100);
      for (i = 0; i < baseKeys.length; i++) {
          keys.push(baseKeys[i]);
          keys.push(amount);
      }

      expect(f(keys)).not.toThrow();

      for (i = 0; i < keys.length; i += 2) {
        key = keys[i];
        amount = keys[i + 1];
        expect(storage.get(key)).toBe(amount);
      }
    });
  });
});