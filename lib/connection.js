
var SauceLabsConnection = function (username, accessKey) {
    this.url = 'http://saucelabs.com/';
    this.username = username;
    this.accessKey = accessKey;
    this.video = false;
    this.proxy = false;
};

SauceLabsConnection.prototype.setVideo = function (video) {
    this.video = (video === true);
};

SauceLabsConnection.prototype.setProxy = function (proxy) {
    this.proxy = (proxy === true);
};

SauceLabsConnection.prototype.isVideo = function () {
    return this.video;
};

SauceLabsConnection.prototype.isProxy = function () {
    return this.proxy;
};

SauceLabsConnection.prototype.getUrl = function () {
    return this.url;
};

SauceLabsConnection.prototype.getUsername = function () {
    return this.username;
};

SauceLabsConnection.prototype.getAccessKey = function () {
    return this.accessKey;
};

exports.SauceLabsConnection = SauceLabsConnection;