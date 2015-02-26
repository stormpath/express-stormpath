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
          '<%= builddir %>/<%= pkg.name %>.min.js': ['<banner:meta.banner>', '<%= concat.build.dest %>'],
          '<%= builddir %>/<%= pkg.name %>.tpls.min.js': ['<banner:meta.banner>', '<%= builddir %>/<%= pkg.name %>.tpls.js']
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
        startPage: '/api',
        navTemplate: 'ngdoc_assets/nav.html'
      },
      api: {
        src: ['<%= src %>','ngdoc_assets/index.ngdoc'],
        title: 'API Reference',
        api: true
      },
      quickstart: {
        src: ['ngdoc_assets/quickstart/index.ngdoc'],
        title: 'Quickstart',
        api: false
      }
    },
    copy: {
      dist: {
        files:[{
          expand: true,
          flatten: true,
          src: '.tmp/build/*',
          dest: 'dist/'
        }]
      },
    },
    html2js: {
      options: {
        module: 'stormpath.templates',
        htmlmin: {
          collapseBooleanAttributes: false,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: false,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: false,
          removeStyleLinkTypeAttributes: false
        }
      },
      main: {
        src: ['src/**/*.tpl.html'],
        dest: '<%= builddir %>/<%= pkg.name %>.tpls.js'
      },
    }
  });

  grunt.registerTask('docs', function () {
    grunt.task.run(['clean:ngdocs','ngdocs']);
  });

  grunt.registerTask('serve', function () {
    grunt.task.run(['build','express:dev','open','watch']);
  });

  grunt.registerTask('build', 'Perform a normal build', ['concat', 'html2js','uglify','docs']);

  grunt.registerTask('dist', 'Perform a distribution', ['build', 'copy:dist']);
};
