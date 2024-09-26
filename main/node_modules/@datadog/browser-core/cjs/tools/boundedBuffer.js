"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DEFAULT_LIMIT = 10000;
var BoundedBuffer = /** @class */ (function () {
    function BoundedBuffer(limit) {
        if (limit === void 0) { limit = DEFAULT_LIMIT; }
        this.limit = limit;
        this.buffer = [];
    }
    BoundedBuffer.prototype.add = function (item) {
        var length = this.buffer.push(item);
        if (length > this.limit) {
            this.buffer.splice(0, 1);
        }
    };
    BoundedBuffer.prototype.drain = function (fn) {
        this.buffer.forEach(function (item) { return fn(item); });
        this.buffer.length = 0;
    };
    return BoundedBuffer;
}());
exports.BoundedBuffer = BoundedBuffer;
//# sourceMappingURL=boundedBuffer.js.map