describe('set', function () {
  it('stores a value indexed by its key', function () {
    var k = 'foo',
        v = 'bar';

    // Attempt to store
    storage.set(k, v);

    // Retrieve the value and make sure it's equal to the stored value
    // Uses getItem to avoid the dependency on the untested get()
    var val = storage.getItem(k);
    expect(val).toBe(v);
  });

  it('auto stringifies an object being stored as a value', function () {
    var k = 'foo',
        v = {"name": "Yogi Bear"},
        type;

    storage.set(k, v);

    // Check that the value stored is a string
    type = typeof storage.getItem(k);
    expect(type).toBe('string');
  });

  it('accepts objects as keys', function () {
    var k = {"name": "Yogi Bear"},
        v = 2,
        val;

    storage.set(k, v);

    val = storage.getItem(stringify(k));
    // getItem() returns string values
    expect(val).toBe(v.toString());
  });

  it('is chainable', function () {
    // Throws a TypeError if invocation is illegal
    expect(function(){ storage.set('foo', 1).set('bar', 2); }).not.toThrow(TypeError);
  });

  it('throws an exception if the quota is reached', function () {
    var i, data;

    storage.set('foo', 'm');

    // Exceed the quota
    for(i = 0 ; i < 40 ; i++) {
      data = storage.getItem('foo');

      try {
        storage.set('foo', data + data);
      } catch(e) {
        expect(e.arguments[0]).toBe('QUOTA_EXCEEDED_ERR');
        break;
      }
    }
  });
}); // end set

describe('get', function () {
  it('retrieves a value for a key that exists', function () {
    var k = 'foo',
        v = 2;

    // Set the data – uses the safer setItem to avoid dependency on untested set().
    storage.setItem(k, v);
    expect(storage.get(k)).toBe(v);
  });

  it('returns a string if the value is a string literal (alphabetical)', function () {
    var k = 'foo',
        v = 'Yogi Bear';

    storage.setItem(k, v);
    expect(storage.get(k)).toBe(v);
  });

  it('returns an object for a string value that contains an object', function () {
    var k = 'foo',
        v = {"name": "Yogi Bear"};

    storage.setItem(k, stringify(v));
    expect(storage.get(k)).toEqual(v);
  });

  it('returns a number for a string value that contains a number', function () {
    var k = 'foo',
        v = 2,
        val;

    storage.setItem(k, v);

    val = storage.get(k);

    expect(val).toBe(v);
  });

  it('accepts an object as a key', function () {
    var k = {"name": "Yogi Bear"},
        v = 2,
        val;

    storage.setItem(stringify(k), v);

    val = storage.get(k);

    // Get auto parses, so we don't need v.toString()
    expect(val).toBe(v);
  });
}); // end get

describe('mget', function () {
  it('retrieves the values for multiple keys', function () {
    var keysVals  = ['first', 'Joel', 'last', 'Kemp'],
        results   = [],
        expectVals= [keysVals[1], keysVals[3]];

    // Store all of the data
    for (var i = 0, l = keysVals.length; i < l; i += 2) {
      storage.setItem(keysVals[i], keysVals[i + 1]);
    }

    // Check the mget('key1', 'key2') syntax
    results[0] = storage.mget(keysVals[0], keysVals[2]);

    // Check the mget(['key1', 'key2']) syntax
    results[1] = storage.mget([keysVals[0], keysVals[2]]);

    // Check that the results sets have the proper values
    expect(results[0]).toEqual(expectVals);
    expect(results[1]).toEqual(expectVals);
  });
}); // end mget

describe('mset', function () {
  var keysVals  = ['first', 'Joel', 'last', 'Kemp'];

  afterEach(function () {
    // Remove the dummy data to test other insertion syntaxes
    for (var i = 0, l = keysVals.length; i < l; i += 2) {
      storage.removeItem(keysVals[i]);
    }
  });

  it('stores multiple key-value pairs passed as separate parameters', function () {
    // Test the mset('k1', 'v1', 'k2', 'v2') syntax
    storage.mset(keysVals[0], keysVals[1], keysVals[2], keysVals[3]);

    // The values should be correct if the mset worked
    expect(storage.getItem(keysVals[0])).toBe(keysVals[1]);
    expect(storage.getItem(keysVals[2])).toBe(keysVals[3]);
  });

  it('stores multiple key-value pairs passed as a list', function () {
    // Test the mset(['k1', 'v1', 'k2', 'v2']) syntax
    storage.mset(keysVals);

    expect(storage.getItem(keysVals[0])).toBe(keysVals[1]);
    expect(storage.getItem(keysVals[2])).toBe(keysVals[3]);
  });

  it('stores multiple key-value pairs passed as an object', function () {
    var objForm = {};
    // Note: we can't use vars with literal notation
    objForm[keysVals[0]] = keysVals[1];
    objForm[keysVals[2]] = keysVals[3];

    // Test the mset({'k1': 'v1', 'k2': 'v2'}) syntax
    storage.mset(objForm);

    expect(storage.getItem(keysVals[0])).toBe(keysVals[1]);
    expect(storage.getItem(keysVals[2])).toBe(keysVals[3]);
  });

  it('is chainable', function () {
    // Throws a TypeError if invocation is illegal
    expect(function(){ storage.mset(keysVals).mset(keysVals); }).not.toThrow(new TypeError("Illegal invocation"));
  });
}); // end mset

