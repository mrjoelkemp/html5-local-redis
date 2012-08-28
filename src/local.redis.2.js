(function (window) {
  "use strict";

  var proto = window.localStorage.constructor.prototype;

  // expire
  proto.expire = function () {
    return false;
  };

  // rpush

  // lpush

  // lrange

  // llen

  // lpop

  // rpop

  // sadd

  // srem

})(window);