/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    min: {
      dist: {
        src: ['src/local.redis.js'],
        dest: 'src/local.redis.min.js'
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'min');
};