describe('del', function () {
  it('deletes the row/entry identified by the given key', function () {
    storage.setItem('foo', 1);
    storage.del('foo');
    expect(storage.getItem('foo')).toBe(null);
  });

  it('deletes the given splat keys and their values', function () {
    storage.setItem('foo', 1);
    storage.setItem('bar', 2);
    storage.del('foo', 'bar');
    expect(storage.getItem('foo')).toBe(null);
    expect(storage.getItem('bar')).toBe(null);
  });

  it('deletes the given keys (as an array) and their values', function () {
    storage.setItem('foo', 1);
    storage.setItem('bar', 2);
    storage.del(['foo', 'bar']);
    expect(storage.getItem('foo')).toBe(null);
    expect(storage.getItem('bar')).toBe(null);
  });

  it('returns the number of deleted keys', function () {
    storage.setItem('foo', 1);
    storage.setItem('bar', 2);
    var deleted = storage.del('foo', 'bar');
    expect(deleted).toEqual(2);
  });

  it('ignores keys that don\'t exist', function () {
    var deleted = storage.del('foo');
    expect(deleted).toEqual(0);
  });

  it('removes a key\'s existing expiration information', function () {
    var expKey = exp.createExpirationKey('foo', storage);
    storage.setItem('foo', 'bar');

    // Fake an expiration event
    exp.setExpirationOf('foo', 1, 100, storage);
    storage.del('foo');
    expect(storage.getItem(expKey)).toBe(null);
  });
});

describe('exists', function () {
  it('returns 1 if the key exists', function () {
    storage.setItem('foo', 1);
    expect(storage.exists('foo')).toBe(1);
  });

  it('returns 0 if the key does not exist', function () {
    expect(storage.exists('foobar')).toBe(0);
  });

  it('throws a TypeError if more than one argument is given', function () {
    expect(function() {storage.exists('foo', 'bar')}).toThrow(new TypeError("exists: wrong number of arguments"));
  });
});

describe('rename', function () {
  it('throws a ReferenceError when the key does not exist', function () {
    expect(function () { storage.rename('foo', 'foobar'); }).toThrow(new ReferenceError("rename: no such key"));
  });

  it('throws a TypeError when the key is the same as the newkey', function () {
    expect(function () { storage.rename('foo', 'foo'); }).toThrow(new TypeError("rename: source and destination objects are the same"));
  });

  it('renames a key to a given name', function () {
    storage.setItem('foo', 'bar');
    storage.rename('foo', 'foobar');
    expect(storage.getItem('foo')).toBe(null);
    expect(storage.getItem('foobar')).toBe('bar');
  });

  it('throws a TypeError for anything but 2 inputs', function () {
    var expectedError = new TypeError("rename: wrong number of arguments");
    expect(function () { storage.rename('foo'); }).toThrow(expectedError);
    expect(function () { storage.rename('foo', 'foobar', 'bar'); }).toThrow(expectedError);
  });

});

describe('renamenx', function () {
  it('throws a ReferenceError when the key does not exist', function () {
    expect(function () { storage.renamenx('foo', 'foobar'); }).toThrow(new ReferenceError("renamenx: no such key"));
  });

  it('throws a TypeError when the key is the same as the newkey', function () {
    expect(function () { storage.renamenx('foo', 'foo'); }).toThrow(new TypeError("renamenx: source and destination objects are the same"));
  });

  it('returns 0 if the newkey already exists', function (){
    storage.setItem('foo', 'boo');
    storage.setItem('bar', 'coo');
    // We'll try to rename foo to bar, though bar exists
    expect(storage.renamenx('foo', 'bar')).toBe(0);
  });

  it('returns 1 when key has been renamed to newkey', function () {
    storage.setItem('foo', 'bar');
    expect(storage.renamenx('foo', 'foobar')).toBe(1);
    expect(storage.getItem('foobar')).toBe('bar');
  });

  it('throws a TypeError for anything but 2 inputs', function () {
    var expectedError = new TypeError("renamenx: wrong number of arguments");
    expect(function () { storage.renamenx('foo', 'foobar', 'bar'); }).toThrow(expectedError);
    expect(function () { storage.renamenx('foo'); }).toThrow(expectedError);
  });
});

