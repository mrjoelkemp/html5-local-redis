describe('incr', function () {
  var keysValsObj = {
        'first' : 1,
        'last'  : 23,
        'age'   : 94,
        'person': 0,
        'pi'    : 3.14
      };

  it('should increment an existing key\'s value by 1', function () {
    var baseKeys = Object.keys(keysValsObj),
        keys = [],
        key,
        i;

    for (i = 0; i < baseKeys.length; i++) {
      keys.push(baseKeys[i]);
    }

    key = keys[Math.ceil(Math.random() * (keys.length - 1))]; // Get a random key
    storage._store(key, keysValsObj[key]);

    // Attempt to increment
    storage.incr(key);

    expect(storage._retrieve(key)).toBe(keysValsObj[key] + 1);
  });

  it('should be 1 if the key does not exist', function () {
    var baseKeys = Object.keys(keysValsObj),
        keys = [],
        key,
        i;

    for (i = 0; i < baseKeys.length; i++) {
      keys.push(baseKeys[i]);
    }

    key = keys[Math.ceil(Math.random() * (keys.length - 1))]; // Get a random key

    // Attempt to increment
    storage.incr(key);

    expect(storage._retrieve(key)).toBe(1);
  });

});

describe('incrby', function () {
  var keysValsObj = {
        'first' : 1,
        'last'  : 23,
        'age'   : 94,
        'person': 0,
        'pi'    : 3.14
      };

  it('should increment a key\'s value by \'amount\', and set it first if it does not exist', function () {
    var baseKeys = Object.keys(keysValsObj),
        keys = [],
        key,
        i,
        amount;

    for (i = 0; i < baseKeys.length; i++) {
      keys.push(baseKeys[i]);
    }

    key = keys[Math.ceil(Math.random() * (keys.length - 1))]; // Get a random key
    storage._store(key, keysValsObj[key]);

    amount = Math.ceil(Math.random() * 100);
    // Attempt to increment
    storage.incrby(key, amount);

    expect(storage._retrieve(key)).toBe(keysValsObj[key] + amount);
  });
});

describe('mincr', function () {
  var keysValsObj = {
        'first' : 1,
        'last'  : 23,
        'age'   : 94,
        'person': 0,
        'pi'    : 3.14
      };

  it('should increment a set of keys by 1, and set them first if they do not exist', function () {
    var baseKeys = Object.keys(keysValsObj),
        keys = [],
        key,
        i;

    for (i = 0; i < baseKeys.length; i++) {
      if (typeof keysValsObj[baseKeys[i]] === 'number') {
        keys.push(baseKeys[i]);
        storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
      }
    }

    storage.mincr(keys);

    for (key in keys) {
      expect(storage._retrieve(keys[key])).toBe(keysValsObj[keys[key]] + 1);
    }
  });
});

describe('mincrby', function () {
  var keysValsObj = {
        'first' : 1,
        'last'  : 23,
        'age'   : 94,
        'person': 0,
        'pi'    : 3.14
      };

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
        storage._store(baseKeys[i], keysValsObj[baseKeys[i]]);
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
      expect(storage._retrieve(array[i])).toBe(keysValsObj[array[i]] + array[i + 1]);
    }
  });
});