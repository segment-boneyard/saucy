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
        , 'avoid-proxy': true
        , 'name': self.testName
        });    
    
    browser.on('command', function(cmd, args){
        console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
    });

    this.browsers.push(browser);
};

SaucySuite.prototype.init = function () {
    this.suite = new Suite(this.testName);
    this.runner = new Runner(this.suite);

    if (this.timeout) this.suite.timeout(this.timeout);
};

SaucySuite.prototype.addReporter = function (reporter) {
    var capitalized = reporter.charAt(0).toUpperCase() + reporter.slice(1);
    var reporter = new reporters[capitalized](this.runner);
    this.reporters.push(reporter);
};

SaucySuite.prototype.ignoreLeaks = function (val) {
    this.runner.ignoreLeaks = (val === true);
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

    // start the test
    setTimeout(function () {
        self.runner.run();
    }, 0);

    _.each(self.browsers, function (browser) {
        var command = browser
            .chain
            .session()
            .open(self.url);

        if (!self.parser.individually) {
            var checkScript = self.parser.getAllCompletedCheckScript(hooks);
            var getScript = self.parser.getAllTestsScript(hooks);
            command.waitForCondition(checkScript, 20000)
            command.getEval(getScript, function (result) {
                var testResults = self.parser.parseResults(result);
                _.keys(testResults).forEach(function (testKey) {
                    var testResult = testResults[testKey];
                    self.hooks[testKey].selenium.emit('done', testResult);
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
                    self.hooks[key].selenium.emit('done', testResult);
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
    });
};

exports.SaucySuite = SaucySuite;