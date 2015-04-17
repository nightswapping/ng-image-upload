/*global module:false*/
module.exports = function (grunt) {

  var files = {

    js: 'src/*/*.js',
    main: 'src/uploads.js',
    main_templates_in: 'src/uploads-templates-in.js'

  };

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      all: [
        'src/uploads.js',
        'src/directives/**/*.js',
        'src/controllers/**/*.js',
        'src/services/**/*.js'
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
        module: 'ng-image-upload.img-upload-tpl'
      },
      main: {
        files: {
          'tmp/templates.js': [ 'src/templates/*.tpl.jade' ]
        }
      },
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        files: {
          'dist/ng-image-upload.js': [ files.js, files.main ],
          'dist/ng-image-upload-template-in.js': [ files.js, files.main_templates_in, 'tmp/templates.js' ]
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
  grunt.loadNpmTasks('grunt-html2js');

  // Default task.
  grunt.registerTask('build', [ 'jshint', 'html2js', 'clean:dist', 'concat', 'clean:tmp' ]);
};
