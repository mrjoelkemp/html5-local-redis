describe('LocalRedis Lib Spec', function () {
  describe('Expiration', function () {
    describe('createExpirationKey', function () {
      it('returns an expiration key', function () {
        // We don't care what the format is, just that it returns a string
        var expKey = exp.createExpirationKey('foo', storage);
        expect(typeof expKey).toBe('string');
      });
    });

    describe('createExpirationValue', function () {
      it('returns a stringified object consisting of expiration data', function () {
        var expVal = exp.createExpirationValue(100, 100, storage);
        expect(typeof expVal).toBe('string');
        expect(typeof JSON.parse(expVal)).toBe('object');
      });
    });

    describe('setExpirationOf', function () {
      it('stores expiration data for a given key', function () {
        storage.setItem('foo', 'bar');
        exp.setExpirationOf('foo', 1, 100, storage);
        // Depends on _createExpirationKey, but that tests first
        var expKey = exp.createExpirationKey('foo');
        expect(storage.getItem(expKey)).not.toBe(null);
      });
    });

    describe('getExpirationValue', function () {
      it('returns an object representation of expiry data for a storage key', function () {
        storage.setItem('foo', 'bar');
        exp.setExpirationOf('foo', 1, 100, storage);
        expect(typeof exp.getExpirationValue('foo', storage)).toBe('object');
      });
    });

    describe('getExpirationID', function() {
      it('should return the timeout id of a given key\'s expiration', function () {
        storage.setItem('foo', 'bar');
        // Set a timeout id of 1
        exp.setExpirationOf('foo', 1, 100, storage);
        expect(exp.getExpirationID('foo', storage)).toBe(1);
      });

      it('should return null if there is no expiration data for the key', function () {
        storage.setItem('foo', 'bar');
        expect(exp.getExpirationID('foo', storage)).toBe(null);
      });
    });

    describe('getExpirationDelay', function() {
      it('should return the timeout delay of a given key\'s expiration', function () {
        storage.setItem('foo', 'bar');
        // Set a timeout id of 1
        exp.setExpirationOf('foo', 1, 100, storage);
        expect(exp.getExpirationDelay('foo', storage)).toBe(100);
      });

      it('should return null if there is no expiration data for the key', function () {
        storage.setItem('foo', 'bar');
        expect(exp.getExpirationDelay('foo', storage)).toBe(null);
      });
    });

    describe('removeExpirationOf', function () {
      it('removes the expiration data for the passed storage key', function () {
        var expKey = exp.createExpirationKey('foo', storage);
        storage.setItem('foo', 'bar');
        exp.setExpirationOf('foo', 1, 100, storage);
        exp.removeExpirationOf('foo', storage);
        expect(storage.getItem(expKey)).toBe(null);
      });
    });

    describe('hasExpiration', function () {
      it('returns true when expiration data exists for the key', function () {
        storage.setItem('foo', 'bar');
        exp.setExpirationOf('foo', 1, 100, storage);
        expect(exp.hasExpiration('foo', storage)).toBeTruthy();
      });

      it('returns false when expiration data does not exist for the key', function () {
        expect(exp.hasExpiration('foo', storage)).toBeFalsy();
      });
    });
  });
});