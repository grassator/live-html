/*global require: true, define:true */
var require, define;
(function () {
    var baseDirRegex = /[^\/]+$/,
        currentDirRegex = /\/\.\//g,
        doubleSlashRegex = /\/\//g,
        relativeRegex = /[^\/]+\/\.\.\//,
        defined = {},
        amd = {},
        replaced = false;

    // If there was at least one match sets replaced flag
    function replacer(){
        replaced = true;
        return '';
    }

    // Creates resolver for relative paths
    var resolve = (function(){
        return function(name, url) {
            // removing last part of the name because it's the name of
            // module js file that we are resolving path from
            name = name.replace(baseDirRegex, '');

            // removing junk like /./ and // from path
            url = (name + url).replace(currentDirRegex, '/')
                              .replace(doubleSlashRegex, '');

            do {
                replaced = false;
                url = url.replace(relativeRegex, replacer);
            } while (replaced);

            return url;
        };
    })();

    require = function (deps) {
        var result = [];
        for(var i = 0; i < deps.length; ++i) {
            result[i] = deps[i] in amd ? amd[deps[i]] : defined[deps[i]].call(this);
        }
        return result;
    };

    define = function (name, dependencies, initializer) {
        defined[name] = function() {
            for(var i = 0; i < dependencies.length; ++i) {
                dependencies[i] = resolve(name, dependencies[i]);
            }
            dependencies = require(dependencies);
            return (define.amd[name] = initializer.apply(this, dependencies));
        };
    };

    define.amd = amd;
}());
