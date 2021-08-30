export declare class BoundedBuffer<T> {
    private limit;
    private buffer;
    constructor(limit?: number);
    add(item: T): void;
    drain(fn: (item: T) => void): void;
}
