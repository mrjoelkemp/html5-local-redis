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

    });

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

      // it should return a number for a string value that contains a number

      it('should accept an object as a key', function () {
        var k = {"name": "Yogi Bear"}
          , v = 2
          , val;

        storage.setItem(stringify(k), v);

        val = storage.get(k);

        // Get auto parses, so we don't need v.toString()
        expect(val).toBe(v);
      });
    });

  });

});