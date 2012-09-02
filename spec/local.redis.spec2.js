describe('Incr Commands - ', function () {
  var keysValsObj = {
        'number' : 23,
        'number1' : 1,
        'number2': 0,
        'string' : 'abcd',
        'null': null,
        'undefined': undefined,
        'pi' : 3.141592653589793238462643383279502884197169399375105820974944592307816406286,
        'really-big-number' : Number.MAX_VALUE + Number.MAX_VALUE
      },
      baseKeys = Object.keys(keysValsObj),
      keys = [],
      key,
      i,
      amount,
      array = [],
      ROUND_AMOUNT = 1000,
      roundedValue,
      roundedRetrievedValue,
      keysThatThrow = [],
      keysThatDontThrow = [];

  describe('incr', function() {
    it('increments a key\'s value by 1', function () {
      keys = [];  // This actually mutates from test to test, so we reset
                  // it at every function scope.
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
        storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
      }

      //Attempt to increment

      for(i = 0; i < keys.length; i++) {
        // Javascript does late binding, we must call a lambda to bind at the point
        // of interation.
        (function (key) {
          // We provide closure so that the inner (throwing) function knows about 'key'
          var f = (function (k) { var key = k; return function () { storage.incr(key); }; })(key);
          // There are a few special cases that we explicitly handle.
          switch(key) {
            case 'pi':
              // Floating point comparision is not accurate as per the IEEE standard, we must
              // work around this
              roundedValue = Math.round(parseFloat(keysValsObj[key] + 1) * ROUND_AMOUNT / ROUND_AMOUNT);
              storage.incr(key);
              roundedRetrievedValue = Math.round(parseFloat(storage._retrieve(key)) * ROUND_AMOUNT / ROUND_AMOUNT);
              expect(roundedRetrievedValue).toBe(roundedValue);
              break;
            case 'string':
            case 'undefined':
            case 'null':
            case 'really-big-number':
              expect(f).toThrow();
             break;
            default:
              storage.incr(key);
              expect(storage._retrieve(key)).toBe( parseInt(keysValsObj[key] + 1, 10) );
              break;
          }
        })(keys[i]);
      }
    });

    it('is 1 if the key does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
      }
      //Attempt to increment with no value set in storage.
      for(i = 0; i < keys.length; i++) {
        storage.incr(keys[i]);
        expect(storage._retrieve(keys[i])).toBe(parseInt(1, 10) );
      }
    });
  });

  describe('incrby', function() {
    it('increments a key\'s value by \'amount\', and set it to 1 if it does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
        storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
      }

      amount = Math.ceil(Math.random() * 100);

      for(i = 0; i < keys.length; i++) {
        (function (key, a) {
          var f = (function (k) { var key = k, amount = a; return function () { storage.incrby(key, amount); }; })(key, amount);
          switch(key) {
            case 'pi':
              // Floating point comparision is not accurate as per the IEEE standard, we must
              // work around this
              roundedValue = Math.round(parseFloat(keysValsObj[key] + amount) * ROUND_AMOUNT / ROUND_AMOUNT);
              storage.incrby(key, amount);
              roundedRetrievedValue = Math.round(parseFloat(storage._retrieve(key)) * ROUND_AMOUNT / ROUND_AMOUNT);
              expect(roundedRetrievedValue).toBe(roundedValue);
              break;
            case 'string':
            case 'undefined':
            case 'null':
            case 'really-big-number':
              expect(f).toThrow();
             break;
            default:
              storage.incrby(key, amount);
              expect(storage._retrieve(key)).toBe( parseInt(keysValsObj[key] + amount, 10) );
              break;
          }
        })(keys[i], amount);
      }
    });

    it('is \'amount\' if the keys does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
        keys.push(baseKeys[i]);
      }
      
      amount = Math.ceil(Math.random() * 100);

      // Attempt to increment with no value set in storage.
      for(i = 0; i < keys.length; i++) {
        storage.incrby(keys[i], amount);
        expect(storage._retrieve(keys[i])).toBe(parseInt(amount, 10) );
      }
    });

  });

  describe('mincr', function() {
    it('increments a set of keys by 1, and sets a key\'s value to 1 if it does not exist', function () {
      keys = [];
      for (i = 0; i < baseKeys.length; i++) {
          keys.push(baseKeys[i]);
          storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
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

      var f = function (k) { var keys = k; return function () { storage.mincr(keys); }; };

      expect(f(keysThatThrow)).toThrow();
      expect(f(keysThatDontThrow)).not.toThrow();

    });
  });

  // describe('mincrby', function() {
  //   it('increments a set of keys by amount, and sets a key\'s value to 1 if it does not exist', function () {
  //     for (i = 0; i < baseKeys.length; i++) {
  //       if (typeof keysValsObj[baseKeys[i]] === 'number') {
  //         keys.push(baseKeys[i]);
  //         storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
  //       }
  //     }

  //     amount = Math.ceil(Math.random() * 100);

  //     // Input format: List
  //     for (key in keys) {
  //       array.push(keys[key]);
  //       array.push(amount);
  //     }

  //     storage.mincrby(array);

  //     for (i = 0; i < array.length; i += 2) {
  //       //expect(storage._retrieve(array[i])).toBe(keysValsObj[array[i]] + array[i + 1]);
  //     }
  //   });
  // });
});