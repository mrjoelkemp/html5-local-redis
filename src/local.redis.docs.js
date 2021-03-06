// [HTML5 Local Redis](https://github.com/mrjoelkemp/html5-local-redis)

// Redis-like API for HTML5 Local Storage

// Created by:
// [Joel Kemp](https://twitter.com/mrjoelkemp) and
// [Eudis Duran](https://twitter.com/eudisduran)

// License: MIT.
// ***

// ## Downloads ##

// [Download .zip](https://github.com/mrjoelkemp/html5-local-redis/zipball/master) |
// [Download .tar.gz](https://github.com/mrjoelkemp/html5-local-redis/tarball/master)

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

// #### Event Firing on Storage Update

// The library emits a `storagechange` (cross-browser) event that's attached to the
// `document` object everytime a set/remove/clear like command is invoked.
// HTML5 Local Storage *has* a (not completely implemented in all browsers)
// 'storage' event that gets fired, however, it only gets fired for other
// tabs/windows that are pointed to the same domain.

// If you want to visualize the changes being made to the datastore, you
// can listen for the fired event and act appropriately.

// If your project utilizes jQuery, then the library will use jQuery's
// event-firing functionality. Otherwise, we fire events via the
// (IE-specific) `fireEvent` and (Other browsers) `dispatchEvent` methods.

// ***
// ## Local Storage API ##
// ***

// `localRedis` supports the W3C Web Storage API.

localRedis.setItem('foo', 'bar');
localRedis.getItem('foo');
localRedis.key(0);
localRedis.clear();
localRedis.removeItem('foo');

// Note: Key stringifying and parsing are **not** done on the above methods.
// Please use `get` and `set` commands to utilize more key and value datatypes.

// These functions also emit the storage events.


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
// *Usage:* `get(key)`

// Retrieves the value associated with `key`.
// *Returns* the (JSON parsed) value or `null` if the key does not exist.

localRedis.set('foo', 'bar');
localRedis.set('id', 404);

localRedis.get('foo');    // Returns 'bar'
localRedis.get('id');     // Returns 404

// *Note:* If the key is set with the value of null, then `get` could be misleading.
// In this case, you should probably very that the key exists by using `exists`.

localRedis.set('foo', null);
localRedis.get('foo');        // Returns null which looks like 'foo' does not exist
localRedis.exists('foo');     // Returns 1; hence, 'foo' does exist but has a null value



// ## set ##
// *Usage:* `set(key, value)` or `set(key, value).set(key, value)`

// Stores the `key`/`value` pair in localStorage.
// *Returns* the calling `localRedis` object so that you can chain
// commands.

localRedis.set('foo', 'bar');
localRedis.set(4, 232);
localRedis.set({foo: 'name'}, 'bar').set('foobar', 'bar');
localRedis.set('bar', [1, 2, 3, 4, 5]);

// Note: This method deviates from the status `'OK'` return value
// for Redis commands since `set` operations will always succeed unless
// the browser crashes.

// *Side effects:* Resets/refreshes `key`'s existing expiration.

// *Throws* if the set exceeds the quota for localStorage
// (i.e., throws if localStorage is full).



// ## getset ##
// *Usage:* `getset(key, value)`

// Sets the `key`/`value` pair and returns the *old value* stored `key`.
// *Returns* the old value stored at `key` or `null if `key` does not exist.

localRedis.set('foo', 'bar');
localRedis.getset('foo', 'foobar'); // Returns 'bar'
localRedis.get('foo');              // Returns 'foobar'

// *Side effects:* Resets/refreshes `key`'s existing expiration.



// ## mget ##
// *Usage:* `mget(key1, key2, ...)` or `mget([key1, key2, ...])`

// Retrieves the value for each passed key.
// *Returns* a list of values where the index of each value in the list
// corresponds to the index of the key in the parameter list or array.

localRedis.set('foo', 'bar');
localRedis.set('bar', 'foobar');
localRedis.mget('foo', 'bar');    // Returns ['bar', 'foobar']




// ## mset ##
// *Usage*: `mset(key1, val1, key2, val2, ...)` or
//          `mset([key1, val1, key2, val2, ...])` or
//          `mset({key1: val1, key2: val2, ...})`

// Sets up multiple `key`/`value` pairs.
// *Returns* the calling `localRedis` object so that you can chain
// commands.

