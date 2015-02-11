// Generated on 2015-01-02 using generator-angular-fullstack 2.0.13
'use strict';

module.exports = function (grunt) {
  // Load grunt tasks automatically
  require('load-grunt-tasks')(grunt);


  grunt.initConfig({
    builddir: '.tmp/build',
    tmpdir: '.tmp',
    src: './src/**/*.js',
    pkg: grunt.file.readJSON('package.json'),
    buildtag: '-dev-' + grunt.template.today('yyyy-mm-dd'),
    meta: {
      banner: '/**\n' +
        ' * <%= pkg.name %>\n' +
        ' * Copyright <%= pkg.author %> '+grunt.template.today('yyyy')+'\n' +
        ' * <%= pkg.description %>\n' +
        ' * @version v<%= pkg.version %><%= buildtag %>\n' +
        ' * @link <%= pkg.homepage %>\n' +
        ' * @license <%= pkg.license %>\n' +
        ' */'
    },
    clean: {
      ngdocs: '<%= tmpdir %>/site/**/*'
    },
    concat: {
      options: {
        banner: '<%= meta.banner %>\n\n'+
                '/* commonjs package manager support (eg componentjs) */\n'+
                'if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports){\n'+
                '  module.exports = \'ui.router\';\n'+
                '}\n\n'+
                '(function (window, angular, undefined) {\n',
        footer: '})(window, window.angular);'
      },
      build: {
        src: '<%= src %>',
        dest: '<%= builddir %>/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>\n'
      },
      build: {
        files: {
          '<%= builddir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>']
        }
      }
    },
    release: {
      files: ['<%= pkg.name %>.js', '<%= pkg.name %>.min.js'],
      src: '<%= builddir %>',
      dest: 'release'
    },
    jshint: {
      all: ['Gruntfile.js', 'src/*.js', '<%= builddir %>/<%= pkg.name %>.js'],
      options: {
        eqnull: true
      }
    },
    express: {
      options: {
        port: process.env.PORT || 9000
      },
      dev: {
        options: {
          script: 'example/server.js'
        }
      }
    },
    watch: {
      options:{
        livereload: true
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      ngdoc: {
        files: ['<%= src %>','ngdoc_assets/**/*'],
        tasks: ['docs']
      },
      src: {
        files: ['<%= src %>'],
        tasks: ['build']
      },
      ngapp:{
        files:  [ 'example/app/*' ],
        options:{
          livereload: true
        }
      },
      express: {
        files:  [ 'example/server.js' ],
        tasks:  [ 'express:dev'],
        options: {
          livereload: true,
          spawn: false
        }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= express.options.port %>'
      }
    },
    ngdocs: {
      options: {
        dest: '<%= tmpdir %>/site',
        scripts: [
          'angular.js'
        ],
        styles: [ 'ngdoc_assets/stormpath-angular.css' ],
        html5Mode: false,
        title: 'stormpath-sdk-angularjs',
        startPage: '/api/stormpath',
        navTemplate: 'ngdoc_assets/nav.html'
      },
      api: {
        src: ['<%= src %>','ngdoc_assets/index.ngdoc'],
        title: 'API Reference',
        api: true
      },
      example: {
        src: ['ngdoc_assets/example/index.ngdoc'],
        title: 'Example',
        api: false
      }
    },
    copy: {
      dist: {
        src: 'build/*',
        dest: 'dest/',
      },
    }
  });

  grunt.registerTask('docs', function () {
    grunt.task.run(['clean:ngdocs','ngdocs']);
  });

  grunt.registerTask('serve', function () {
    grunt.task.run(['build','express:dev','open','watch']);
  });

  grunt.registerTask('build', 'Perform a normal build', ['concat', 'uglify','docs']);

  grunt.registerTask('dist', 'Perform a distribution', ['build', 'copy:dist']);
};
