// Author:  Joel Kemp
// File:    tic.toc.js
// Purpose: Timer that prints the elapsed seconds between calls to tic() and toc()
// Notes:   Replicates the timing functionality of Matlab.
//          Adds tic() and toc() to the global object for calling convenience.

(function () {
  "use strict";
  var start;

  window.tic = function () {
    start = new Date().getTime();
  };

  window.toc = function () {
    var elapsedSeconds = (new Date().getTime() - start) / 1000
      , output  = elapsedSeconds + "s";

    if(console === "undefined") {
      alert(output);
    }
    console.log(output);
  };
})(window);