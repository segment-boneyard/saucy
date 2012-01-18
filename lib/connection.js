
var SauceLabsConnection = function (username, accessKey) {
    this.url = 'http://saucelabs.com/';
    this.username = username;
    this.accessKey = accessKey;
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