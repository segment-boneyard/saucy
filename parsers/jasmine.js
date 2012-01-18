var jessie      = require('jessie'),
    _           = require('underscore');

module.exports = JasmineParser = function() {
};

JasmineParser.prototype.binTests = function (suite) {
    var self = this;
    var tests = {};
    suite.suites_.forEach(function (childSuite) {
        _.extend(tests, self.binTests(childSuite));
    });

    if (typeof suite.children_ !== 'undefined') {
        suite.children_.forEach(function (test) {
            var key = test.id;
            tests[key] = {
                suiteTitle: suite.description,
                testTitle: test.description
            };
        });
    }

    return tests;
};

/*
Parses a group of test files.
Returns an object with: keys)) test IDS (values)) an object with a test title
*/
JasmineParser.prototype.parseFiles = function(files) {
    files.forEach(function (file) {
            jessie.include(file);
    });

    return this.binTests(jasmine.getEnv().currentRunner());
};

JasmineParser.prototype.individually = true;

JasmineParser.prototype.getTestCompletionCheckScript = function (testKey, test) {
    return "'" + testKey + "' in window.jsReporter.results()";
};

JasmineParser.prototype.getTestCompletedScript = function (testKey, test) {
    return "window.jsonEncode(window.jsReporter.results()['" + testKey + "'])";
};

JasmineParser.prototype.getAllCompletedCheckScript = function (tests) {
    return "window.jsReporter.results().length === " + _.size(tests).length;
};

JasmineParser.prototype.getAllTestsScript = function (testKey, test) {
    return "window.jsonEncode(window.jsReporter.results())";
};

JasmineParser.prototype.parseResults = function (results) {
    var self = this;
    var tests = JSON.parse(results);
    var testResults = {};
    _.each(_.keys(tests), function (testKey) {
        var result = tests[testKey];
        testResults[testKey] = {
            passed: result.result === 'passed',
            err: null
        };
    });
    return testResults;
};


JasmineParser.prototype.parseResult = function (testResult) {
    var result = JSON.parse(testResult);
    return {
        passed: result.result === 'passed',
        err: null
    };
};