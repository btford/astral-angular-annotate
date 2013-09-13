/*
 * Test for angular modules that are wrapped by goofy
 * 3rd party loaders like Require.js
 */

var assert = require('should');
var dynamic = require('../dynamic');

// so we don't have to put the stuff we're testing into a string
var stringifyFunctionBody = require('./util').stringifyFunctionBody;
var normalize = require('./util').normalize;
var annotate = function (arg) {
  return normalize(dynamic(stringifyFunctionBody(arg)));
};


describe('annotate', function () {

  it('should annotate modules inside of loaders', function () {
    var annotated = annotate(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        angular.module('myMod', []).
          controller('MyCtrl', function ($scope) {});
      });
    });

    annotated.should.equal(stringifyFunctionBody(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        angular.module('myMod', []).
          controller('MyCtrl', ['$scope', function ($scope) {}]);
      });
    }));
  });

  it('should annotate module refs inside of loaders', function () {
    var annotated = annotate(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        var myMod = angular.module('myMod', []);
        myMod.controller('MyCtrl', function ($scope) {});
        return myMod;
      });

    });

    annotated.should.equal(stringifyFunctionBody(function () {
      var define = function (a, b) { b(); };
      define(["./thing"], function(thing) {
        var myMod = angular.module('myMod', []);
        myMod.controller('MyCtrl', ['$scope', function ($scope) {}]);
        return myMod;
      });
    }));
  });


});
