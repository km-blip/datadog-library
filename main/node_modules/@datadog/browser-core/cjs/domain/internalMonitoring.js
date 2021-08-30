"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
// tslint:disable ban-types
var context_1 = require("../tools/context");
var error_1 = require("../tools/error");
var utils = tslib_1.__importStar(require("../tools/utils"));
var transport_1 = require("../transport/transport");
var tracekit_1 = require("./tracekit");
var StatusType;
(function (StatusType) {
    StatusType["info"] = "info";
    StatusType["error"] = "error";
})(StatusType || (StatusType = {}));
var monitoringConfiguration = { maxMessagesPerPage: 0, sentMessageCount: 0 };
var externalContextProvider;
function startInternalMonitoring(configuration) {
    if (configuration.internalMonitoringEndpoint) {
        var batch = startMonitoringBatch(configuration);
        utils.assign(monitoringConfiguration, {
            batch: batch,
            maxMessagesPerPage: configuration.maxInternalMonitoringMessagesPerPage,
            sentMessageCount: 0,
        });
    }
    return {
        setExternalContextProvider: function (provider) {
            externalContextProvider = provider;
        },
    };
}
exports.startInternalMonitoring = startInternalMonitoring;
function startMonitoringBatch(configuration) {
    var primaryBatch = createMonitoringBatch(configuration.internalMonitoringEndpoint);
    var replicaBatch;
    if (configuration.replica !== undefined) {
        replicaBatch = createMonitoringBatch(configuration.replica.internalMonitoringEndpoint);
    }
    function createMonitoringBatch(endpointUrl) {
        return new transport_1.Batch(new transport_1.HttpRequest(endpointUrl, configuration.batchBytesLimit), configuration.maxBatchSize, configuration.batchBytesLimit, configuration.maxMessageSize, configuration.flushTimeout);
    }
    function withContext(message) {
        return context_1.combine({
            date: new Date().getTime(),
            view: {
                referrer: document.referrer,
                url: window.location.href,
            },
        }, externalContextProvider !== undefined ? externalContextProvider() : {}, message);
    }
    return {
        add: function (message) {
            var contextualizedMessage = withContext(message);
            primaryBatch.add(contextualizedMessage);
            if (replicaBatch) {
                replicaBatch.add(contextualizedMessage);
            }
        },
    };
}
function resetInternalMonitoring() {
    monitoringConfiguration.batch = undefined;
}
exports.resetInternalMonitoring = resetInternalMonitoring;
function monitored(_, __, descriptor) {
    var originalMethod = descriptor.value;
    descriptor.value = function () {
        var decorated = (monitoringConfiguration.batch ? monitor(originalMethod) : originalMethod);
        return decorated.apply(this, arguments);
    };
}
exports.monitored = monitored;
function monitor(fn) {
    return function () {
        try {
            return fn.apply(this, arguments);
        }
        catch (e) {
            logErrorIfDebug(e);
            try {
                addErrorToMonitoringBatch(e);
            }
            catch (e) {
                logErrorIfDebug(e);
            }
        }
    }; // consider output type has input type
}
exports.monitor = monitor;
function addMonitoringMessage(message, context) {
    logMessageIfDebug(message);
    addToMonitoringBatch(tslib_1.__assign(tslib_1.__assign({ message: message }, context), { status: StatusType.info }));
}
exports.addMonitoringMessage = addMonitoringMessage;
function addErrorToMonitoringBatch(e) {
    addToMonitoringBatch(tslib_1.__assign(tslib_1.__assign({}, formatError(e)), { status: StatusType.error }));
}
function addToMonitoringBatch(message) {
    if (monitoringConfiguration.batch &&
        monitoringConfiguration.sentMessageCount < monitoringConfiguration.maxMessagesPerPage) {
        monitoringConfiguration.sentMessageCount += 1;
        monitoringConfiguration.batch.add(message);
    }
}
function formatError(e) {
    if (e instanceof Error) {
        var stackTrace = tracekit_1.computeStackTrace(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: error_1.toStackTraceString(stackTrace),
            },
            message: stackTrace.message,
        };
    }
    return {
        error: {
            stack: 'Not an instance of error',
        },
        message: "Uncaught " + utils.jsonStringify(e),
    };
}
function setDebugMode(debugMode) {
    monitoringConfiguration.debugMode = debugMode;
}
exports.setDebugMode = setDebugMode;
function logErrorIfDebug(e) {
    if (monitoringConfiguration.debugMode) {
        // Log as warn to not forward the logs.
        console.warn('[INTERNAL ERROR]', e);
    }
}
function logMessageIfDebug(message) {
    if (monitoringConfiguration.debugMode) {
        console.log('[MONITORING MESSAGE]', message);
    }
}
//# sourceMappingURL=internalMonitoring.js.map