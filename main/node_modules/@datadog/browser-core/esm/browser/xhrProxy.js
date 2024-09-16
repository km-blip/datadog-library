import { monitor } from '../domain/internalMonitoring';
import { normalizeUrl } from '../tools/urlPolyfill';
var xhrProxySingleton;
var beforeSendCallbacks = [];
var onRequestCompleteCallbacks = [];
var originalXhrOpen;
var originalXhrSend;
export function startXhrProxy() {
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
export function resetXhrProxy() {
    if (xhrProxySingleton) {
        xhrProxySingleton = undefined;
        beforeSendCallbacks.splice(0, beforeSendCallbacks.length);
        onRequestCompleteCallbacks.splice(0, onRequestCompleteCallbacks.length);
        XMLHttpRequest.prototype.open = originalXhrOpen;
        XMLHttpRequest.prototype.send = originalXhrSend;
    }
}
function proxyXhr() {
    originalXhrOpen = XMLHttpRequest.prototype.open;
    originalXhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = monitor(function (method, url) {
        // WARN: since this data structure is tied to the instance, it is shared by both logs and rum
        // and can be used by different code versions depending on customer setup
        // so it should stay compatible with older versions
        this._datadog_xhr = {
            method: method,
            startTime: -1,
            url: normalizeUrl(url),
        };
        return originalXhrOpen.apply(this, arguments);
    });
    XMLHttpRequest.prototype.send = monitor(function (body) {
        var _this = this;
        if (this._datadog_xhr) {
            this._datadog_xhr.startTime = performance.now();
            var originalOnreadystatechange_1 = this.onreadystatechange;
            this.onreadystatechange = function () {
                if (this.readyState === XMLHttpRequest.DONE) {
                    monitor(reportXhr_1)();
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
            this.addEventListener('loadend', monitor(reportXhr_1));
            beforeSendCallbacks.forEach(function (callback) { return callback(_this._datadog_xhr, _this); });
        }
        return originalXhrSend.apply(this, arguments);
    });
}
//# sourceMappingURL=xhrProxy.js.map