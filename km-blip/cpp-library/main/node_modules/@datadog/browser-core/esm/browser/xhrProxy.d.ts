export interface XhrProxy<StartContext extends XhrStartContext = XhrStartContext, CompleteContext extends XhrCompleteContext = XhrCompleteContext> {
    beforeSend: (callback: (context: StartContext, xhr: XMLHttpRequest) => void) => void;
    onRequestComplete: (callback: (context: CompleteContext) => void) => void;
}
export interface XhrStartContext {
    method: string;
    url: string;
    startTime: number;
    /**
     * allow clients to enhance the context
     */
    [key: string]: unknown;
}
export interface XhrCompleteContext extends XhrStartContext {
    duration: number;
    status: number;
    response: string | undefined;
}
export declare function startXhrProxy<StartContext extends XhrStartContext = XhrStartContext, CompleteContext extends XhrCompleteContext = XhrCompleteContext>(): XhrProxy<StartContext, CompleteContext>;
export declare function resetXhrProxy(): void;