localRedis.mset('foo', 'bar', 'bar', 'foobar');
localRedis.mget('foo', 'bar');  // Returns ['bar', 'foobar']

// Note: a missing value will get the value `undefined`.
// This is also a *chainable* command.

// *Side effects*: **None**. Unlike `set`, `mset` won't effect the expiry of the keys.
// This is according to [Redis' expire spec](http://redis.io/commands/expire).




// ## setnx ##
// *Usage:* `setnx(key, value)`

// Sets up the `key`/`value` pair if `key` **does not exist**.
// *Returns* `1` if the key was set, `0` if the key already exists.

localRedis.setnx('foo', 'bar');     // Returns 1
localRedis.setnx('foo', 'foobar');  // Returns 0
localRedis.get('foo');              // Returns 'bar'

// *Side effects*: **None**, since the key shouldn't exist, and hence, wouldn't
// have an expiration.




// ## msetnx ##
// *Usage*: `msetnx(key1, val1, key2, val2, ...)` or
//          `msetnx([key1, val1, key2, val2, ...])` or
//          `msetnx({key1: val1, key2: val2, ...})`

// Sets up the `key`/`value` pairs if *all* of the keys **do not exist**.
// *Returns* `1` if all of the keys were set, `0` if at least one key already existed.

localRedis.msetnx('foo', 'bar', 'bar', 'foobar'); // Returns 1
localRedis.msetnx('foo', 'foobar');               // Returns 0




// ## incr ##
// *Usage:* `incr(key)`

// Increments the key by 1 or sets it to 1 if the key does not exist.

localRedis.incr('hits');
localRedis.get('hits');     // Returns 1

// *Throws* if the *value* of `key` meets **any** of the following conditions:

// * Not an integer or stringified integer (ex: 4 or '4')
// * The key exists but was set with a value of `null`
// * An increment of the value exceeds the maximum number size for JavaScript.

// *Side effects:* **None**. `incr` does not effect key expiry.

// Note: If `key` does not exist, it is given a value of `1`.



// ## incrby ##
// *Usage:* `incrby(key, amount)`

// Increments the key by amount or sets the key to amount if it doesn't exist.

localRedis.incrby('foo', 4);
localRedis.get('foo');        // Returns 4

// *Throws* if the *value* of `key` or `amount` meet **any** of the following conditions:

// * Not an integer or stringified integer (ex: 4 or '4')
// * The key exists but was set with a value of `null`

// *Side effects:* **None**. `incrby` does not effect key expiry.

// Note: If `key` does not exist, it is given the value of `amount`.




// ## mincr ##
// *Usage:* `mincr(key1, key2, ...)` or `mincr([key1, key2, ...])`

// Increments multiple keys by 1 or sets a key to 1 if it does not exist.

localRedis.mincr('foo', 'bar');
localRedis.mget('foo', 'bar');  // Returns [1, 1]

// *Throws* under the same conditions as `incr`.





// ## mincrby ##
// *Usage:* `mincrby(key1, amount1, key2, amount2, ...)` or
//          `mincrby([key1, amount1, key2, amount2, ...])`

// Increments multiple keys by amount or sets a key to amount if it
// does not exist.

localRedis.mincrby('foo', 3, 'bar', 4);
localRedis.mincrby(['id', 4, 'hits', 1]);
localRedis.mget('foo', 'bar', 'id', 'hits'); // Returns [3, 4, 4, 1]

// Note: This is a *custom*, non-Redis function.

// *Throws* under the same conditions as `incrby`.




// ## decr ##
// *Usage:* `decr(key)`

// Decrements a key by `1` or sets its value to `-1` if the key does not exist.
// *Returns* the value of the key after the decrement.

localRedis.set('foo', 1);
localRedis.decr('foo');     // Returns 0
localRedis.decr('bar');     // Returns -1


// *Throws* under the same conditions as `incr`.




// ## decr ##
// *Usage:* `decr(key)`

// Decrements the key by 1 or sets it to -1 if the key does not exist.

localRedis.decr('hits');
localRedis.get('hits');     // Returns -1

// *Throws* if the *value* of `key` meets **any** of the following conditions:

// * Not an integer or stringified integer (ex: 4 or '4')
// * The key exists but was set with a value of `null`
// * An decrement of the value exceeds the maximum number size for JavaScript.

// *Side effects:* **None**. `decr` does not effect key expiry.

// Note: If `key` does not exist, it is given a value of `-1`.



