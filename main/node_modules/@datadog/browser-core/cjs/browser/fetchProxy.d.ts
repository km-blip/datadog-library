export interface FetchProxy<StartContext extends FetchStartContext = FetchStartContext, CompleteContext extends FetchCompleteContext = FetchCompleteContext> {
    beforeSend: (callback: (context: StartContext) => void) => void;
    onRequestComplete: (callback: (context: CompleteContext) => void) => void;
}
export interface FetchStartContext {
    method: string;
    startTime: number;
    init?: RequestInit;
    url: string;
    /**
     * allow clients to enhance the context
     */
    [key: string]: unknown;
}
export interface FetchCompleteContext extends FetchStartContext {
    duration: number;
    status: number;
    response: string;
    responseType?: string;
}
export declare function startFetchProxy<StartContext extends FetchStartContext = FetchStartContext, CompleteContext extends FetchCompleteContext = FetchCompleteContext>(): FetchProxy<StartContext, CompleteContext>;
export declare function resetFetchProxy(): void;
