
var BrowserDetails = function (os, browser, version) {
    this.os = os;
    this.browser = browser;
    this.version = version;  
};

BrowserDetails.prototype.getOS = function () {
    return this.os;
};

BrowserDetails.prototype.getBrowser = function () {
    return this.browser;
};

BrowserDetails.prototype.getVersion = function () {
    return this.version;
};

exports.BrowserDetails = BrowserDetails;