describe('getKey', function () {
  it('returns the first key associated with a given value', function () {
    // setItem does not retain insertion ordering, so we
    //  can't assume the returned key is 'foo'.
    storage.setItem('foo', 'bar');
    storage.setItem('coo', 'bar');
    var key = storage.getKey('bar'),
        containsOne = key === 'foo' || key === 'coo';

    expect(containsOne).toBe(true);
  });

  it('returns all keys associated with a given value if second param is true', function () {
    storage.setItem('foo', 'bar');
    storage.setItem('coo', 'bar');
    var keys = storage.getKey('bar', true);
    expect(keys).toContain('foo');
    expect(keys).toContain('coo');
  });

  it('returns null if no keys contain the passed val', function () {
    expect(storage.getKey('foobar')).toBe(null);
  });

  it('throws a TypeError if too many arguments are given', function () {
    expect(function () { storage.getKey('foo', 'bar', 'car'); }).toThrow(new TypeError('getKey: wrong number of arguments'));
  });
});

describe('getset', function () {
  it('returns the old value of the passed key', function () {
    storage.setItem('foo', 'bar');
    var oldVal = storage.getset('foo', 'foobar');
    expect(oldVal).toBe('bar');
  });

  it ('sets the key to the passed value', function () {
    storage.setItem('foo', 'bar');
    storage.getset('foo', 'foobar');
    expect(storage.getItem('foo')).toBe('foobar');
  });

  it('returns null if the key doesn\'t exist', function () {
    expect(storage.getset('foo', 'bar')).toBe(null);
  });

  it('throws an exception when the existing value is not a string', function () {
    storage.setItem('foo', 1);
    expect(function () { storage.getset('foo', 'bar'); }).toThrow(new Error('getset: not a string value'));
  });
});

describe('expire', function () {
  it('removes the key/value pair after the delay', function () {
    storage.setItem('foo', 'bar');
    // 10 ms
    storage.expire('foo', 10 / 1000);

    // Wait until the key expired or time out
    waitsFor(function () {
      return ! storage.getItem('foo');
    }, 'key did not expire', 15 / 1000);

    runs(function () {
      expect(storage.getItem('foo')).toBe(null);
    });
  });

  it('returns 1 if the timeout was set', function () {
    storage.setItem('foo', 'bar');
    expect(storage.expire('foo', 1 / 1000)).toBe(1);
  });

  it('returns 0 if the key does not exist', function () {
    expect(storage.expire('foo', 1 / 1000)).toBe(0);
  });

  it('throws an error if a number (or string version of a number) was not supplied', function () {
    storage.setItem('foo', 'bar');
    expect(function () { storage.expire('foo', 'bar'); }).toThrow(new TypeError('expire: delay should be convertible to a number'));
  });

  it('delays in seconds', function () {
    storage.setItem('foo', 'bar');
    // Set expiration delay of a tenth of a second (10ms)
    storage.expire('foo', 10/1000);

    // If it accepted ms, then it would have expired at 10/1000ms < 1ms
    waits(1);
    runs(function () {
      // Expiry data should still be there after 1ms
      expect(storage._retrieve(exp.createExpirationKey('foo'))).not.toBe(null);
    });
  });

  // Returns whether or passed command resets an existing expiration
  var resetsExpiration = function (command) {
    var expVal;

    storage.setItem('foo', 'bar');
    // Set expiration delay of 10ms
    storage.expire('foo', 1);

    waits(900);
    runs(function () {
      // Call the command to test whether or not it affected expiry
      command.call(storage, 'foo', 'foobar');
    });

    // Should expire if command doesn't reset expiry
    waits(200);

    runs(function () {
      // Try to grab the expiration data
      expVal = storage._retrieve(exp.createExpirationKey('foo'));
      return !! expVal;
    });


  };

  it('gets called by set to reset an expiration', function () {
    expect(resetsExpiration(storage.set)).toBeTruthy();
  });

  it('does not get affected with mset', function () {
    expect(resetsExpiration(storage.mset)).toBeFalsy();
  });
});