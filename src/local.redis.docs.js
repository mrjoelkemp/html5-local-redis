(function (window) {

  // **Keys API**
  // ***

  // **del:**
  // Removes the specified key(s).
  // *Returns* the number of keys removed.

  // *Side effects:*
  // Clears existing expirations on keys, if set.

  // *Usage:*
  // `del(key)` or `del(key1, key2)` or `del([key1, key2])`
  localRedis.del('foo');
  localRedis.del('foo', 'bar');
  localRedis.del(['foo', 'bar']);

})(window);