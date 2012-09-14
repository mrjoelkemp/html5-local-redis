HTML5 Local Redis
=================

Redis-like API for HTML5 Storage Objects (localStorage and sessionStorage).

#### Motivation

HTML5 Storage is a disk-based, client-side storage medium that has a really simple and user-friendly API – involving only a handful of method calls to cover the full functionality of the technology.

Unfortunately, if you want more advanced usage of the storage objects, you would need to roll your own extension to the API. HTML5 Local Redis extends the storage API with popular Redis commands.

We believe that the full possibility of HTML5 Storage hasn't been explored and hopefully this library will serve as a step in that direction.

#### Usage

Simply add the following to your main HTML file:

    <script type="text/javascript" src="path/to/local.redis.min.js"></script>

The library extends the functionality of the `window.localStorage`
and `window.sessionStorage` objects, or polyfills for older browsers.


##### Example Commands

In Redis:

```
SET 'foo' 'bar'
GET 'foo'        => 'bar'
GETSET 'foo' 4   => 'bar'
GET 'foo'        => 4
INCRBY 'foo' 3   => 7
EXPIRE 'foo' 3
```

Local Redis:

```
localStorage.set('foo', 'bar');
localStorage.get('foo');           // 'bar'
localStorage.getset('foo', 4);     // 'bar'
localStorage.get('foo');           // 4
localStorage.incrby('foo', 3);     // 'foo' => 7
localStorage.expire('foo', 2);     // Expire 'foo' in 2s
```

**More supported command documentation soon!**

***

#### Additional Tools Used

[Grunt.js](https://github.com/cowboy/grunt): Used for minification with Uglify.js and potentially multi-source merge and multiple builds of api sections.

* To install Grunt: `npm install -g grunt`

[Jasmine](http://pivotal.github.com/jasmine/): Used for unit testing. Navigate to `index.html` to run the test suite.

#### Atomicity and Isolation

HTML5 Storage is not like Redis in many ways. Namely, HTML5 Storage rarely needs to worry about concurrent users sharing access to the data. As far as HTML5 is concerned, shared access is only achieved within a single browser where multiple tabs/windows are pointing to the same domain. Those tabs then share the same instance of storage and if each process is writing to the datastore, unpredictable behavior can occur.

Albeit rare, race conditions *can* occur. We've given close thought to locking solutions, but practical solutions involve an increased number of reads/writes per command. Due to the fact that web storage is disk-based, these I/O operations are blocking.

A more practical solution involves hooking into the `storage` event, but this will be implemented in a later release.

#### Progress

See our progress on the [development Trello board](http://bit.ly/NYgW7c).

Authors: [@mrjoelkemp](https://twitter.com/mrjoelkemp) and [@eudisduran](https://twitter.com/eudisduran)

License: Feel free to use it for all types of projects (personal and commercial). MIT license.