
// for eval
global.angular = (function() {
  'use strict';

  function createStack () {
    return (new Error()).stack;
  }

  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  function annotate (fn) {
    var $inject,
        fnText,
        argDecl,
        last;

    if (typeof fn == 'function') {
      if (!($inject = fn.$inject)) {
        $inject = [];
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
          arg.replace(FN_ARG, function(all, underscore, name) {
            $inject.push(name);
          });
        });
      }
    } else if (fn instanceof Array) {
      last = fn.length - 1;
      $inject = fn.slice(0, last);
    }
    return $inject;
  }

  function constructArray (fn, dependencies) {
    return '[' +
      dependencies.
        map(function (arg) {
          return "'" + arg + "'";
        }).
        concat([
          fn.toString()
        ]).
        join(', ') +
      ']';
  }

  function mock (name, fn) {
    if (fn instanceof Array) {
      return module;
    } else if (typeof fn === 'object') {
      Object.keys(fn).forEach(function (prop) {
        mock(null, fn[prop]);
      });
      return module;
    }

    var original = fn.toString();
    var dependencies = annotate(fn);

    if (dependencies.length === 0) {
      return module;
    }


    var rewritten = constructArray(original, dependencies);

    global.js = global.js.replace(original, rewritten);

    return module;
  }

  var module = {
    controller: mock,

    directive: function (name, fn) {
      mock(name, fn);
      if (typeof fn === 'function') {
        var controller = (new fn()).controller;
        if (controller && typeof controller === 'function') {
          mock(null, controller);
        }
      }
    },

    filter: mock,
    service: mock,
    factory: mock,

    constant: function () { return module; },
    value: function () { return module; },

    provider: function (name, fn) {
      mock(name, fn);
      if (typeof fn === 'function') {
        var $get = (new fn()).$get;
        if ($get && typeof $get === 'function') {
          mock(null, $get);
        }
      }
      return module;
    },
    decorator: mock,

    config: function (fn) { return mock(null, fn); },
    run: function (fn) { return mock(null, fn); }
  };

  return {
    module: function () {
      return module;
    }
  };
}());


module.exports = function run (js) {
  global.js = js;
  eval(global.js);

  return global.js;
}