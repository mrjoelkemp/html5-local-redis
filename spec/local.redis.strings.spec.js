describe('get', function () {
  it('retrieves a value for a key that exists', function () {
    var k = 'foo',
        v = 2;

    // Set the data – uses the safer setItem to avoid dependency on untested set().
    storage.setItem(k, v);
    expect(storage.get(k)).toBe(v);
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
});

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
    expect(function(){ storage.set('foo', 1).set('bar', 2); }).not.toThrow();
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
        expect(e).toBeTruthy();
        break;
      }
    }
  });

  it('cancels an existing expiration for the key', function () {
    storage._store('foo', 'bar');
    // expire foo after 15ms
    storage.expire('foo', 15 / 1000);

    waits(10);
    runs(function () {
      // Shouldn't refresh the expiration
      storage.set('foo', 'foobar');
    });

    // Expires 'foo' if it hasn't been reset by 'set'
    waits(10);
    runs(function () {
      expect(exp.hasExpiration('foo', storage)).toBeFalsy();
    });
  });
}); // end set

describe('mget', function () {
  it('retrieves the values for multiple keys', function () {
    storage._store('foo', 'foobar');
    storage._store('bar', 'foobar');
    // Check the mget('key1', 'key2') syntax
    var results = storage.mget('foo', 'bar');
    // Check that the results sets have the proper value
    expect(results).toEqual(['foobar', 'foobar']);
  });

  it('retrieves the values for each key in a supplied list of keys', function () {
    storage._store('foo', 'foobar');
    storage._store('bar', 'foobar');
    // Check the mget(['key1', 'key2']) syntax
    var results = storage.mget(['foo', 'bar']);
    expect(results).toEqual(['foobar', 'foobar']);
  });
}); // end mget

describe('mset', function () {
  var keysVals  = ['foo', 'foobar', 'bar', 'foobar'];

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
    expect(function(){ storage.mset(keysVals).mset(keysVals); }).not.toThrow();
  });

  it('does not reset a key\'s existing expiration', function () {
    storage._store('foo', 'bar');
    storage.expire('foo', 15 / 1000);

    waits(10);
    runs(function () {
      // Should not affect the expiration of 'foo'
      storage.mset('foo', 'foobar');
    });

    waits(10);
    runs(function () {
      // 'foo' should have expired
      expect(storage._exists('foo')).toBeFalsy();
    });
  });
}); // end mset

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
    expect(function () { storage.getset('foo', 'bar'); }).toThrow();
  });

  it('cancels an existing expiration for the key', function () {
    storage._store('foo', 'bar');
    // expire foo after 15ms
    storage.expire('foo', 15 / 1000);

    waits(10);
    runs(function () {
      // Shouldn't reset the expiration
      storage.getset('foo', 'foobar');
    });

    // Expires 'foo' if it hasn't been reset by getset
    waits(10);
    runs(function () {
      expect(exp.hasExpiration('foo', storage)).toBeFalsy();
    });
  });
});

describe('append', function () {
  it('appends a string to a key\'s string value', function () {
    storage._store('foo', 'bar');
    storage.append('foo', 'car');
    expect(storage._retrieve('foo')).toBe('barcar');
  });

  it('returns the length of the new (appended) value', function () {
    storage._store('foo', 'bar');
    expect(storage.append('foo', 'car')).toBe('barcar'.length);
  });

  it('sets the key\'s value if the key does not exist', function () {
    storage.append('foo', 'bar');
    expect(storage._retrieve('foo')).toBe('bar');
  });

  it('does not append for non-strings, returning the original length', function () {
    storage._store('foo', 4);
    expect(storage.append('foo', 'bar')).toBe(1);
    expect(storage._retrieve('foo')).toBe(4);
  });
});

describe('strlen', function () {
  it('throws when the key\'s value is not a string', function () {
    storage._store('foo', 4);
    expect(function () { storage.strlen('foo'); }).toThrow();
  });

  it('returns the length of the key\'s string value', function () {
    storage._store('foo', 'bar');
    expect(storage.strlen('foo')).toBe('bar'.length);
  });

  it('returns 0 when the key does not exist', function () {
    expect(storage.strlen('foo')).toBe(0);
  });
});

describe('msetnx', function () {
  it('sets keys to values if none of the keys exist', function () {
    storage.msetnx('foo', 'bar', 'bar', 'foo');
    expect(storage._retrieve('foo')).toBe('bar');
    expect(storage._retrieve('bar')).toBe('foo');

    storage.clear();

    storage.msetnx(['foo', 'bar', 'bar', 'foo']);
    expect(storage._retrieve('foo')).toBe('bar');
    expect(storage._retrieve('bar')).toBe('foo');
  });

  it('returns 0 if any of the keys already exist', function () {
    storage._store('foo', 'bar');
    expect(storage.msetnx('foo', 'bar', 'bar', 'foo')).toBe(0);
  });

  it('does not set any of the keys if one already exists', function () {
    storage._store('foo', 'bar');
    storage.msetnx('foo', 'bar', 'bar', 'foo');
    expect(storage._retrieve('bar')).toBe(null);
  });

  it('returns 1 if the keys were set to the values', function () {
    expect(storage.msetnx('foo', 'bar', 'bar', 'foo')).toBe(1);
  });
});