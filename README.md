HTML5 Local Redis
=================

Redis-like API for HTML5 Local Storage.

#### Motivation

HTML5 Storage is a disk-based, client-side storage medium that has a really simple and user-friendly API – involving only a handful of method calls to cover the full functionality of the technology.

Unfortunately, if you want more advanced usage of the storage objects, you would need to roll your own extension to the API. HTML5 Local Redis extends the storage API with popular Redis commands.

We believe that the full possibilities of HTML5 Web Storage hasn't been explored and hopefully this library will serve as a step in that direction.

#### Usage

Simply add the following to your main HTML file:

    <script type="text/javascript" src="path/to/local.redis.min.js"></script>

The library serves as a wrapper for `window.localStorage` and polyfills a cookie-based alternative for older browsers.

#### [Read the documentation](http://html5-local-redis.github.com)

***

#### Additional Tools Used

[Grunt.js](https://github.com/cowboy/grunt): Primarily used for minification with Uglify.js.

* To install Grunt: `npm install -g grunt`

[Jasmine](http://pivotal.github.com/jasmine/): Used for unit testing. Navigate to `index.html` to run the test suite.

#### Atomicity and Isolation

HTML5 Storage is not like Redis in many ways. Namely, HTML5 Storage rarely needs to worry about concurrent users sharing access to the data. As far as HTML5 is concerned, shared access is only achieved within a single browser where multiple tabs/windows are pointing to the same domain. Those tabs then share the same instance of storage and if each process is writing to the datastore, unpredictable behavior can occur.

Albeit rare, race conditions *can* occur. We've given close thought to locking solutions, but practical solutions involve an increased number of reads/writes per command. Due to the fact that web storage is disk-based, these I/O operations are blocking.

A practical solution involves either locking a row (by adding lock data with a hardcoded format that each process will recognize) and having a 
check, set, check behavior for each process. This comes at the expense of two writes, plus the complexity for storing lock data. 

#### Progress

See our progress on the [development Trello board](http://bit.ly/NYgW7c).

Authors: [@mrjoelkemp](https://twitter.com/mrjoelkemp) and [@eudisduran](https://twitter.com/eudisduran)

License: MIT license.