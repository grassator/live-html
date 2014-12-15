'use strict';

module.exports = function (grunt) {

  var pkg = grunt.file.readJSON('package.json'),
      fullPkg = grunt.file.readJSON('bower.json'),
      paths = grunt.file.readJSON('paths.json');

  // merging all package.json and bower.json together
  Object.getOwnPropertyNames(pkg).forEach(function(name){
    fullPkg[name] = pkg[name];
  });
    
  // This will go through package.json and load grunt task
  require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    paths: paths,
    pkg: fullPkg,
    banner:
      '/*!\n' +
      ' * live-html-js\n' +
      ' * Copyright (c) 2013-2014 Dmitriy Kubyshkin\n' +

      ' * Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
      ' * of this software and associated documentation files (the "Software"), to deal\n' +
      ' * in the Software without restriction, including without limitation the rights\n' +
      ' * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
      ' * copies of the Software, and to permit persons to whom the Software is\n' +
      ' * furnished to do so, subject to the following conditions:\n' +

      ' * The above copyright notice and this permission notice shall be included in\n' +
      ' * all copies or substantial portions of the Software.\n' +

      ' * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
      ' * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
      ' * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
      ' * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
      ' * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
      ' * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n' +
      ' * THE SOFTWARE.\n' +

      ' *\n' +
      ' * This software makes use of following open-source software:\n' +
      ' *\n' +

      ' * Parse5\n' +
      ' * Copyright (c) 2013-2014 Ivan Nikulin (ifaaan@gmail.com)\n' +

      ' * Permission is hereby granted, free of charge, to any person obtaining a copy\n' +
      ' * of this software and associated documentation files (the "Software"), to deal\n' +
      ' * in the Software without restriction, including without limitation the rights\n' +
      ' * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n' +
      ' * copies of the Software, and to permit persons to whom the Software is\n' +
      ' * furnished to do so, subject to the following conditions:\n' +

      ' * The above copyright notice and this permission notice shall be included in\n' +
      ' * all copies or substantial portions of the Software.\n' +

      ' * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n' +
      ' * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
      ' * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n' +
      ' * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
      ' * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n' +
      ' * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\n' +
      ' * THE SOFTWARE.\n' +
      ' */',

    // Task configuration.
    bower: {
      install: {
        options: {
          cleanup: true,
          targetDir: '<%= paths.vendor %>'
        }
      }
    },

    clean: {
      files: ['<%= paths.dist %>']
    },

    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['<%= concat.dist.dest %>'],
        dest: '<%= paths.dist %>/main.js'
      }
    },

    closurecompiler: {
      combine: {
        files: {
          '<%= paths.dist %>/main.min.js': ['<%= paths.src %>/**/*.js']
        },
        options: {

            // "create_source_map": '<%= paths.dist %>/main.js.map',
            // "source_map_format": 'V3',

            "compilation_level": "ADVANCED_OPTIMIZATIONS",
            
            // "compilation_level": "SIMPLE_OPTIMIZATIONS",
            // "formatting": "PRETTY_PRINT",

            // Manually exposing public api
            "output_wrapper": '";(function(){%output%})();"',

            // This strips module definition resulting in a flat file
            // without any define / require calls.
            "process_common_js_modules": true,
            "transform_amd_modules": true,
            "common_js_module_path_prefix": "src",
            "common_js_entry_module": "main",

            // Plus a simultaneous processes limit
            "max_processes": 5,

            // And an option to add a banner, license or similar on top
            "banner": '<%= banner %>'
        }
      }
    },
 
    requirejs: {
      compile: {
        options: {
          name: '../vendor/rjs-shim',
          baseUrl: "<%= paths.src %>",
          include: ['main'],
          insertRequire: ['main'],
          logLevel: 2, // WARN
          out: '<%= paths.dist %>/main.js',
          // optimize: 'none',
          wrap: {
            start: "<%=banner %>\n(function() {",
            end: "}());"
          }
        }
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
        browsers: ['PhantomJS']
      },
      ci: {
        singleRun: true
      },
      unit: {
        background: true
      }
    },

    jshint: {
      gruntfile: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: '<%= paths.src %>/.jshintrc',
          ignores: ['<%= paths.src %>/fake-dom/parse5.js']
        },
        src: ['<%= paths.src %>/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },

    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile']
      },
      js: {
        files: ['<%= paths.src %>/**/*.js'],
        tasks: ['jshint:src', 'requirejs']
      },
      test: {
        files: ['test/**/*.js'],
        tasks: ['jshint:test']
      },
      livereload: {
        options: {
          livereload: true
        },
        files: ['<%= paths.dist %>/**/*.js', '<%= paths.dist %>/**/*.css', 'examples/**/*.html']
      }
    },

    connect: {
      development: {
        options: {
          base: ['<%= paths.dist %>', '<%= paths.vendor %>', 'examples'],
          livereload: true
        }
      }
    }
  });

  grunt.registerTask('test', ['karma:ci']);
  grunt.registerTask('build', ['clean', 'requirejs']);
  grunt.registerTask('default', ['jshint', 'test', 'build']);
  grunt.registerTask('server', ['requirejs', 'connect', 'watch']);
};
