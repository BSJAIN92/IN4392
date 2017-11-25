"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const redux_observable_1 = require("redux-observable");
function createReporter(reportStore) {
    const taskReportingEpic = (action$, store) => (rxjs_1.Observable.merge(action$.ofType('FINISH_TASK'), action$.ofType('TERMINATE_TASK'))
        .do((action) => reportStore.dispatch({ type: 'REPORT_FINISHED_TASK', payload: action.payload }))
        .mapTo({ type: 'NULL' }));
    const instanceReportingEpic = (action$, store) => (action$
        .ofType('TERMINATE_INSTANCE')
        .do((action) => reportStore.dispatch({ type: 'REPORT_TERMINATED_INSTANCE', payload: action.payload }))
        .mapTo({ type: 'NULL' }));
    return redux_observable_1.combineEpics(taskReportingEpic, instanceReportingEpic);
}
exports.default = createReporter;
