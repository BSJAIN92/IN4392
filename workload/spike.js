"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
function spike(urls, baseDelay, totalRequests, callback) {
    const TOTAL_HALF_REQUESTS = totalRequests / 2;
    return rxjs_1.Observable
        .from(urls)
        .take(totalRequests)
        .concatMap((url, i) => (rxjs_1.Observable
        .of(url)
        .delayWhen(() => rxjs_1.Observable.timer(i <= TOTAL_HALF_REQUESTS ? (TOTAL_HALF_REQUESTS - i) * baseDelay : i * baseDelay))
        .do(() => callback(url, i))
        .mapTo(i)));
}
exports.default = spike;
