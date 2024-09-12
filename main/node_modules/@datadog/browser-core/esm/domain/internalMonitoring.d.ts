import { Context } from '../tools/context';
import { Configuration } from './configuration';
declare enum StatusType {
    info = "info",
    error = "error"
}
export interface InternalMonitoring {
    setExternalContextProvider: (provider: () => Context) => void;
}
export interface MonitoringMessage extends Context {
    message: string;
    status: StatusType;
    error?: {
        kind?: string;
        stack: string;
    };
}
export declare function startInternalMonitoring(configuration: Configuration): InternalMonitoring;
export declare function resetInternalMonitoring(): void;
export declare function monitored(_: any, __: string, descriptor: PropertyDescriptor): void;
export declare function monitor<T extends Function>(fn: T): T;
export declare function addMonitoringMessage(message: string, context?: Context): void;
export declare function setDebugMode(debugMode: boolean): void;
export {};
