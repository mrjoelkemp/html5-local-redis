describe('Keys API', function () {

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
      storage.setItem('foo', 'bar');
      storage.pexpire('foo', 15);
      storage.del('foo');
      expect(storage.expires('foo')).toBeFalsy();
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
    it('throws an error when the key does not exist', function () {
      expect(function () { storage.rename('foo', 'foobar'); }).toThrow();
    });

    it('throws an error when the key is the same as the newkey', function () {
      expect(function () { storage.rename('foo', 'foo'); }).toThrow();
    });

    it('renames a key to a given name', function () {
      storage.setItem('foo', 'bar');
      storage.rename('foo', 'foobar');
      expect(storage.getItem('foo')).toBe(null);
      expect(storage.getItem('foobar')).toBe('bar');
    });

    it('throws an error for anything but 2 inputs', function () {
      expect(function () { storage.rename('foo'); }).toThrow();
      expect(function () { storage.rename('foo', 'foobar', 'bar'); }).toThrow();
    });

    it('transfers the ttl of the old key\'s expiration', function () {
      storage.setItem('foo', 'bar');
      storage.pexpire('foo', 15);

      storage.rename('foo', 'foobar');

      // Make sure the new key has an expiration
      expect(storage.expires('foobar')).toBeTruthy();

      var ttl = storage.ttl('foobar');

      // Make sure the new key's ttl is <= the elapsed time
      expect(ttl).toBeDefined();
      // Make sure the old key's expiration was removed
      expect(storage.expires('foo')).toBeFalsy();
    });

    it('removes the newkey\'s existing expiration', function () {
      storage.setItem('foo', 'bar');
      storage.setItem('foobar', 'bar');
      storage.pexpire('foobar', 15);
      waits(5);
      runs(function () {
        // Should remove the expiration of 'foobar'
        storage.rename('foo', 'foobar');
        expect(storage.expires('foobar')).toBeFalsy();
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

    it('transfers the TTL of the old key\'s existing expiration', function () {
      storage.setItem('foo', 'bar');
      storage.pexpire('foo', 15);

      storage.renamenx('foo', 'car');
      // The new key shouldn't have the ttl
      expect(storage.expires('car')).toBeTruthy();
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
      runs(function () {
        storage.setItem('foo', 'bar');
        // 10 ms
        storage.expire('foo', 5 / 1000);
      });
      // // Wait until the key expired or time out
      // waitsFor(function () {
      //   // Get expires the key if necessary
      //   return ! storage.get('foo');
      // }, 'key did not expire', 15);
      waits(7);
      runs(function () {
        expect(storage.get('foo')).toBe(null);
      });
    });

    it('returns 1 if the expiration was set', function () {
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
      storage.setItem('foo', 'bar');
      // Set expiration delay of a tenth of a second (10ms)
      storage.expire('foo', 10 / 1000);

      // If expire didn't accept seconds (but ms), it would expire instantly 0.0001 ms
      // Expiry data should still be there after 1ms
      expect(storage.expires('foo')).toBeTruthy();
    });

    it('refreshes an existing expiration with the new delay if called again', function () {
      runs(function () {
        storage.setItem('foobar', 'bar');
        // Expire in 15ms
        storage.expire('foobar', 10 / 1000);
      });

      waits(5);
      runs(function () {
        // Refreshes expiration to 10ms
        storage.expire('foobar', 10 / 1000);
      });
      // Should expire original if second call didn't refresh
      waits(6);
      runs(function () {
        expect(storage.get('foobar')).not.toBe(null);
        expect(storage.expires('foobar')).toBeTruthy();
      });
    });
  });

  describe('pexpire', function () {
    it('expires a key with based on a supplied millisecond delay', function () {
      runs(function () {
        storage.setItem('foo', 'bar');
        storage.pexpire('foo', 5);
      });

      waits(7);
      runs(function () {
        expect(storage.get('foo')).toBeFalsy();
      });
    });
  });

  describe('expires', function () {
    it('returns 1 when the key has expiry data', function () {
      storage.setItem('foo', 'bar');
      storage.pexpire('foo', 10);
      expect(storage.expires('foo')).toBe(1);
    });

    it('returns 0 when the key has no expiry data', function () {
      storage.setItem('foo', 'bar');
      expect(storage.expires('foo')).toBe(0);
    });

    it('returns 0 for a non existent key', function () {
      expect(storage.expires('foo')).toBe(0);
    });
  });

  describe('persist', function () {
    it('cancels an existing expiration for the key', function () {
      storage.setItem('foo', 'bar');
      storage.expire('foo', 10 / 1000);
      storage.persist('foo');
      expect(storage.expires('foo')).toBeFalsy();
    });

    it('returns 0 if the key does not exist', function () {
      expect(storage.persist('foo')).toBe(0);
    });

    it('returns 0 if the key does not have an expiration', function () {
      storage.setItem('foo', 'bar');
      expect(storage.persist('foo')).toBe(0);
    });

    it('returns 1 if an existing expiration was removed', function () {
      storage.setItem('foo', 'bar');
      storage.expire('foo', 5 / 1000);
      expect(storage.persist('foo')).toBe(1);
      expect(storage.expires('foo')).toBeFalsy();
    });
  });

  describe('ttl', function () {
    it('returns the time to live for a key\'s expiration', function () {
      runs(function () {
        storage.setItem('foobar', 'bar');
        storage.pexpire('foobar', 15);
      });

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
      storage.setItem('foo', 'bar');
      expect(storage.ttl('foo')).toBe(-1);
    });
  });

  describe('pttl', function () {
    it('returns the time to live for a key\'s expiration', function () {
      runs(function () {
        storage.setItem('foo', 'bar');
        storage.pexpire('foo', 15);
      });

      waits(10);
      runs(function () {
        var ttl = storage.ttl('foo');
        expect(ttl).toBeGreaterThan(0);
      });
    });
  })

  describe('randomkey', function () {
    it('returns a random key within the storage object', function () {
      storage.setItem('foo', 'bar');
      storage.setItem('bar', 'foo');
      storage.setItem('foobar', 'foobar');

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
        storage.setItem('foo' + i, 'bar');
        counts[i] = 0;
      }

      var keys  = storage.keys('foo*'),
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
          keys = [],
          containsKey;

      // Store 10 misc key/value pairs
      for (i = 0; i < numKeys; i++) {
        keys[i] = 'foo' + i;
        storage.setItem(keys[i], 'bar');
      }

      results = storage.keys(pattern);

      // Expect all of the keys in the results set
      for (i = 0, l = keys.length; i < l; i++) {
        containsKey = results.indexOf(keys[i]) > -1;
        expect(containsKey).toBeTruthy();
      }
    });

    it('returns null if no keys match pattern', function () {
      expect(storage.keys()).toEqual(null);
    });
  });

  describe('expireat', function () {
    it('expires a key at the specified second-based UNIX timestamp', function () {
      var nowSeconds  = new Date().getTime() / 1000,
          timestamp   = nowSeconds + 1;

      storage.setItem('foo', 'bar');
      storage.expireat('foo', timestamp);

      expect(storage.expires('foo')).toBeTruthy();
      expect(storage.ttl('foo')).toBeGreaterThan(0);
      storage.persist('foo');
    });

    it('throws if given an old timestamp', function () {
      var nowSeconds  = new Date().getTime() / 1000,
          timestamp   = nowSeconds - 1;

      storage.setItem('foo', 'bar');
      expect(function () { storage.expireat('foo', timestamp); }).toThrow();
      storage.persist('foo');
    });
  });

  describe('pexpireat', function () {
    it('expires a key at the specified millisecond-based UNIX timestamp', function () {
      var nowms     = new Date().getTime(),
          timestamp = nowms + 10;

      storage.setItem('foo', 'bar');
      storage.pexpireat('foo', timestamp);

      expect(storage.expires('foo')).toBeTruthy();
      expect(storage.ttl('foo')).toBeGreaterThan(0);
    });

    it('throws if given an old timestamp', function () {
      var nowms       = new Date().getTime(),
          timestamp   = nowms - 10;

      storage.setItem('foo', 'bar');
      expect(function () { storage.pexpireat('foo', timestamp); }).toThrow();
    });
  });

});