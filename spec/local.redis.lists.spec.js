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

  describe('rpush', function () {
    it('adds the value to the front of the key\'s list', function () {
      storage.set('foo', [1, 2]);
      storage.rpush('foo', 3);
      expect(storage.get('foo')).toEqual([1, 2, 3]);
    });

    it('adds the values to the back of the list', function () {
      storage.set('foo', [1, 2]);
      storage.rpush('foo', 3, 4);
      expect(storage.get('foo')).toEqual([1, 2, 3, 4]);
    });

    it('adds the values passed as an array', function () {
      storage.set('foo', [1, 2]);
      storage.rpush('foo', [3, 4]);
      expect(storage.get('foo')).toEqual([1, 2, 3, 4]);
    });
  });

  describe('rpushx', function () {
    it('inserts the values when the key exists and has a list value', function () {
      storage.set('foo', [1, 2]);
      expect(storage.rpushx('foo', 3)).toBe(3);
      expect(storage.get('foo')).toEqual([1, 2, 3]);
    });

    it('returns 0 if the key does not exist', function () {
      expect(storage.rpushx('foo', 3)).toBe(0);
    });

    it('returns 0 if the key does not have a list value', function () {
      storage.set('foo', 'bar');
      expect(storage.rpushx('foo', 2)).toBe(0);
    });
  });

  describe('llen', function () {
    it('returns the length of the list stored at key', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.llen('foo')).toBe(3);
    });

    it('returns 0 if the key doesn\'t exist', function () {
      expect(storage.llen('foo')).toBe(0);
    });

    it('throws if the value at key is not a list', function () {
      storage.set('foo', 'bar');
      expect(function () { storage.llen('foo'); }).toThrow();
    });
  });

  describe('lrange', function () {
    it('returns a list of elements up to an including start and stop', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.lrange('foo', 0, 1)).toEqual([1, 2]);
      expect(storage.lrange('foo', 0, -2)).toEqual([1, 2]);
    });

    it('returns a list of elements from negative start and stop indices', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.lrange('foo', -3, -1)).toEqual([1, 2, 3]);
    });

    it('returns an empty array if the start is greater than the end of the list', function () {
      storage.set('foo', [1, 2, 3])
      expect(storage.lrange('foo', 5, 3)).toEqual([]);
    });

    it('returns the entire list with a start of 0 and stop of -1', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.lrange('foo', 0, -1)).toEqual([1, 2, 3]);
    });

    it('makes stop the end of the list if it exceeds the end', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.lrange('foo', 0, 3)).toEqual([1, 2, 3]);
    });
  });

  describe('lrem', function () {
    it('removes count occurences of value from the head of key\'s list when count is positive', function () {
      storage.set('foo', [1, 1, 2, 1]);
      // Remove 2 occurrence of 1 from the start
      storage.lrem('foo', 2, 1);

      expect(storage.get('foo')).toEqual([2, 1]);
    });

    it('removes count occurrences of value from the tail of key\'s list when count is negative', function () {
      storage.set('foo', [1, 1, 2, 1]);
      // Remove 1 occurrence of 1 from the end
      storage.lrem('foo', -1, 1);

      expect(storage.get('foo')).toEqual([1, 1, 2]);
    });

    it('removes all occurrences of value when count is zero', function () {
      storage.set('foo', [1, 1, 2, 1]);
      // Remove 2 occurrence of 1 from the start
      storage.lrem('foo', 0, 1);

      expect(storage.get('foo')).toEqual([2]);
    });

    it('returns the number of removed occurrences', function () {
      storage.set('foo', [1, 1, 2, 1]);
      // Remove 2 occurrence of 1 from the start
      expect(storage.lrem('foo', 0, 1)).toBe(3);
    });

    it('returns 0 if the key does not exist', function () {
      expect(storage.lrem('foo', 0, 1)).toBe(0);
    });
  });

  describe('lpop', function () {
    it('removes and returns the first element of the list stored at key', function () {
      storage.set('foo', [1, 2, 3]);
      expect(storage.lpop('foo')).toBe(1);
      expect(storage.get('foo')).toEqual([2, 3]);
    });

    it('returns null when the key does not exist', function () {
      expect(storage.lpop('foo')).toBe(null);
    });
  });
});