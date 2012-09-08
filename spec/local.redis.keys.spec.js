describe('Internal Helpers', function () {
  describe('_store', function () {
    it('sets the key to the given value', function () {
      storage._store('foo', 'bar');
      expect(storage.getItem('foo')).toBe('bar');
    });

    it('auto stringifies an object being stored as a value', function () {
      var k = 'foo',
          v = {"name": "foobar"},
          type;

      storage._store(k, v);

      // Check that the value stored is a string
      type = typeof storage.getItem(k);
      expect(type).toBe('string');
    });
  });

  describe('_retrieve', function () {
    it('returns the value associated with the key', function () {
      storage._store('foo', 'bar');
      expect(storage._retrieve('foo')).toBe('bar');
    });

    it('returns a string if the value is a string literal (alphabetical)', function () {
      var k = 'foo',
          v = 'foobar';

      storage.setItem(k, v);
      expect(storage._retrieve(k)).toBe(v);
    });

    it('returns an object for a string value that contains an object', function () {
      var k = 'foo',
          v = {"name": "foobar"};

      storage.setItem(k, stringify(v));
      expect(storage._retrieve(k)).toEqual(v);
    });

    it('returns a number for a string value that contains a number', function () {
      var k = 'foo',
          v = 2,
          val;

      storage.setItem(k, v);

      val = storage._retrieve(k);

      expect(val).toBe(v);
    });
  });

  describe('_remove', function () {
    it('deletes the key and its value from storage', function () {
      storage._store('foo', 'bar');
      storage._remove('foo');
      expect(storage._retrieve('foo')).toBe(null);
    });
  });

  describe('_exists', function () {
    it('returns true for a key with a set value of null', function () {
      storage._store('foo', null);
      expect(storage._exists('foo')).toBeTruthy();
    });

    it('returns false for a key that does not exist', function () {
      expect(storage._exists('foo')).toBeFalsy();
    });

    it('returns true for a key that has a value', function () {
      storage._store('foo', 'bar');
      expect(storage._exists('foo')).toBeTruthy();
    });
  });
});

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
}); // end get

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
    exp.setExpirationOf('foo', 1, 100, 100, storage);
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
    expect(function() {storage.exists('foo', 'bar')}).toThrow();
  });
});

describe('rename', function () {
  it('throws a ReferenceError when the key does not exist', function () {
    expect(function () { storage.rename('foo', 'foobar'); }).toThrow();
  });

  it('throws a TypeError when the key is the same as the newkey', function () {
    expect(function () { storage.rename('foo', 'foo'); }).toThrow();
  });

  it('renames a key to a given name', function () {
    storage.setItem('foo', 'bar');
    storage.rename('foo', 'foobar');
    expect(storage.getItem('foo')).toBe(null);
    expect(storage.getItem('foobar')).toBe('bar');
  });

  it('throws a TypeError for anything but 2 inputs', function () {
    expect(function () { storage.rename('foo'); }).toThrow();
    expect(function () { storage.rename('foo', 'foobar', 'bar'); }).toThrow();
  });

  it('transfers the ttl of the old key\'s expiration', function () {
    storage.setItem('foo', 'bar');
    storage.pexpire('foo', 15);

    waits(5);
    runs(function () {
      storage.rename('foo', 'foobar');
      // Make sure the new key has an expiration
      expect(exp.hasExpiration('foobar', storage)).toBeTruthy();
      var ttl = exp.getExpirationTTL('foobar', storage);
      // Make sure the new key's ttl is <= the elapsed time
      expect(ttl).toBeLessThan(11);
      expect(ttl).toBeGreaterThan(0);
      // Make sure the old key's expiration was removed
      expect(exp.hasExpiration('foo', storage)).toBeFalsy();
    });
  });

  it('removes the newkey\'s existing expiration', function () {
    storage._store('foo', 'bar');
    storage._store('foobar', 'bar');
    storage.pexpire('foobar', 15);
    waits(5);
    runs(function () {
      // Should remove the expiration of 'foobar'
      storage.rename('foo', 'foobar');
      expect(exp.hasExpiration('foobar', storage)).toBeFalsy();
    });
  });
});

describe('renamenx', function () {
  it('throws a ReferenceError when the key does not exist', function () {
    expect(function () { storage.renamenx('foo', 'foobar'); }).toThrow();
  });

  it('throws a TypeError when the key is the same as the newkey', function () {
    expect(function () { storage.renamenx('foo', 'foo'); }).toThrow();
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
    expect(function () { storage.renamenx('foo', 'foobar', 'bar'); }).toThrow();
    expect(function () { storage.renamenx('foo'); }).toThrow();
  });

  it('doesn\'t transfer the TTL of a key\'s existing expiration', function () {
    storage._store('foo', 'bar');
    exp.setExpirationOf('foo', 1, 100, new Date().getTime(), storage);

    storage.renamenx('foo', 'car');
    // The new key shouldn't have the ttl
    expect(exp.getExpirationTTL('car', storage)).toBe(null);
  });
});

