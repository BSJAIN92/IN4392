"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const moment = require("moment");
const axios_1 = require("axios");
const HEALTH_CHECK_INTERVAL = 2500;
const HEALTH_TIMEOUT = 20 * 1000;
const instance = {
    id: 'i-0da160f09e58bb31c',
    ipAddress: '34.203.215.148',
    startTime: moment()
};
const healthCheck = (i) => (rxjs_1.Observable
    .interval(HEALTH_CHECK_INTERVAL)
    .flatMap(() => (rxjs_1.Observable.fromPromise(axios_1.default.get(`http://${i.ipAddress}:3001/health`))
    .map((r) => r.data)
    .catch((e) => rxjs_1.Observable.of('NOT_YET_READY'))))
    .filter((d) => d !== 'NOT_YET_READY')
    .take(1)
    .timeout(HEALTH_TIMEOUT));
healthCheck(instance)
    .subscribe(() => {
    console.log('-----> INSTANCE IS READY ------>');
});
