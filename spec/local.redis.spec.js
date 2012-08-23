describe('suite', function () {
  // Use sessionStorage for temporarily storing dummy data and not tainting existing localStorage data
  // Also allows us to avoid worrying about cleanup
  var storage = window.sessionStorage;

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

      // it should return an exception if the storage exceeds capacity (hard to replicate)
    });

    describe('get', function () {
      it('should retrieve a value for a key that exists', function () {
        var k = 'foo'
          , v = 'bar';
        // Set the data – uses the safer setItem to avoid dependency on untested set().
        storage.setItem(k, v);

        expect(storage.get(k)).toBe(v);
      });

      // it should return a string if the value is a string literal (alphabetical)

      // it should return an object for a string value that contains an object

      // it should return a number for a string value that contains a number

    });

  });

});