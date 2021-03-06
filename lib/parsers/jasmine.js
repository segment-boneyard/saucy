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
        if (file.indexOf('.js') === (file.length -3))
            file = file.substring(0, (file.length - 3));
        jessie.include(file);
    });

    return this.binTests(jasmine.getEnv().currentRunner());
};

JasmineParser.prototype.getTestCompletionCheckScript = function (testKey, test) {
    return "'" + testKey + "' in window.jsReporter.results()";
};

JasmineParser.prototype.getTestCompletedScript = function (testKey, test) {
    return "window.jsonEncode(window.jsReporter.results()['" + testKey + "'])";
};

JasmineParser.prototype.getAllCompletedCheckScript = function (tests) {
    return "_.size(window.jsReporter.results()) === " + _.size(tests);
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