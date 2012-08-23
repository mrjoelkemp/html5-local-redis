var LocalRedis    = LocalRedis || {};
LocalRedis.Utils  = LocalRedis.Utils || {};

(function (Utils) {
  "use strict";

  Utils.Tictoc = {
    start: 0
    
    , tic: function () {
        this.start = new Date().getTime();
      }

    , toc: function () {
        var elapsedSeconds = (new Date().getTime() - this.start) / 1000
        , output  = elapsedSeconds + "s";

        if(typeof console === "undefined") {
          alert(output);
        } else {
          console.log(output);
        }
      }
  };
  
})(LocalRedis.Utils); 