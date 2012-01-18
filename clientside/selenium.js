(function () {
    var clean = function clean (test) {
        return {
            title: test.title
            , fullTitle: test.fullTitle()
            , duration: test.duration
            , suiteTitle: test.suiteTitle
        }
    }

    var cleanTest = function cleanTest (test) {
        var obj = clean(test);
        obj.passed = test.passed;
        obj.code = test.fn.toString();
        if (!test.passed && test.err) {
            if (test.err.details)
                obj.err = test.err.details();
            else
                obj.err = test.err.message;
        }
            
        return obj;
    }

    var cleanFailures = function cleanFailures (test) {
        var obj = clean(test);
        if (test.err) {
            if (test.err.details)
                obj.err = test.err.details();
            else
                obj.err = test.err.message;
        }
        return obj;
    }

    window.SeleniumReporter = function SeleniumReporter(runner) {
        var self = this;
        window.mocha.reporters.Base.call(this, runner);
        window.individualTestResults = {};

        var tests = []
            , failures = []
            , passes = [];

        runner.on('test end', function(test) {
            test.suiteTitle = test.parent.title;
            tests.push(test);

            var key = test.parent.title + ':::' + test.title;
            window.individualTestResults[key] = cleanTest(test);
        });

        runner.on('pass', function(test){
            passes.push(test);
        });

        runner.on('fail', function(test){
            failures.push(test);
        });

        runner.on('end', function(){
            var obj = {
                stats: self.stats
                , suites: {}
                , tests: tests.map(cleanTest)
                , failures: failures.map(cleanFailures)
                , passes: passes.map(clean)
            };

            tests.forEach(function (test) {
                var cleaned = cleanTest(test);
                if (test.suiteTitle in obj.suites) {
                    obj.suites[test.suiteTitle].push(cleaned);
                } else {
                    obj.suites[test.suiteTitle] = [cleaned];
                }
            });

            window.completeTestResults = obj;
        });
    }
})();