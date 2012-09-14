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
    uglify: {},
    jasmine_node: {
    spec: "./spec",
    projectRoot: ".",
    requirejs: false,
    forceExit: true,
    jUnit: {
      report: false,
      savePath : "./build/reports/jasmine/",
      useDotNotation: true,
      consolidate: true
    }
  }
  });
  grunt.loadNpmTasks('grunt-jasmine-node-task');
  grunt.loadNpmTasks('grunt-jasmine-node');

  // Default task.
  grunt.registerTask('default', 'min jasmine_node');
};
