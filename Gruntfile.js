/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      all: [
        'uploads.js',
        'directives/**/*.js',
        'controllers/**/*.js',
        'services/**/*.js'
      ],
      options: {
        curly: true,
        immed: true,
        newcap: true,
        noarg: true,
        sub: true,
        boss: true,
        eqnull: true,
        validthis: true,
        strict: true
      },
      globals: {
        'angular': true
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    jade: {
      compile: {
        options: {
          pretty: true
        },
        files: {
          "index.html": "index.jade"
        }
      }
    },
    html2js: {
      options: {
        module: 'uploads.templates'
      },
      main: {
        src: ['templates/*.tpl.jade'],
        dest: './templates.js'
      },
    },
    watch: {
      gruntfile: {
        files: ['index.jade', 'templates/**'],
        tasks: ['jade', 'html2js']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html2js');

  // Default task.
  grunt.registerTask('default', ['jshint', 'qunit']);

};
