var soda = require('soda')
  , mocha = require('mocha')
  , reporters = mocha.reporters
  , interfaces = mocha.interfaces
  , Runner = mocha.Runner
  , Suite = mocha.Suite
  , chai = require('chai')
  , assert = chai.assert
  , expect = chai.expect
  , _ = require('underscore');

var SeleniumTest = require('./selenium').SeleniumTest;

var SaucySuite = function () {
    this.browsers = [];
    this.reporters = [];
    this.individually = false;
};

SaucySuite.prototype.connection = function (connection) {
    this.connection = connection;
};

SaucySuite.prototype.name = function (name) {
    this.testName = name;
};

SaucySuite.prototype.timeout = function (timeout) {
    this.timeout = timeout;
};

SaucySuite.prototype.setIndividually = function (individually) {
    this.individually = (individually === true);
};

SaucySuite.prototype.url = function (url) {
    this.url = url;
};

SaucySuite.prototype.parser = function (parser) {
    this.parser = parser;
};

SaucySuite.prototype.addBrowser = function (browser) {
    var self = this;
    var browser = soda.createSauceClient({
          'url': self.connection.getUrl()
        , 'username': self.connection.getUsername()
        , 'access-key': self.connection.getAccessKey()
        , 'os': browser.getOS()
        , 'browser': browser.getBrowser()
        , 'browser-version': browser.getVersion()
        , 'avoid-proxy': self.connection.isProxy()
        , 'name': self.testName
        , 'record-video': self.connection.isVideo()
        });    
    
    browser.on('command', function(cmd, args){
        //console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
    });

    this.browsers.push(browser);
};

SaucySuite.prototype.init = function () {
    this.suite = new Suite(this.testName);
    this.runner = new Runner(this.suite);
    this.runner.ignoreLeaks = true;
    if (this.timeout) this.suite.timeout(this.timeout);
};

SaucySuite.prototype.addReporter = function (reporter) {
    var reporter = new reporters[reporter](this.runner);
    this.reporters.push(reporter);
};

SaucySuite.prototype.setHooks = function (hooks) {
    var self = this;

    self.hooks = hooks;

    var binnedSuites = {};
    _.keys(hooks).forEach(function (testKey) {
        var test = hooks[testKey];
        var suiteTitle = test.suiteTitle;
        var testTitle = test.testTitle;
        if (!(suiteTitle in binnedSuites))
            binnedSuites[suiteTitle] = Suite.create(self.suite, suiteTitle);
        var seleniumTest = new SeleniumTest(testKey);
        seleniumTest.on('done', seleniumTest.onCompleted, seleniumTest);
        binnedSuites[suiteTitle].addTest(new mocha.Test(testTitle, function (done) {
            this.timeout(0);
            seleniumTest.done = done;
        }));
        hooks[testKey].selenium = seleniumTest;
    });    
};

SaucySuite.prototype.run = function () {
    var self = this;
    var keys = _.keys(self.hooks);
    var passed = true;

    // start the test
    setTimeout(function () {
        self.runner.run();
    }, 0);

    _.each(self.browsers, function (browser) {
        var command = browser
            .chain
            .session()
            .open(self.url);

        if (!self.individually) {
            var checkScript = self.parser.getAllCompletedCheckScript(self.hooks);
            var getScript = self.parser.getAllTestsScript(self.hooks);
            command.waitForCondition(checkScript, 20000)
            command.getEval(getScript, function (result) {
                var testResults = self.parser.parseResults(result);
                var i = 0;
                _.keys(testResults).forEach(function (testKey) {
                    i += 1;
                    var testResult = testResults[testKey];
                    passed = passed && testResult.passed;
                    // timeout set to give the test a chance to finish before moving onto the next one
                    setTimeout(function () {
                        self.hooks[testKey].selenium.emit('done', testResult);
                    }, i * 100);
                });
            });
        } else {
            keys.forEach(function (key) {
                var testValue = self.hooks[key];
                var checkScript = self.parser.getTestCompletionCheckScript(key, testValue);
                var getScript = self.parser.getTestCompletedScript(key, testValue);
                command.waitForCondition(checkScript, 10000)
                command.getEval(getScript, function (result) {
                    var testResult = self.parser.parseResult(result);
                    passed = passed && testResult.passed;
                    self.hooks[key].selenium.emit('done', testResult);
                });
            });
        }

        command.end(function(err) {
            this.queue = null; 
            this.setContext('sauce:job-info={"passed": ' + (passed &&  (err === null)) + '}', function() {
                browser.testComplete(function() {
                    if (err) throw err;
                });
            });
        });         
    });
};

exports.SaucySuite = SaucySuite;