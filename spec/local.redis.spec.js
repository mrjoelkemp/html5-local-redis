describe('suite', function () {
  // Use sessionStorage for temporarily storing dummy data and not tainting existing localStorage data
  // Also allows us to avoid worrying about cleanup
  var storage   = window.sessionStorage
    , stringify = JSON.stringify;

  describe('commands', function () {

    describe('set', function () {
      it('should store a value indexed by its key', function () {
        var k = 'foo'
          , v = 'bar';

        // Attempt to store
        storage.set(k, v);

        // Retrieve the value and make sure it's equal to the stored value
        // Uses getItem to avoid the dependency on the untested get()
        var val = storage.getItem(k);
        expect(val).toBe(v);
      });

      it('should auto stringify an object being stored as a value', function () {
        var k = 'foo'
          , v = {"name": "Yogi Bear"}
          , type;

        storage.set(k, v);

        // Check that the value stored is a string
        type = typeof storage.getItem(k);
        expect(type).toBe('string');
      });

      it('should accept objects as keys', function () {
        var k = {"name": "Yogi Bear"}
          , v = 2
          , val;

        storage.set(k, v);

        val = storage.getItem(stringify(k));
        // getItem() returns string values
        expect(val).toBe(v.toString());
      });

    }); // end set

    describe('get', function () {
      it('should retrieve a value for a key that exists', function () {
        var k = 'foo'
          , v = 2;

        // Set the data – uses the safer setItem to avoid dependency on untested set().
        storage.setItem(k, v);
        expect(storage.get(k)).toBe(v);
      });

      it('should return a string if the value is a string literal (alphabetical)', function () {
        var k = 'foo'
          , v = 'Yogi Bear';

        storage.setItem(k, v);
        expect(storage.get(k)).toBe(v);
      });

      it('should return an object for a string value that contains an object', function () {
        var k = 'foo'
          , v = {"name": "Yogi Bear"};

        storage.setItem(k, stringify(v));
        expect(storage.get(k)).toEqual(v);
      });

      it('should return a number for a string value that contains a number', function () {
        var k = 'foo'
          , v = 2
          , val;

        storage.setItem(k, v);

        val = storage.get(k);

        expect(val).toBe(v);
      });

      it('should accept an object as a key', function () {
        var k = {"name": "Yogi Bear"}
          , v = 2
          , val;

        storage.setItem(stringify(k), v);

        val = storage.get(k);

        // Get auto parses, so we don't need v.toString()
        expect(val).toBe(v);
      });
    }); // end get

    describe('mget', function () {
      it('should retrieve the values for multiple keys', function () {
        var keysVals  = ['first', 'Joel', 'last', 'Kemp']
          , results   = []
          , expectVals= [keysVals[1], keysVals[3]];

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
      it('should store multiple key-value pairs', function () {
        var keysVals  = ['first', 'Joel', 'last', 'Kemp']
          , results   = []
          , expectVals= [keysVals[1], keysVals[3]];

        // Test the mset('k1', 'v1', 'k2', 'v2') syntax
        //storage.mset(keysVals[0], keysVals[1], keysVals[2], keysVals[3]);
        //expect.
        // Test the mset(['k1', v1, 'k2', 'v2']) list syntax

        // Test the mset({'k1': 'v1', 'k2': 'v2'}) object syntax
      });
    }); // end mset
  }); // end commands

});