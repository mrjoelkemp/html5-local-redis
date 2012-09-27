describe('Lists API', function () {
  describe('lpush', function () {
    it('adds the value to the front of the key\'s list', function () {
      storage.set('foo', [1, 2]);
      storage.lpush('foo', 3);
      expect(storage.get('foo')).toEqual([3, 1, 2]);
    });

    it('adds the values to the front of the list in LIFO order', function () {
      storage.set('foo', [1, 2]);
      storage.lpush('foo', 3, 4);
      expect(storage.get('foo')).toEqual([4, 3, 1, 2]);
    });

    it('adds the values passed as an array to the front of the list in LIFO order', function () {
      storage.set('foo', [1, 2]);
      storage.lpush('foo', [3, 4]);
      expect(storage.get('foo')).toEqual([4, 3, 1, 2]);
    });

    it('returns the length of the post-push list value', function () {
      storage.set('foo', [1, 2]);
      expect(storage.lpush('foo', 3, 4)).toBe(4);
    });

    it('creates and pushes to an empty list if the key does not exist', function () {
      expect(storage.lpush('foo', 1, 2)).toEqual(2);
      expect(storage.get('foo')).toEqual([2, 1]);
    });

    it('throws if the existing value is not a list', function () {
      storage.set('foo', 'bar');
      expect(function () { storage.lpush('foo', 2)}).toThrow();
    });

    it('throws for anything less than two args', function () {
      expect(function () { storage.lpush('foo')}).toThrow();
    });
  });

  describe('lpushx', function () {
    it('inserts the values when the key exists and has a list value', function () {
      storage.set('foo', [1, 2]);
      expect(storage.lpushx('foo', 3)).toBe(3);
      expect(storage.get('foo')).toEqual([3, 1, 2]);
    });

    it('returns 0 if the key does not exist', function () {
      expect(storage.lpushx('foo', 3)).toBe(0);
    });

    it('returns 0 if the key does not have a list value', function () {
      storage.set('foo', 'bar');
      expect(storage.lpushx('foo', 3)).toBe(0);
    });
  });

});