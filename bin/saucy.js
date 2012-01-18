#!/usr/bin/env node

/**
 * Module dependencies.
 */

var program = require('../../commander.js/lib/commander')
  , path = require('path')
  , resolve = path.resolve
  , SaucySuite = require('../lib/saucy').SaucySuite
  , SauceLabsConnection = require('../lib/connection').SauceLabsConnection
  , BrowserDetails = require('../lib/browser').BrowserDetails;

/**
 * Files.
 */

var files = [];


var version = '0.0.1';

// options

program
  .version(version)
  .usage('[options] [files]')
  .option('-n, --testname !<testname>', 'specify the test name')
  .option('-u, --url !<url>', 'specify the url for the browser to hit')
  .option('-b, --browser !<browser>', 'specify the browser to test')
  .option('-v, --browserversion !<browserversion>', 'specify the browser version to test')
  .option('-o, --os !<os>', 'specify the OS to run the browser on')
  .option('-s, --username !<username>', 'specify the sauce labs username to use')
  .option('-a, --access !<access>', 'specify the sauce labs access key to use')
  .option('-p, --parser !<parser>', 'specify the parser to use against the javascript files')
  .option('-R, --reporter !<reporter>', 'specify the reporter to use')
  .option('-t, --timeout <ms>', 'set test-case timeout in milliseconds [2000]')
  .option('-G, --growl', 'enable growl notification support')
  .option('--ignore-leaks', 'ignore global variable leaks')

program.name = 'saucy';

// parse args

program.parse(process.argv);

// reporter

var suite = new SaucySuite()
  , Parser = require('../lib/parsers/' + program.parser)
  , parser = new Parser();

if (program.name) suite.name(program.testname);
if (program.timeout) suite.timeout(program.timeout);

console.log(program.browserversion);

suite.parser(parser);
suite.url(program.url);
suite.connection(new SauceLabsConnection(program.username, program.access));
suite.addBrowser(new BrowserDetails(program.os, program.browser, program.browserversion));

// initializes the mocha structures
suite.init();

suite.addReporter(program.reporter);

if (program.ignoreLeaks) suite.ignoreLeaks(suite.ignoreLeaks);

// files
var files = program.args;

// resolve
files = files.map(function(path){
  return resolve(path);
});
console.log(files);

var hooks = parser.parseFiles(files);
suite.setHooks(hooks);

suite.run();