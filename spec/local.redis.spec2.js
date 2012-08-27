describe('incr', function () {
  var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14],
      keysValsObj = {
        'first2': 'Bob',
        'last2': 'Saget',
        'age2': 94,
        'person2': { 'name': 'Yogi Bear'},
        'pi2': 3
      };

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
  var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14],
      keysValsObj = {
        'first2': 'Bob',
        'last2': 'Saget',
        'age2': 94,
        'person2': { 'name': 'Yogi Bear'},
        'pi2': 3
      };

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
  var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14],
      keysValsObj = {
        'first2': 'Bob',
        'last2': 'Saget',
        'age2': 94,
        'person2': { 'name': 'Yogi Bear'},
        'pi2': 3
      };

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
  var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14],
      keysValsObj = {
        'first2': 'Bob',
        'last2': 'Saget',
        'age2': 94,
        'person2': { 'name': 'Yogi Bear'},
        'pi2': 3
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