// ## decrby ##
// *Usage:* `decrby(key, amount)`

// Decrements the key by amount or sets the key to amount if it doesn't exist.

localRedis.decrby('foo', 4);
localRedis.get('foo');        // Returns 4

// *Throws* if the *value* of `key` or `amount` meet **any** of the following conditions:

// * Not an integer or stringified integer (ex: 4 or '4')
// * The key exists but was set with a value of `null`

// *Side effects:* **None**. `decrby` does not effect key expiry.

// Note: If `key` does not exist, it is given the value of `-amount`.




// ## mdecr ##
// *Usage:* `mdecr(key1, key2, ...)` or `mdecr([key1, key2, ...])`

// Decrements multiple keys by 1 or sets a key to -1 if it does not exist.

localRedis.mdecr('foo', 'bar');
localRedis.mget('foo', 'bar');  // Returns [-1, -1]

// *Throws* under the same conditions as `mdecr`.



// ## mdecrby ##
// *Usage:* `mdecrby(key1, amount1, key2, amount2, ...)` or
//          `mdecrby([key1, amount1, key2, amount2, ...])`

// Decrement multiple keys by amount or sets a key to `-amount` if it
// does not exist.

localRedis.mdecrby('foo', 3, 'bar', 4);
localRedis.mdecrby(['id', 4, 'hits', 1]);
localRedis.mget('foo', 'bar', 'id', 'hits'); // Returns [-3, -4, -4, -1]

// Note: This is a *custom*, non-Redis function.

// *Throws* under the same conditions as `decrby`.




// ## append ##
// *Usage:* `append(key, value)`

// Appends `value` at the end of the `key`'s string value or sets
// the key's value to `value` if the key does not exist.
// *Returns* the length of the string after appending or the original
// if the key's value was not a string.

localRedis.set('foo', 'bar');
localRedis.append('foo', 'car');  // Returns 6
localRedis.get('foo');            // Returns 'barcar'
localRedis.append('bar', 'car');  // Returns 3




// ## strlen ##
// *Usage:* `strlen(key)`

// Retrieves the length of `key`'s string value.
// *Returns* the length of the value or 0 if the key does not exist.

localRedis.set('foo', 'bar');
localRedis.strlen('foo');     // Returns 3
localRedis.strlen('bar');     // Returns 0


// *Throws* if the value is not a string.



// ## setex ##
// *Usage:* `setex(key, secondsDelay, value)`

// Sets the `key` to `value` and expires the key after `secondsDelay`.

localRedis.setex('foo', 10, 'bar'); // Expires 'foo' in 10s

// Note: This is equivalent to running a `set(key, value)` followed by
// a `expire(key, secondsDelay)`.

// *Throws* if `secondsDelay` is not a valid number.




// ## psetex ##
// *Usage:* `psetex(key, msDelay, value)`

// Similar to `setex` except the delay is in milliseconds.

localRedis.psetex('foo', 10, 'bar');  // Expires 'foo' in 10 milliseconds

// *Throws* if `msDelay` is not a valid number.





// ***
// ## Lists API ##
// ***



// ## lpush ##
// *Usage:* `lpush(key, val)` or `lpush(key, val1, val2, ...)` or `lpush(key, [val1, val2, ...])`

// Inserts all of the values at the head of the list stored at `key`.
// An empty array will be assumed as the value at `key` if `key` does not exist.
// *Returns* the length of the list post insertion.

localRedis.set('foo', [1, 2, 3]);
localRedis.lpush('foo', 4, 5, 6); // Returns 6
localRedis.get('foo');            // Returns [6, 5, 4, 1, 2, 3]

// Note: Adds the values outward in. So the values `a b c` will be inserted as `c b a`.

// *Throws* if the existing value stored at `key` is not a list.




// ## lpushx ##
// *Usage:* `lpushx(key, val)` or `lpushx(key, val1, val2, ...)` or `lpushx(key, [val1, val2, ...])`

// Inserts values at the head of the list value stored at `key`,
// *iff* `key` already exists and has a list value.
// *Returns* the length of the post insertion list,
// or `0` if the key does not exist or contain a list value.

localRedis.set('foo', [1, 2, 3]);
localRedis.lpushx('foo', 4, 5, 6);  // Returns 6
localRedis.get('foo');              // Returns [6, 5, 4, 1, 2, 3]
localRedis.lpushx('bar', 3);        // Returns 0


