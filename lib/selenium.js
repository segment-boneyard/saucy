var assert = require('chai').assert;
var EventEmitter = require('events').EventEmitter

var SeleniumTest = function (key) {
    this.key = key;
}

SeleniumTest.prototype.__proto__ = EventEmitter.prototype;

SeleniumTest.prototype.onCompleted = function (testResults) {
    if (!testResults.passed) {
        if (testResults.code)
            console.warn(testResults.code);
        if (testResults.err)
            console.warn(testResults.err);
    }
    assert.ok(testResults.passed, testResults.err);
    this.done();
};

exports.SeleniumTest = SeleniumTest;