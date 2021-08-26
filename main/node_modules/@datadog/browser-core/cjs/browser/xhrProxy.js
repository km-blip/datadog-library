"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var internalMonitoring_1 = require("../domain/internalMonitoring");
var urlPolyfill_1 = require("../tools/urlPolyfill");
var xhrProxySingleton;
var beforeSendCallbacks = [];
var onRequestCompleteCallbacks = [];
var originalXhrOpen;
var originalXhrSend;
function startXhrProxy() {
    if (!xhrProxySingleton) {
        proxyXhr();
        xhrProxySingleton = {
            beforeSend: function (callback) {
                beforeSendCallbacks.push(callback);
            },
            onRequestComplete: function (callback) {
                onRequestCompleteCallbacks.push(callback);
            },
        };
    }
    return xhrProxySingleton;
}
exports.startXhrProxy = startXhrProxy;
function resetXhrProxy() {
    if (xhrProxySingleton) {
        xhrProxySingleton = undefined;
        beforeSendCallbacks.splice(0, beforeSendCallbacks.length);
        onRequestCompleteCallbacks.splice(0, onRequestCompleteCallbacks.length);
        XMLHttpRequest.prototype.open = originalXhrOpen;
        XMLHttpRequest.prototype.send = originalXhrSend;
    }
}
exports.resetXhrProxy = resetXhrProxy;
function proxyXhr() {
    originalXhrOpen = XMLHttpRequest.prototype.open;
    originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = internalMonitoring_1.monitor(function (method, url) {
        // WARN: since this data structure is tied to the instance, it is shared by both logs and rum
        // and can be used by different code versions depending on customer setup
        // so it should stay compatible with older versions
        this._datadog_xhr = {
            method: method,
            startTime: -1,
            url: urlPolyfill_1.normalizeUrl(url),
        };
        return originalXhrOpen.apply(this, arguments);
    });
    XMLHttpRequest.prototype.send = internalMonitoring_1.monitor(function (body) {
        var _this = this;
        if (this._datadog_xhr) {
            this._datadog_xhr.startTime = performance.now();
            var originalOnreadystatechange_1 = this.onreadystatechange;
            this.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    internalMonitoring_1.monitor(reportXhr_1)();
                }
                if (originalOnreadystatechange_1) {
                    originalOnreadystatechange_1.apply(this, arguments);
                }
            };
            var hasBeenReported_1 = false;
            var reportXhr_1 = function () {
                if (hasBeenReported_1) {
                    return;
                }
                hasBeenReported_1 = true;
                _this._datadog_xhr.duration = performance.now() - _this._datadog_xhr.startTime;
                _this._datadog_xhr.response = _this.response;
                _this._datadog_xhr.status = _this.status;
                onRequestCompleteCallbacks.forEach(function (callback) { return callback(_this._datadog_xhr); });
            };
            this.addEventListener('loadend', internalMonitoring_1.monitor(reportXhr_1));
            beforeSendCallbacks.forEach(function (callback) { return callback(_this._datadog_xhr, _this); });
        }
        return originalXhrSend.apply(this, arguments);
    });
}
//# sourceMappingURL=xhrProxy.js.map