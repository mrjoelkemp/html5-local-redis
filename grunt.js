/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    test: {
      files: ['spec/**/*.js']
    },
    min: {
      dist: {
        src: ['src/local.redis.js'],
        dest: 'src/local.redis.min.js'
      }
    },
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'test min');
};