describe('getkey', function () {
  it('returns the first key associated with a given value', function () {
    // setItem does not retain insertion ordering, so we
    //  can't assume the returned key is 'foo'.
    storage.setItem('foo', 'bar');
    storage.setItem('coo', 'bar');
    var key = storage.getkey('bar'),
        containsOne = key === 'foo' || key === 'coo';

    expect(containsOne).toBe(true);
  });

  it('returns all keys associated with a given value if second param is true', function () {
    storage.setItem('foo', 'bar');
    storage.setItem('coo', 'bar');
    var keys = storage.getkey('bar', true);
    expect(keys).toContain('foo');
    expect(keys).toContain('coo');
  });

  it('returns null if no keys contain the passed val', function () {
    expect(storage.getkey('foobar')).toBe(null);
  });

  it('throws a TypeError if too many arguments are given', function () {
    expect(function () { storage.getkey('foo', 'bar', 'car'); }).toThrow();
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
    expect(function () { storage.expire('foo', 'bar'); }).toThrow();
  });

  it('delays in seconds', function () {
    storage._store('foo', 'bar');
    // Set expiration delay of a tenth of a second (10ms)
    storage.expire('foo', 10 / 1000);

    // If expire didn't accept seconds (but ms), it would expire instantly 0.0001 ms
    // Expiry data should still be there after 1ms
    expect(exp.hasExpiration('foo', storage)).toBeTruthy();
  });

  it('refreshes an existing expiration if called again', function () {
    storage._store('foobar', 'bar');
    // Expire in 15ms
    storage.expire('foobar', 15 / 1000);

    waits(10);
    runs(function () {
      // Refreshes expiration to 10ms
      storage.expire('foobar', 10 / 1000);
    });
    // Should expire original if second call didn't refresh
    waits(6);
    runs(function () {
      expect(exp.hasExpiration('foobar', storage)).toBeTruthy();
    });
  });
});

describe('pexpire', function () {
  it('should expire a key with based on a supplied millisecond delay', function () {
    storage._store('foo', 'bar');
    storage.pexpire('foo', 15);

    // Wait until the key expires or fail after 20ms
    waitsFor(function () {
      return !exp.hasExpiration('foo', storage);
    }, 'key did not expire', 20);

    runs(function () {
      expect(storage._exists('foo')).toBeFalsy();
    });
  });
});

describe('persist', function () {
  it('cancels an existing expiration for the key', function () {
    storage._store('foo', 'bar');
    storage.expire('foo', 10 / 1000);
    storage.persist('foo');
    expect(exp.hasExpiration('foo', storage)).toBeFalsy();
  });

  it('returns 0 if the key does not exist', function () {
    expect(storage.persist('foo')).toBe(0);
  });

  it('returns 0 if the key does not have an expiration', function () {
    storage._store('foo', 'bar');
    expect(storage.persist('foo')).toBe(0);
  });

  it('returns 1 if an existing expiration was removed', function () {
    storage._store('foo', 'bar');
    storage.expire('foo', 5 / 1000);
    expect(storage.persist('foo')).toBe(1);
    expect(exp.hasExpiration('foo', storage)).toBeFalsy();
  });
});

describe('ttl', function () {
  it('returns the time to live for a key\'s expiration', function () {
    storage.setItem('foobar', 'bar');
    // Fake an expiration of 100ms
    exp.setExpirationOf('foobar', 1, 100, new Date().getTime(), storage);

    waits(10);
    runs(function () {
      var ttl = storage.ttl('foobar');
      expect(ttl).toBeGreaterThan(0);
    });
  });

  it('returns -1 if the key does not exist', function () {
    expect(storage.ttl('foo')).toBe(-1);
  });

  it('returns -1 if the key does not have an expiration', function () {
    storage._store('foo', 'bar');
    expect(storage.ttl('foo')).toBe(-1);
  });
});

describe('pttl', function () {
  it('returns the time to live for a key\'s expiration', function () {
    storage._store('foo', 'bar');
    exp.setExpirationOf('foo', 1, 100, new Date().getTime(), storage);
    waits(10);
    runs(function () {
      var ttl = storage.ttl('foo');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThan(100);
    });
  });
})

describe('randomkey', function () {
  it('returns a random key within the storage object', function () {
    storage._store('foo', 'bar');
    storage._store('bar', 'foo');
    storage._store('foobar', 'foobar');

    var randKey = storage.randomkey(),
        isValidKey = ['foo', 'bar', 'foobar'].indexOf(randKey) > -1;

    expect(isValidKey).toBeTruthy();
  });

  it('returns null if the storage object is empty', function () {
    expect(storage.randomkey()).toBe(null);
  });

  it('ensures fairness in that every key has a chance of being chosen', function () {
    var numKeys = 10,
        counts  = new Array(numKeys),
        i;

    // Store 10 misc key/value pairs
    for (i = 0; i < numKeys; i++) {
      storage._store('foo' + i, 'bar');
      counts[i] = 0;
    }

    var keys  = Object.keys(storage),
        index;

    // Run 100 times and see if every key gets chosen at least once
    for (i = 0; i < 100; i++) {
      index = keys.indexOf(storage.randomkey());

      expect(index).toBeGreaterThan(-1);

      counts[index]++;
    }

    // Ensure that each key was called
    for (i = 0; i < numKeys; i++) {
      expect(counts[i]).toBeGreaterThan(0);
    }
  });
});

describe('keys', function () {
  it('returns a list of keys that match pattern', function () {
    var numKeys = 10,
        pattern = 'foo*', // All keys that contain foo
        i, l,
        results,
        keys,
        containsKey;

    // Store 10 misc key/value pairs
    for (i = 0; i < numKeys; i++) {
      storage._store('foo' + i, 'bar');
    }

    keys = Object.keys(storage);

    results = storage.keys(pattern);

    // Expect all of the keys in the results set
    for (i = 0, l = keys.length; i < l; i++) {
      containsKey = results.indexOf(keys[i]) > -1;
      expect(containsKey).toBeTruthy();
    }
  });

  it('returns an empty list if no keys match pattern', function () {
    expect(storage.keys()).toEqual([]);
  });
});
