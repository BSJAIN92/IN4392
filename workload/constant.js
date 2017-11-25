"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
function constant(urls, baseDelay, totalRequests, callback) {
    return rxjs_1.Observable.zip(rxjs_1.Observable.from(urls).take(totalRequests), rxjs_1.Observable.interval(baseDelay)).do(([url, i]) => callback(url, i))
        .map(([_, i]) => i);
}
exports.default = constant;
