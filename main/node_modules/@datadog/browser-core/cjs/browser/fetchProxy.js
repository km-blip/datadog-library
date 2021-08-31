"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var internalMonitoring_1 = require("../domain/internalMonitoring");
var tracekit_1 = require("../domain/tracekit");
var error_1 = require("../tools/error");
var urlPolyfill_1 = require("../tools/urlPolyfill");
var fetchProxySingleton;
var originalFetch;
var beforeSendCallbacks = [];
var onRequestCompleteCallbacks = [];
function startFetchProxy() {
    if (!fetchProxySingleton) {
        proxyFetch();
        fetchProxySingleton = {
            beforeSend: function (callback) {
                beforeSendCallbacks.push(callback);
            },
            onRequestComplete: function (callback) {
                onRequestCompleteCallbacks.push(callback);
            },
        };
    }
    return fetchProxySingleton;
}
exports.startFetchProxy = startFetchProxy;
function resetFetchProxy() {
    if (fetchProxySingleton) {
        fetchProxySingleton = undefined;
        beforeSendCallbacks.splice(0, beforeSendCallbacks.length);
        onRequestCompleteCallbacks.splice(0, onRequestCompleteCallbacks.length);
        window.fetch = originalFetch;
    }
}
exports.resetFetchProxy = resetFetchProxy;
function proxyFetch() {
    if (!window.fetch) {
        return;
    }
    originalFetch = window.fetch;
    // tslint:disable promise-function-async
    window.fetch = internalMonitoring_1.monitor(function (input, init) {
        var _this = this;
        var method = (init && init.method) || (typeof input === 'object' && input.method) || 'GET';
        var url = urlPolyfill_1.normalizeUrl((typeof input === 'object' && input.url) || input);
        var startTime = performance.now();
        var context = {
            init: init,
            method: method,
            startTime: startTime,
            url: url,
        };
        var reportFetch = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var text, e_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        context.duration = performance.now() - context.startTime;
                        if (!('stack' in response || response instanceof Error)) return [3 /*break*/, 1];
                        context.status = 0;
                        context.response = error_1.toStackTraceString(tracekit_1.computeStackTrace(response));
                        onRequestCompleteCallbacks.forEach(function (callback) { return callback(context); });
                        return [3 /*break*/, 6];
                    case 1:
                        if (!('status' in response)) return [3 /*break*/, 6];
                        text = void 0;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, response.clone().text()];
                    case 3:
                        text = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        text = "Unable to retrieve response: " + e_1;
                        return [3 /*break*/, 5];
                    case 5:
                        context.response = text;
                        context.responseType = response.type;
                        context.status = response.status;
                        onRequestCompleteCallbacks.forEach(function (callback) { return callback(context); });
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        beforeSendCallbacks.forEach(function (callback) { return callback(context); });
        var responsePromise = originalFetch.call(this, input, context.init);
        responsePromise.then(internalMonitoring_1.monitor(reportFetch), internalMonitoring_1.monitor(reportFetch));
        return responsePromise;
    });
}
//# sourceMappingURL=fetchProxy.js.map