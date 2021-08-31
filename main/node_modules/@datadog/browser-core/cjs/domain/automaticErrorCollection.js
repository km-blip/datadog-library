"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fetchProxy_1 = require("../browser/fetchProxy");
var xhrProxy_1 = require("../browser/xhrProxy");
var error_1 = require("../tools/error");
var observable_1 = require("../tools/observable");
var utils_1 = require("../tools/utils");
var internalMonitoring_1 = require("./internalMonitoring");
var tracekit_1 = require("./tracekit");
var filteredErrorsObservable;
function startAutomaticErrorCollection(configuration) {
    if (!filteredErrorsObservable) {
        var errorObservable = new observable_1.Observable();
        trackNetworkError(configuration, errorObservable);
        startConsoleTracking(errorObservable);
        startRuntimeErrorTracking(errorObservable);
        filteredErrorsObservable = filterErrors(configuration, errorObservable);
    }
    return filteredErrorsObservable;
}
exports.startAutomaticErrorCollection = startAutomaticErrorCollection;
function filterErrors(configuration, errorObservable) {
    var errorCount = 0;
    var filteredErrorObservable = new observable_1.Observable();
    errorObservable.subscribe(function (error) {
        if (errorCount < configuration.maxErrorsByMinute) {
            errorCount += 1;
            filteredErrorObservable.notify(error);
        }
        else if (errorCount === configuration.maxErrorsByMinute) {
            errorCount += 1;
            filteredErrorObservable.notify({
                message: "Reached max number of errors by minute: " + configuration.maxErrorsByMinute,
                source: error_1.ErrorSource.AGENT,
                startTime: performance.now(),
            });
        }
    });
    setInterval(function () { return (errorCount = 0); }, utils_1.ONE_MINUTE);
    return filteredErrorObservable;
}
exports.filterErrors = filterErrors;
var originalConsoleError;
function startConsoleTracking(errorObservable) {
    originalConsoleError = console.error;
    console.error = internalMonitoring_1.monitor(function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        originalConsoleError.apply(console, tslib_1.__spreadArrays([message], optionalParams));
        errorObservable.notify({
            message: tslib_1.__spreadArrays(['console error:', message], optionalParams).map(formatConsoleParameters).join(' '),
            source: error_1.ErrorSource.CONSOLE,
            startTime: performance.now(),
        });
    });
}
exports.startConsoleTracking = startConsoleTracking;
function stopConsoleTracking() {
    console.error = originalConsoleError;
}
exports.stopConsoleTracking = stopConsoleTracking;
function formatConsoleParameters(param) {
    if (typeof param === 'string') {
        return param;
    }
    if (param instanceof Error) {
        return error_1.toStackTraceString(tracekit_1.computeStackTrace(param));
    }
    return utils_1.jsonStringify(param, undefined, 2);
}
var traceKitReportHandler;
function startRuntimeErrorTracking(errorObservable) {
    traceKitReportHandler = function (stackTrace, _, errorObject) {
        var _a = error_1.formatUnknownError(stackTrace, errorObject, 'Uncaught'), stack = _a.stack, message = _a.message, type = _a.type;
        errorObservable.notify({
            message: message,
            stack: stack,
            type: type,
            source: error_1.ErrorSource.SOURCE,
            startTime: performance.now(),
        });
    };
    tracekit_1.report.subscribe(traceKitReportHandler);
}
exports.startRuntimeErrorTracking = startRuntimeErrorTracking;
function stopRuntimeErrorTracking() {
    ;
    tracekit_1.report.unsubscribe(traceKitReportHandler);
}
exports.stopRuntimeErrorTracking = stopRuntimeErrorTracking;
function trackNetworkError(configuration, errorObservable) {
    xhrProxy_1.startXhrProxy().onRequestComplete(function (context) { return handleCompleteRequest(utils_1.RequestType.XHR, context); });
    fetchProxy_1.startFetchProxy().onRequestComplete(function (context) { return handleCompleteRequest(utils_1.RequestType.FETCH, context); });
    function handleCompleteRequest(type, request) {
        if (!configuration.isIntakeUrl(request.url) && (isRejected(request) || isServerError(request))) {
            errorObservable.notify({
                message: format(type) + " error " + request.method + " " + request.url,
                resource: {
                    method: request.method,
                    statusCode: request.status,
                    url: request.url,
                },
                source: error_1.ErrorSource.NETWORK,
                stack: truncateResponse(request.response, configuration) || 'Failed to load',
                startTime: request.startTime,
            });
        }
    }
    return {
        stop: function () {
            xhrProxy_1.resetXhrProxy();
            fetchProxy_1.resetFetchProxy();
        },
    };
}
exports.trackNetworkError = trackNetworkError;
function isRejected(request) {
    return request.status === 0 && request.responseType !== 'opaque';
}
function isServerError(request) {
    return request.status >= 500;
}
function truncateResponse(response, configuration) {
    if (response && response.length > configuration.requestErrorResponseLengthLimit) {
        return response.substring(0, configuration.requestErrorResponseLengthLimit) + "...";
    }
    return response;
}
function format(type) {
    if (utils_1.RequestType.XHR === type) {
        return 'XHR';
    }
    return 'Fetch';
}
//# sourceMappingURL=automaticErrorCollection.js.map