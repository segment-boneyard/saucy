var EventEmitter = require('events').EventEmitter

var SeleniumTest = function (key) {
    this.key = key;
}

SeleniumTest.prototype.__proto__ = EventEmitter.prototype;

SeleniumTest.prototype.onCompleted = function (testResults) {
    if (!testResults.passed) {
        console.warn('');
        console.warn('-----');
        if (testResults.code)
            console.warn(testResults.code);
        console.warn('');
        if (testResults.err)
            console.warn(testResults.err);
        console.warn('-----');
    }
    assert.ok(testResults.passed, testResults.err);
    this.done();
};

exports.SeleniumTest = SeleniumTest;