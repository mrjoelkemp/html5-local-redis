describe('suite', function () {
  var storage = window.localStorage;

  describe('commands', function() {

    // Dummy data
    // Need to use this or we have to manually remove the items and can't leverage afterEach()
    var keysVals = ['first', 'Bob', 'last', 'Saget', 'age', 94, 'person', {"name": "Yogi Bear"}, 'pi', 3.14];

    // Remove dummy data from the local store.
    afterEach(function() {
      // Iterate over the keys
      for (var i = 0, l = keysVals.length; i < l; i += 2) {
        storage.removeItem(keysVals[i]);
      }
    });

    describe('set', function () {
      it('should store the value indexed by the key', function () {
        // Attempt to store
        storage.set(keysVals[0], keysVals[1]);

        // Retrieve the value and make sure it's equal to the stored value
        // Uses getItem to avoid the dependency on the untested get()
        var val = storage.getItem(keysVals[0]);
        expect(val).toBe(keysVals[1]);
      });

      // it should return an exception if the storage exceeds capacity (hard to replicate)
    });

    describe('get', function () {
      it('should retrieve a value for a key that exists', function () {
        // Set the data – uses the safer setItem to avoid dependency on untested set().
        storage.setItem(keysVals[0], keysVals[1]);

        expect(storage.get(keysVals[0])).toBe(keysVals[1]);
      });

      // it should return an object for a string value that contains an object

      // it should return a number for a string value that contains a number

    });

  });

});