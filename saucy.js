var soda = require('soda');

var browser = soda.createSauceClient({
  'url': 'http://saucelabs.com/'
, 'username': 'segment'
, 'access-key': 'd26c71e4-9160-440b-8b2f-5763b601118d'
, 'os': 'Windows 2003'
, 'browser': 'iexplore'
, 'browser-version': '6.'
, 'avoid-proxy': true
, 'name': 'This is an example test'
});

browser.on('command', function(cmd, args){
    //console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
});

var mocha = require('mocha')
  , reporters = mocha.reporters
  , interfaces = mocha.interfaces
  , Runner = mocha.Runner
  , Suite = mocha.Suite
  , chai = require('chai')
  , assert = chai.assert
  , expect = chai.expect
  , EventEmitter = require('events').EventEmitter
  , _ = require('underscore');


function SeleniumTest(key) {
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

var localSuite = new Suite('');
var runner = new Runner(localSuite);
runner.ignoreLeaks = true;
var reporter = new reporters.Spec(runner);

var configureHooks = function configureHooks(hooks) {
    var binnedSuites = {};
    _.keys(hooks).forEach(function (testKey) {
        var test = hooks[testKey];
        var suiteTitle = test.suiteTitle;
        var testTitle = test.testTitle;
        if (!(suiteTitle in binnedSuites))
            binnedSuites[suiteTitle] = Suite.create(localSuite, suiteTitle);
        var seleniumTest = new SeleniumTest(testKey);
        seleniumTest.on('done', seleniumTest.onCompleted, seleniumTest);
        binnedSuites[suiteTitle].addTest(new mocha.Test(testTitle, function (done) {
            this.timeout(0);
            seleniumTest.done = done;
        }));
        hooks[testKey].selenium = seleniumTest;
    });
}

var Parser = require('./parsers/jasmine');
var parser = new Parser();

var hooks = parser.parseFiles(['../jas']);
configureHooks(hooks);
var keys = _.keys(hooks);

setTimeout(function () {
    runner.run();
}, 0);

var command = browser
    .chain
    .session()
    .open('http://65.96.168.170/jas');

if (!parser.individually) {
    var checkScript = parser.getAllCompletedCheckScript(hooks);
    var getScript = parser.getAllTestsScript(hooks);
    command.waitForCondition(checkScript, 20000)
    command.getEval(getScript, function (result) {
        var testResults = parser.parseResults(result);
        _.keys(testResults).forEach(function (testKey) {
            var testResult = testResults[testKey];
            hooks[testKey].selenium.emit('done', testResult);
        });
    });
} else {
    keys.forEach(function (key) {
        var testValue = hooks[key];
        var checkScript = parser.getTestCompletionCheckScript(key, testValue);
        var getScript = parser.getTestCompletedScript(key, testValue);
        command.waitForCondition(checkScript, 10000)
        command.getEval(getScript, function (result) {
            var testResult = parser.parseResult(result);
            hooks[key].selenium.emit('done', testResult);
        });
    });
}

command.end(function(err) {
    this.queue = null;
    this.setContext('sauce:job-info={"passed": ' + (err === null) + '}', function() {
        browser.testComplete(function() {
            if (err) throw err;
        });
    });
});