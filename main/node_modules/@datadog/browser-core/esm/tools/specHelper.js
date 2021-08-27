import { __assign, __awaiter, __generator } from "tslib";
import { noop, objectEntries } from './utils';
export var SPEC_ENDPOINTS = {
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
export function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}
export function isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
}
export function isIE() {
    return navigator.userAgent.indexOf('MSIE ') > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
}
export function clearAllCookies() {
    document.cookie.split(';').forEach(function (c) {
        document.cookie = c.replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/;samesite=strict");
    });
}
export function stubFetch() {
    var _this = this;
    var originalFetch = window.fetch;
    var allFetchCompleteCallback = noop;
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
        promise.resolveWith = function (response) { return __awaiter(_this, void 0, void 0, function () {
            var resolved;
            var _this = this;
            return __generator(this, function (_a) {
                resolved = resolve(__assign(__assign({}, response), { clone: function () {
                        var cloned = {
                            text: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
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
        promise.rejectWith = function (error) { return __awaiter(_this, void 0, void 0, function () {
            var rejected;
            return __generator(this, function (_a) {
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
            allFetchCompleteCallback = noop;
        },
    };
}
var StubXhr = /** @class */ (function () {
    function StubXhr() {
        this.response = undefined;
        this.status = undefined;
        this.readyState = XMLHttpRequest.UNSENT;
        this.onreadystatechange = noop;
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
export function createNewEvent(eventName, properties) {
    if (properties === void 0) { properties = {}; }
    var event;
    if (typeof Event === 'function') {
        event = new Event(eventName);
    }
    else {
        event = document.createEvent('Event');
        event.initEvent(eventName, true, true);
    }
    objectEntries(properties).forEach(function (_a) {
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
export function stubXhr() {
    var originalXhr = XMLHttpRequest;
    XMLHttpRequest = StubXhr;
    return {
        reset: function () {
            XMLHttpRequest = originalXhr;
        },
    };
}
export function withXhr(_a) {
    var setup = _a.setup, onComplete = _a.onComplete;
    var xhr = new XMLHttpRequest();
    xhr.addEventListener('loadend', function () {
        setTimeout(function () {
            onComplete(xhr);
        });
    });
    setup(xhr);
}
export function setPageVisibility(visibility) {
    Object.defineProperty(document, 'visibilityState', {
        get: function () {
            return visibility;
        },
        configurable: true,
    });
}
export function restorePageVisibility() {
    delete document.visibilityState;
}
//# sourceMappingURL=specHelper.js.map