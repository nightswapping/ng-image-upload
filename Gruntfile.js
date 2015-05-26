/*global module:false*/
module.exports = function (grunt) {

  var files = {

    js: 'src/*/*.js',
    main: 'src/ng-image-upload.js'

  };

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      all: [
        'src/**/*.js'
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
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        files: {
          'dist/ng-image-upload.js': [ files.js, files.main ]
        }
      },
    },
    clean : {
      dist: { src: 'dist/' },
      tmp: { src: 'tmp/' }
    },
    karma: {
      unit: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: false,
        singleRun: true
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
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('build', [ 'jshint', 'clean:dist', 'concat', 'clean:tmp' ]);
  grunt.registerTask('default', [ 'build', 'karma' ]);
};
