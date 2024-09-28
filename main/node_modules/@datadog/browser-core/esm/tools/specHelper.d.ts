import { Configuration } from '../domain/configuration';
export declare const SPEC_ENDPOINTS: Partial<Configuration>;
export declare function isSafari(): boolean;
export declare function isFirefox(): boolean;
export declare function isIE(): boolean;
export declare function clearAllCookies(): void;
export interface FetchStubManager {
    reset: () => void;
    whenAllComplete: (callback: () => void) => void;
}
export declare function stubFetch(): FetchStubManager;
export interface ResponseStub extends Partial<Response> {
    responseText?: string;
    responseTextError?: Error;
}
export declare type FetchStub = (input: RequestInfo, init?: RequestInit) => FetchStubPromise;
export interface FetchStubPromise extends Promise<Response> {
    resolveWith: (response: ResponseStub) => Promise<ResponseStub>;
    rejectWith: (error: Error) => Promise<Error>;
}
declare class StubXhr {
    response: string | undefined;
    status: number | undefined;
    readyState: number;
    onreadystatechange: () => void;
    private fakeEventTarget;
    constructor();
    open(method: string, url: string): void;
    send(): void;
    abort(): void;
    complete(status: number, response?: string): void;
    addEventListener(name: string, callback: () => void): void;
    private dispatchEvent;
}
export declare function createNewEvent(eventName: string, properties?: {
    [name: string]: unknown;
}): Event;
export declare function stubXhr(): {
    reset(): void;
};
export declare function withXhr({ setup, onComplete, }: {
    setup: (xhr: StubXhr) => void;
    onComplete: (xhr: XMLHttpRequest) => void;
}): void;
export declare function setPageVisibility(visibility: 'visible' | 'hidden'): void;
export declare function restorePageVisibility(): void;
export {};
