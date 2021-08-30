import { __spreadArrays } from "tslib";
import { resetFetchProxy, startFetchProxy } from '../browser/fetchProxy';
import { resetXhrProxy, startXhrProxy } from '../browser/xhrProxy';
import { ErrorSource, formatUnknownError, toStackTraceString } from '../tools/error';
import { Observable } from '../tools/observable';
import { jsonStringify, ONE_MINUTE, RequestType } from '../tools/utils';
import { monitor } from './internalMonitoring';
import { computeStackTrace, report } from './tracekit';
var filteredErrorsObservable;
export function startAutomaticErrorCollection(configuration) {
    if (!filteredErrorsObservable) {
        var errorObservable = new Observable();
        trackNetworkError(configuration, errorObservable);
        startConsoleTracking(errorObservable);
        startRuntimeErrorTracking(errorObservable);
        filteredErrorsObservable = filterErrors(configuration, errorObservable);
    }
    return filteredErrorsObservable;
}
export function filterErrors(configuration, errorObservable) {
    var errorCount = 0;
    var filteredErrorObservable = new Observable();
    errorObservable.subscribe(function (error) {
        if (errorCount < configuration.maxErrorsByMinute) {
            errorCount += 1;
            filteredErrorObservable.notify(error);
        }
        else if (errorCount === configuration.maxErrorsByMinute) {
            errorCount += 1;
            filteredErrorObservable.notify({
                message: "Reached max number of errors by minute: " + configuration.maxErrorsByMinute,
                source: ErrorSource.AGENT,
                startTime: performance.now(),
            });
        }
    });
    setInterval(function () { return (errorCount = 0); }, ONE_MINUTE);
    return filteredErrorObservable;
}
var originalConsoleError;
export function startConsoleTracking(errorObservable) {
    originalConsoleError = console.error;
    console.error = monitor(function (message) {
        var optionalParams = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            optionalParams[_i - 1] = arguments[_i];
        }
        originalConsoleError.apply(console, __spreadArrays([message], optionalParams));
        errorObservable.notify({
            message: __spreadArrays(['console error:', message], optionalParams).map(formatConsoleParameters).join(' '),
            source: ErrorSource.CONSOLE,
            startTime: performance.now(),
        });
    });
}
export function stopConsoleTracking() {
    console.error = originalConsoleError;
}
function formatConsoleParameters(param) {
    if (typeof param === 'string') {
        return param;
    }
    if (param instanceof Error) {
        return toStackTraceString(computeStackTrace(param));
    }
    return jsonStringify(param, undefined, 2);
}
var traceKitReportHandler;
export function startRuntimeErrorTracking(errorObservable) {
    traceKitReportHandler = function (stackTrace, _, errorObject) {
        var _a = formatUnknownError(stackTrace, errorObject, 'Uncaught'), stack = _a.stack, message = _a.message, type = _a.type;
        errorObservable.notify({
            message: message,
            stack: stack,
            type: type,
            source: ErrorSource.SOURCE,
            startTime: performance.now(),
        });
    };
    report.subscribe(traceKitReportHandler);
}
export function stopRuntimeErrorTracking() {
    ;
    report.unsubscribe(traceKitReportHandler);
}
export function trackNetworkError(configuration, errorObservable) {
    startXhrProxy().onRequestComplete(function (context) { return handleCompleteRequest(RequestType.XHR, context); });
    startFetchProxy().onRequestComplete(function (context) { return handleCompleteRequest(RequestType.FETCH, context); });
    function handleCompleteRequest(type, request) {
        if (!configuration.isIntakeUrl(request.url) && (isRejected(request) || isServerError(request))) {
            errorObservable.notify({
                message: format(type) + " error " + request.method + " " + request.url,
                resource: {
                    method: request.method,
                    statusCode: request.status,
                    url: request.url,
                },
                source: ErrorSource.NETWORK,
                stack: truncateResponse(request.response, configuration) || 'Failed to load',
                startTime: request.startTime,
            });
        }
    }
    return {
        stop: function () {
            resetXhrProxy();
            resetFetchProxy();
        },
    };
}
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
    if (RequestType.XHR === type) {
        return 'XHR';
    }
    return 'Fetch';
}
//# sourceMappingURL=automaticErrorCollection.js.map