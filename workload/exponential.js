"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
function exponential(urls, baseDelay, totalRequests, callback) {
    return rxjs_1.Observable
        .from(urls)
        .take(totalRequests)
        .concatMap((url, i) => (rxjs_1.Observable
        .of(url)
        .delayWhen(() => rxjs_1.Observable.timer((totalRequests - i) * baseDelay))
        .do(() => callback(url, i))
        .mapTo(i)));
}
exports.default = exponential;
