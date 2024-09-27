"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var utils_1 = require("./utils");
exports.SPEC_ENDPOINTS = {
    internalMonitoringEndpoint: 'https://monitoring-intake.com/v1/input/abcde?foo=bar',
    logsEndpoint: 'https://logs-intake.com/v1/input/abcde?foo=bar',
    rumEndpoint: 'https://rum-intake.com/v1/input/abcde?foo=bar',
    traceEndpoint: 'https://trace-intake.com/v1/input/abcde?foo=bar',
    isIntakeUrl: function (url) {
        var intakeUrls = [
            'https://monitoring-intake.com/v1/input/',
            'https://logs-intake.com/v1/input/',
            'https://rum-intake.com/v1/input/',
            'https://trace-intake.com/v1/input/',
        ];
        return intakeUrls.some(function (intakeUrl) { return url.indexOf(intakeUrl) === 0; });
    },
};
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
exports.isSafari = isSafari;
function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
exports.isFirefox = isFirefox;
function isIE() {
    return navigator.userAgent.indexOf('MSIE ') > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
}
exports.isIE = isIE;
function clearAllCookies() {
    document.cookie.split(';').forEach(function (c) {
        document.cookie = c.replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;samesite=strict");
    });
}
exports.clearAllCookies = clearAllCookies;
function stubFetch() {
    var _this = this;
    var originalFetch = window.fetch;
    var allFetchCompleteCallback = utils_1.noop;
    var pendingRequests = 0;
    function onRequestEnd() {
        pendingRequests -= 1;
        if (pendingRequests === 0) {
            setTimeout(function () { return allFetchCompleteCallback(); });
        }
    }
    window.fetch = (function () {
        pendingRequests += 1;
        var resolve;
        var reject;
        var promise = new Promise(function (res, rej) {
            resolve = res;
            reject = rej;
        });
        promise.resolveWith = function (response) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var resolved;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                resolved = resolve(tslib_1.__assign(tslib_1.__assign({}, response), { clone: function () {
                        var cloned = {
                            text: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                return tslib_1.__generator(this, function (_a) {
                                    if (response.responseTextError) {
                                        throw response.responseTextError;
                                    }
                                    return [2 /*return*/, response.responseText];
                                });
                            }); },
                        };
                        return cloned;
                    } }));
                onRequestEnd();
                return [2 /*return*/, resolved];
            });
        }); };
        promise.rejectWith = function (error) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var rejected;
            return tslib_1.__generator(this, function (_a) {
                rejected = reject(error);
                onRequestEnd();
                return [2 /*return*/, rejected];
            });
        }); };
        return promise;
    });
    return {
        whenAllComplete: function (callback) {
            allFetchCompleteCallback = callback;
        },
        reset: function () {
            window.fetch = originalFetch;
            allFetchCompleteCallback = utils_1.noop;
        },
    };
}
exports.stubFetch = stubFetch;
var StubXhr = /** @class */ (function () {
    function StubXhr() {
        this.response = undefined;
        this.status = undefined;
        this.readyState = XMLHttpRequest.UNSENT;
        this.onreadystatechange = utils_1.noop;
        this.fakeEventTarget = document.createElement('div');
    }
    // tslint:disable:no-empty
    StubXhr.prototype.open = function (method, url) { };
    StubXhr.prototype.send = function () { };
    // tslint:enable:no-empty
    StubXhr.prototype.abort = function () {
        this.status = 0;
    };
    StubXhr.prototype.complete = function (status, response) {
        this.response = response;
        this.status = status;
        this.readyState = XMLHttpRequest.DONE;
        this.onreadystatechange();
        if (status >= 200 && status < 500) {
            this.dispatchEvent('load');
        }
        if (status >= 500) {
            this.dispatchEvent('error');
        }
        this.dispatchEvent('loadend');
    };
    StubXhr.prototype.addEventListener = function (name, callback) {
        this.fakeEventTarget.addEventListener(name, callback);
    };
    StubXhr.prototype.dispatchEvent = function (name) {
        this.fakeEventTarget.dispatchEvent(createNewEvent(name));
    };
    return StubXhr;
}());
function createNewEvent(eventName, properties) {
    if (properties === void 0) { properties = {}; }
    var event;
    if (typeof Event === 'function') {
        event = new Event(eventName);
    }
    else {
        event = document.createEvent('Event');
        event.initEvent(eventName, true, true);
    }
    utils_1.objectEntries(properties).forEach(function (_a) {
        var name = _a[0], value = _a[1];
        // Setting values directly or with a `value` descriptor seems unsupported in IE11
        Object.defineProperty(event, name, {
            get: function () {
                return value;
            },
        });
    });
    return event;
}
exports.createNewEvent = createNewEvent;
function stubXhr() {
    var originalXhr = XMLHttpRequest;
    XMLHttpRequest = StubXhr;
    return {
        reset: function () {
            XMLHttpRequest = originalXhr;
        },
    };
}
exports.stubXhr = stubXhr;
function withXhr(_a) {
    var setup = _a.setup, onComplete = _a.onComplete;
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('loadend', function () {
        setTimeout(function () {
            onComplete(xhr);
        });
    });
    setup(xhr);
}
exports.withXhr = withXhr;
function setPageVisibility(visibility) {
    Object.defineProperty(document, 'visibilityState', {
        get: function () {
            return visibility;
        },
        configurable: true,
    });
}
exports.setPageVisibility = setPageVisibility;
function restorePageVisibility() {
    delete document.visibilityState;
}
exports.restorePageVisibility = restorePageVisibility;
//# sourceMappingURL=specHelper.js.map