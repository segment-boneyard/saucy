var mocha = require('mocha')
  , reporters = mocha.reporters
  , interfaces = mocha.interfaces
  , Runner = mocha.Runner
  , Suite = mocha.Suite
  , chai = require('chai')
  , _ = require('underscore');

global.chai = chai;

module.exports = MochaParser = function() {
};

MochaParser.prototype.getTestKey = function (test) {
    return test.parent.title + ':::' + test.title;
};

MochaParser.prototype.binTests = function (suite) {
    var self = this;
    var tests = {};
    suite.suites.forEach(function (childSuite) {
        _.extend(tests, self.binTests(childSuite));
    });

    suite.tests.forEach(function (test) {
        var key = self.getTestKey(test);
        tests[key] = {
            suiteTitle: test.parent.title,
            testTitle: test.title
        };
    });

    return tests;
};

/*
Parses a group of test files.
Returns an object with: keys)) test IDS (values)) an object with a test title
*/
MochaParser.prototype.parseFiles = function(files) {
    var ints = ['tdd', 'bdd', 'exports'];

    var suite = new Suite('')

    ints.forEach(function (interface) {
        interfaces[interface](suite);
    });

    suite.emit('pre-require', global);  
    files.forEach(function (file) {
        suite.emit('require', require(file), file);
        suite.emit('post-require', global, file);
    });

    return this.binTests(suite);
};

MochaParser.prototype.individually = true;

MochaParser.prototype.getTestCompletionCheckScript = function (testKey, test) {
    return "'" + testKey + "' in window.individualTestResults";
};

MochaParser.prototype.getTestCompletedScript = function (testKey, test) {
    return "window.jsonEncode(window.individualTestResults['" + testKey + "'])";
};

MochaParser.prototype.getAllCompletedCheckScript = function (tests) {
    return "typeof window.completeTestResults !== 'undefined'";
};

MochaParser.prototype.getAllTestsScript = function (tests) {
    return "window.jsonEncode(window.completeTestResults)";
};

MochaParser.prototype.parseResults = function (results) {
    var self = this;
    var tests = JSON.parse(results);
    // WRONG:BUG: should return a dictionary here
    return tests.map(function (item) { return self.parseResult(JSON.stringify(item)) });
};

MochaParser.prototype.parseResult = function (testResult) {
    var result = JSON.parse(testResult);
    return {
        passed: result.passed,
        code: result.code,
        err: result.err
    };
};