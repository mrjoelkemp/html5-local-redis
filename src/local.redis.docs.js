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

// #### Argument assertions ####

// The commands will throw an error if they are given an
// incorrect number of arguments. Note the *usage* section
// of each command to see the accepted number of arguments.

// ***
// ## Keys API ##
// ***

// ## del ##
// *Usage:* `del(key)` or `del(key1, key2)` or `del([key1, key2])`

// Removes the specified key(s).
// *Returns* the number of keys removed.

localRedis.del('foo');
localRedis.del('foo', 'bar');
localRedis.del(['foo', 'bar']);

// *Side effects:*
// Clears existing expirations on keys, if set.




// ## exists ##
// *Usage:* `exists(key)`

// Determines whether or not the passed key exists in storage.
// *Returns* `1` if the key exists, `0` otherwise.

localRedis.exists({foo: 'bar'});
localRedis.exists('foo');
localRedis.exists(1234);




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



// ## getkey ##
// *Usage:* `getkey(value)` or `getkey(value, true)`

// Retrieves the first *key* associated with `value`,
// or all keys associated with value if `true` is
// passed as the second parameter.
// *Returns* a single key or a list of keys if second parameter
// is set to `true`.

/* Assume 'foo' => 'bar' */
localRedis.getkey('bar'); // Returns 'foo'

// Note: This is a *custom*, non-Redis function.



// ## expire ##
// *Usage:* `expire(key, secondDelay)`

// Expires `key` after the supplied *number of seconds*.
// *Returns* `1` if the expiration was set, `0` if the
// `key` does not exist or the expiration couldn't be set.

localRedis.expire('foo', 2);
localRedis.expire('bar', 1.5);


// [Read more](http://mrjoelkemp.com/2012/09/html5-local-storage-keyvalue-expiry/) about the expiration algorithm.



// ## pexpire ##
// *Usage:* `pexpire(key, msDelay)`

// Expires `key` in the supplied number of milliseconds.
// Similar to `expire` except for the delay's units.
// *Returns* the same as `expire`.

localRedis.pexpire('foo', 500);
localRedis.pexpire('bar', 10);




// ## expires ##
// *Usage:* `expires(key)`

// Determines whether or not `key` has expiration data
// in the datastore.
// *Returns* `1` if there is expiration data for `key`,
// `0` otherwise.

localRedis.expires('foo'); // Returns 1

// Note: This is a *custom*, non-Redis function.




// ## expireat ##
// *Usage:* `expireat(key, secondsTimestamp)`

// Expires a key at the supplied, second-based UNIX timestamp.
// This is useful for expiring the key at a particular date.
// *Returns* `1` if the expiration was set, `0` if the key
// does not exist or the expiration couldn't be set.

localRedis.expireat('foo', 1293840000);




// ## pexpireat ##
// *Usage:* `pexpireat(key, msTimestamp)`

// Similar to `expireat` except that the timestamp is in
// milliseconds.
// *Returns* the same as `expireat`.

localRedis.pexpireat('foo', 1348190381093280);




// ## persist ##
// *Usage:* `persist(key)`

// Removes the `key`'s expiration.
// *Returns* `1` if the expiration was removed/cancelled,
// `0` if `key` does not exist or `key` does not have an
// existing expiration.

localRedis.persist('foo');



// ## ttl ##




// ## pttl ##




// ## randomkey ##





// ## keys ##






// ***
// ## Strings API ##
// ***

// ## get ##
// ## set ##
// ## getset ##
// ## mget ##
// ## mset ##
// ## setnx ##
// ## msetnx ##

// ## incr ##
// ## incrby ##
// ## mincr ##
// ## mincrby ##
// ## decr ##
// ## decrby ##
// ## mdecr ##
// ## mdecrby ##

// ## append ##
// ## strlen ##

// ## setex ##
// ## psetex ##
