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
    jade: {
      compile: {
        options: {
          pretty: true
        },
        files: {
          'example/index.html': 'example/index.jade'
        }
      }
    },
    html2js: {
      options: {
        module: 'uploads.templates'
      },
      main: {
        src: ['src/templates/*.tpl.jade'],
        dest: 'dist/templates.js'
      },
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        src: [
          'dist/templates.js',
          'src/services/uploads.provider.js',
          'src/controllers/uploads.controllers.js',
          'src/services/uploads.factory.js',
          'src/directives/ngthumb.directives.js',
          'src/directives/uploads.directives.js',
          'src/uploads.js'
        ],
        dest: 'dist/ng-img-upload.js',
      },
    },
    watch: {
      gruntfile: {
        files: ['example/index.jade', 'src/templates/**'],
        tasks: ['jade', 'html2js']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-html2js');

  // Default task.
  grunt.registerTask('default', ['jshint', 'qunit']);

};
