// [HTML5 Local Redis](https://github.com/mrjoelkemp/html5-local-redis)

// Redis-like API for HTML5 Local Storage

// Created by:
// [Joel Kemp](https://twitter.com/mrjoelkemp) and
// [Eudis Duran](https://twitter.com/eudisduran)

// License: MIT.
// ***

// ## Notes ##

// #### Polyfill for IE8
// Since IE8 does not support HTML5 Local Storage, a [cookie-based
// polyfill](https://developer.mozilla.org/en-US/docs/DOM/Storage) is supplied to facilitate the basic web storage API.

// #### Datatype support ####

// Local Redis can handle non-string input to the commands.
// Hence, it is possible to store and retrieve objects, arrays,
// numbers, and literal strings.
// This is achieved internally via JSON stringify and parse.

localRedis.set('foo', 'bar');
localRedis.set(4, 'bar');
localRedis.set({username: "Joel Kemp"}, {post: "Hello"});
localRedis.set(['foo', 3, {username: "Joel Kemp"}], [1, 2, 3]);
localRedis.set(null, null);


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

localRedis.set('foo', 'bar');
localRedis.set('bar', 'foobar');
localRedis.del('foo', 'bar');   // Returns 2

// *Side effects:*
// Clears existing expirations on keys, if set.




// ## exists ##
// *Usage:* `exists(key)`

// Determines whether or not the passed key exists in storage.
// *Returns* `1` if the key exists, `0` otherwise.

localRedis.set({foo: 'bar'}, 'bar');
localRedis.exists({foo: 'bar'});    // Returns 1
localRedis.exists('foo');           // Returns 0
localRedis.exists(1234);            // Returns 0




// ## rename ##
// *Usage:* `rename(key, newkey)`

// Renames `key` to `newkey`, transferring the value associated
// with `key` to `newkey`.


// *Side effects:* Transfers the `key`'s time-to-live (TTL)
// (i.e., time until expiration) to `newkey`.

localRedis.set('foo', 'foobar');
localRedis.expire('foo', 2);
localRedis.rename('foo', 'bar');
localRedis.get('bar');            // Returns 'foobar'
localRedis.get('foo');            // Returns null
localRedis.expires('bar');        // Returns 1

// *Throws* if `key == newkey` or `key` does not exist.



// ## renamenx ##
// *Usage:* `rename(key, newkey)`

// Renames `key` to `newkey` *iff* `newkey` does not exist.
// *Returns* `1` if `key` was renamed, `0` otherwise.

localRedis.set('foo', 'bar');
localRedis.renamenx('foo', 'foobar'); // Returns 1
localRedis.get('foobar');             // Returns 'bar'

// *Side effects:* Same as `rename` in regards to key expiry.

// *Throws* under the same conditions as `rename`.



// ## getkey ##
// *Usage:* `getkey(value)` or `getkey(value, true)`

// Retrieves the first *key* associated with `value`,
// or all keys associated with value if `true` is
// passed as the second parameter.
// *Returns* a single key or a list of keys if second parameter
// is set to `true`.

localRedis.set('foo', 'bar');
localRedis.set('bar', 'bar');
localRedis.getkey('bar');       // Returns 'foo'
localRedis.getkey('bar', true); // Returns ['foo', 'bar']

// Note: This is a *custom*, non-Redis function.



// ## expire ##
// *Usage:* `expire(key, secondDelay)`

// Expires `key` after the supplied *number of seconds*.
// *Returns* `1` if the expiration was set, `0` if the
// `key` does not exist or the expiration couldn't be set.

localRedis.set('foo', 'bar');
localRedis.expire('foo', 2);    // Returns 1
localRedis.expire('bar', 1.5);  // Returns 0

// [Read more](http://mrjoelkemp.com/2012/09/html5-local-storage-keyvalue-expiry/) about the expiration algorithm.




// ## pexpire ##
// *Usage:* `pexpire(key, msDelay)`

// Expires `key` in the supplied number of milliseconds.
// Similar to `expire` except for the delay's units.
// *Returns* the same as `expire`.

localRedis.set('foo', 'bar');
localRedis.set('bar', 'bar');
localRedis.pexpire('foo', 500); // Returns 1
localRedis.pexpire('bar', 10);  // Returns 1




// ## expires ##
// *Usage:* `expires(key)`

// Determines whether or not `key` has expiration data
// in the datastore.
// *Returns* `1` if there is expiration data for `key`,
// `0` otherwise.

localRedis.set('foo', 'bar');
localRedis.expire('foo', 2);
localRedis.expires('foo');   // Returns 1

// Note: This is a *custom*, non-Redis function.




// ## expireat ##
// *Usage:* `expireat(key, secondsTimestamp)`

// Expires a key at the supplied, second-based UNIX timestamp.
// This is useful for expiring the key at a particular date.
// *Returns* `1` if the expiration was set, `0` if the key
// does not exist or the expiration couldn't be set.

localRedis.set('foo', 'bar');
localRedis.expireat('foo', 1348517858.724); // Returns 1

// *Throws* if the timestamp has already passed.



// ## pexpireat ##
// *Usage:* `pexpireat(key, msTimestamp)`

// Similar to `expireat` except that the timestamp is in
// milliseconds.
// *Returns* the same as `expireat`.

localRedis.set('foo', 'bar');
localRedis.pexpireat('foo', 1348517858724); // Returns 1
localRedis.pexpireat('foobar');             // Returns 0

// *Throws* if the timestamp has already passed.




// ## persist ##
// *Usage:* `persist(key)`

// Removes the `key`'s expiration.
// *Returns* `1` if the expiration was removed/cancelled,
// `0` if `key` does not exist or `key` does not have an
// existing expiration.

localRedis.set('foo', 'bar');
localRedis.expire('foo', 2);
localRedis.persist('foo');    // Returns 1
localRedis.persist('foobar'); // Returns 0



// ## ttl ##
// *Usage:* `ttl(key)`

// Returns the time-to-live (in seconds) of a key, or `-1`
// if the key does not have an expiration.

localRedis.set('foo', 'bar');
localRedis.expire('foo', 2);
localRedis.ttl('foo');        // Returns 2
localRedis.ttl('foobar');     // Returns -1



// ## pttl ##
// *Usage:* `pttl(key)`

// Similar to `ttl` but returns the time-to-live of `key` in milliseconds,
// or `-1` if the key does not exist or have an expiration.

localRedis.set('foo', 'bar');
localRedis.expire('foo', 2);
localRedis.pttl('foo');        // Returns a few ms less than 2000
localRedis.pttl('foobar');     // Returns -1



// ## randomkey ##
// *Usage:* `randomkey()`

// Returns a random key from storage or `null` when the datastore is empty.

localRedis.randomkey();     // Returns null

localRedis.set('foo', 'bar');
localRedis.set('bar', 'foobar');
localRedis.set('car', 'foo');

localRedis.randomkey();     // Returns one of the keys




// ## keys ##
// *Usage:* `keys(pattern)`

// Finds all keys that match the (regular expression) pattern.
// *Returns* a list of keys or a single key that matches `pattern`
// or `null` if no keys were found to match `pattern`.

localRedis.set('foo', 'bar');
localRedis.set('bar', 'bar');
localRedis.set('car', 'bar');

localRedis.keys('ar');    // Returns ['bar', 'car']
localRedis.keys('fo*');   // Returns 'foo'






// ***
// ## Strings API ##
// ***

// ## get ##

// ## set ##
// *Usage:* `set(key, value)` or `set(key, value).set(key, value)`
// Chainable

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
