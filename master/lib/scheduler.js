"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_observable_1 = require("redux-observable");
const Observable_1 = require("rxjs/Observable");
const axios_1 = require("axios");
const utils_1 = require("./utils");
const task_queue_1 = require("./task-queue");
const SCHEDULER_INTERVAL = 5000;
const SCHEDULER_DEBOUNCE = 1000;
const TASK_TIMEOUT = 25 * 1000;
function createScheduler(policy) {
    const schedulerPoll = Observable_1.Observable.interval(SCHEDULER_INTERVAL).startWith(0);
    const schedulerKickStart = Observable_1.Observable.of(0).delay(SCHEDULER_INTERVAL * 0.5);
    const allocatorEpic = (action$, store) => (Observable_1.Observable.merge(action$.ofType('ADD_TASK').debounceTime(SCHEDULER_DEBOUNCE), schedulerKickStart)
        .switchMap(() => schedulerPoll)
        .switchMap(() => {
        const state = store.getState();
        const freeInstances = utils_1.pickFreeInstances(state);
        if (freeInstances.length > 0) {
            const pendingTasks = task_queue_1.pickPendingTasks(state.taskQueue, freeInstances.length);
            return Observable_1.Observable
                .zip(Observable_1.Observable.from(freeInstances), Observable_1.Observable.from(pendingTasks))
                .map(([fi, pt]) => task_queue_1.executeTask(pt, fi.id));
        }
        return Observable_1.Observable.of({ type: 'NULL' });
    }));
    const executorEpic = (action$, store) => (action$
        .ofType('EXECUTE_TASK')
        .flatMap((action) => {
        // console.log('---> Executing task \n', action.payload)
        const state = store.getState();
        const task = action.payload;
        if (task.retries >= policy.maxRetries) {
            return Observable_1.Observable.of(task_queue_1.terminateTask(task));
        }
        if (task.instanceId) {
            const instance = state.instances.running[task.instanceId];
            return Observable_1.Observable
                .fromPromise(axios_1.default.post(`http://${instance.ipAddress}:3000/process`, task.args))
                .timeout(TASK_TIMEOUT)
                .map(() => task_queue_1.finishTask(task))
                .catch((e) => {
                console.log('---> Task fail error ', e);
                return Observable_1.Observable.of(task_queue_1.failTask(task));
            });
        }
        return Observable_1.Observable.of(task_queue_1.failTask(task));
    }));
    return redux_observable_1.combineEpics(allocatorEpic, executorEpic);
}
exports.default = createScheduler;
