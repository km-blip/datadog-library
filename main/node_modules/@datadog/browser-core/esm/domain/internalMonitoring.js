import { __assign } from "tslib";
// tslint:disable ban-types
import { combine } from '../tools/context';
import { toStackTraceString } from '../tools/error';
import * as utils from '../tools/utils';
import { Batch, HttpRequest } from '../transport/transport';
import { computeStackTrace } from './tracekit';
var StatusType;
(function (StatusType) {
    StatusType["info"] = "info";
    StatusType["error"] = "error";
})(StatusType || (StatusType = {}));
var monitoringConfiguration = { maxMessagesPerPage: 0, sentMessageCount: 0 };
var externalContextProvider;
export function startInternalMonitoring(configuration) {
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
function startMonitoringBatch(configuration) {
    var primaryBatch = createMonitoringBatch(configuration.internalMonitoringEndpoint);
    var replicaBatch;
    if (configuration.replica !== undefined) {
        replicaBatch = createMonitoringBatch(configuration.replica.internalMonitoringEndpoint);
    }
    function createMonitoringBatch(endpointUrl) {
        return new Batch(new HttpRequest(endpointUrl, configuration.batchBytesLimit), configuration.maxBatchSize, configuration.batchBytesLimit, configuration.maxMessageSize, configuration.flushTimeout);
    }
    function withContext(message) {
        return combine({
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
export function resetInternalMonitoring() {
    monitoringConfiguration.batch = undefined;
}
export function monitored(_, __, descriptor) {
    var originalMethod = descriptor.value;
    descriptor.value = function () {
        var decorated = (monitoringConfiguration.batch ? monitor(originalMethod) : originalMethod);
        return decorated.apply(this, arguments);
    };
}
export function monitor(fn) {
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
export function addMonitoringMessage(message, context) {
    logMessageIfDebug(message);
    addToMonitoringBatch(__assign(__assign({ message: message }, context), { status: StatusType.info }));
}
function addErrorToMonitoringBatch(e) {
    addToMonitoringBatch(__assign(__assign({}, formatError(e)), { status: StatusType.error }));
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
        var stackTrace = computeStackTrace(e);
        return {
            error: {
                kind: stackTrace.name,
                stack: toStackTraceString(stackTrace),
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
export function setDebugMode(debugMode) {
    monitoringConfiguration.debugMode = debugMode;
}
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