// ## rpush ##
// *Usage:* `rpush(key, val)` or `rpush(key, val1, val2, ...)` or `rpush(key, [val1, val2, ...])`

// Inserts/appends all of the values at the tail of the list stored at `key`.
// An empty array will be assumed as the value at `key` if `key` does not exist.
// *Returns* the length of the list post insertion.

localRedis.set('foo', [1, 2, 3]);
localRedis.rpush('foo', 4, 5, 6); // Returns 6
localRedis.get('foo');            // Returns [1, 2, 3, 4, 5, 6]

// *Throws* if the existing value stored at `key` is not a list.




// ## rpushx ##
// *Usage:* `rpushx(key, val)` or `rpushx(key, val1, val2, ...)` or `rpushx(key, [val1, val2, ...])`

// Inserts values at the tail of the list value stored at `key`,
// *iff* `key` already exists and has a list value.
// *Returns* the length of the post insertion list,
// or `0` if the key does not exist or contain a list value.

localRedis.set('foo', [1, 2, 3]);
localRedis.rpushx('foo', 4, 5, 6);  // Returns 6
localRedis.get('foo');              // Returns [1, 2, 3, 4, 5, 6]
localRedis.rpushx('bar', 3);        // Returns 0


// ## llen ##
// *Usage:* `llen(key)`

// Retrieves the length of the list value stored at `key`.
// *Returns* the number of elements in the list value or `0`
// if the key does not exist.

localRedis.set('foo', [1, 2, 3]);
localRedis.llen('foo');     // Returns 3
localRedis.llen('bar');     // Returns 0

// *Throws* if the value at `key` is not a list.





// ## lrange ##
// *Usage:* 'lrange(key, start, stop)'

// Retrieves the specified elements (indexed by start and stop)
// of the list at key.
// *Returns* a list of the retrieved elements or the empty list
// if `start === stop` or `start > stop`.

localRedis.set('foo', [1, 2, 3]);
localRedis.lrange('foo', 0, 1);   // Returns [1, 2]
localRedis.lrange('foo', -3, -1); // Returns [1, 2, 3]



// Note: The values for start and stop can be negative – indexing
// from the end of the list.





// ## lrem ##
// *Usage:* `lrem(key, count, value)`

// Removes the first count ocurrences of value in the list
// stored at key.
// *Returns* the number of removed elements or `0` when the key does not exist

// * If `count > 0`, `lrem` removes from start to finish.
localRedis.set('foo', [1, 1, 2, 1]);
localRedis.lrem('foo', 2, 1);
localRedis.get('foo');        // Returns [2, 1]

// * If `count < 0`, `lrem` removes from finish to start.
localRedis.set('foo', [1, 1, 2, 1]);
localRedis.lrem('foo', -1, 1);
localRedis.get('foo');        // Returns [1, 1, 2]

// * If `count = 0`, `lrem` removes all elements equal to value
localRedis.set('foo', [1, 1, 2, 1]);
localRedis.lrem('foo', 0, 1);
localRedis.get('foo');        // Returns [2]

// *Throws* when the value at `key` is not a list.



// ## lpop ##
// *Usage:* `lpop(key)`

// Removes and returns the first element from the list stored at key.
// Or `null` if the key does not exist.

localRedis.set('foo', [1, 2, 3]);
localRedis.lpop('foo');     // Returns 1
localRedis.get('foo');      // Returns [2, 3]

// *Throws* when the value at `key` is not a list.



// ## rpop ##
// *Usage:* `lpop(key)`

// Removes and returns the last element from the list stored at key.
// Or `null` if the key does not exist.

localRedis.set('foo', [1, 2, 3]);
localRedis.rpop('foo');     // Returns 3
localRedis.get('foo');      // Returns [1, 2]

// *Throws* when the value at `key` is not a list.


// ## linsert ##
// *Usage:* `linsert(key, reference, pivot, value)`

// Stores the `value` 'before' or 'after' (`reference`) the `pivot` value in the list stored
// at `key`.
// *Returns* the length of the new list or -1 when the pivot value
// was not found.

localRedis.set('foo', [1, 2, 3]);
localRedis.linsert('foo', 'before', 2, 15);
localRedis.get('foo');  // Returns [1, 15, 2, 3]
localRedis.linsert('foo', 'after', 15, 5);
localRedis.get('foo');  // Returns [1, 15, 5, 2, 3]

// *Throws* if the reference is not 'before' or 'after'.
