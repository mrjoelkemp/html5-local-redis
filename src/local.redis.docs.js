(function (window) {

  // [HTML5 Local Redis](https://github.com/mrjoelkemp/html5-local-redis)

  // Redis-like API for HTML5 Local Storage

  // Created by:
  // [Joel Kemp](https://twitter.com/mrjoelkemp) and
  // [Eudis Duran](https://twitter.com/eudisduran)

  // License: MIT.
  // ***

  // ## Notes ##

  // #### Polyfill for IE8
  // Since IE8 does not support HTML5 Local Storage, a cookie-based
  // polyfill is supplied to facilitate the basic web storage API.

  // #### Datatype support ####

  // Local Redis can handle non-string input to the commands.
  // Hence, it is possible to store and retrieve objects, arrays,
  // numbers, and literal strings.
  // This is achieved internally via JSON stringify and parse.

  // ***
  // ## Keys API ##
  // ***

  /*******************************************************/

  // ### del ###
  // *Usage:* `del(key)` or `del(key1, key2)` or `del([key1, key2])`

  // Removes the specified key(s).
  // *Returns* the number of keys removed.

  localRedis.del('foo');
  localRedis.del('foo', 'bar');
  localRedis.del(['foo', 'bar']);

  // *Side effects:*
  // Clears existing expirations on keys, if set.




  // ### exists ###
  // *Usage:* `exists(key)`

  // Determines whether or not the passed key exists in storage.
  // *Returns* `1` if the key exists, `0` otherwise.

  localRedis.exists({foo: 'bar'});
  localRedis.exists('foo');
  localRedis.exists(1234);

  // *Throws* if more than one argument is supplied.




  // ## rename ##
  // *Usage:* `rename(key, newkey)`

  // Renames `key` to `newkey`, transferring the value associated
  // with `key` to `newkey`.

  localRedis.rename('foo', 'bar');

  // *Side effects:* Transfers the `key`'s time-to-live (TTL)
  // (i.e., time until expiration) to `newkey`.

  // *Throws* if `key == newkey` or `key` does not exist.



  // ## renamenx ##
  // *Usage:* `rename(key, newkey)`

  // Renames `key` to `newkey` *iff* `newkey` does not exist.
  // *Returns* `1` if `key` was renamed, `0` otherwise.

  localRedis.renamenx('foo', 'foobar');

  // *Side effects:* Same as `rename`.

  // *Throws* under the same conditions as `rename`.




  // ***
  // ## Strings API ##
  // ***

})(window);