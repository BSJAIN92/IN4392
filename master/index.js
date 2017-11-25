"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("rxjs");
const rxjs_1 = require("rxjs");
const redux_1 = require("redux");
const redux_observable_1 = require("redux-observable");
const moment = require("moment");
const R = require("ramda");
const awsProvider = require("./lib/aws-provider");
const localProvider = require("./lib/local-mock-provider");
const task_queue_1 = require("./lib/task-queue");
const app_server_1 = require("./lib/app-server");
const scheduler_1 = require("./lib/scheduler");
const instances_1 = require("./lib/instances");
const provisioner_1 = require("./lib/provisioner");
const report_reducer_1 = require("./lib/report-reducer");
const reporter_1 = require("./lib/reporter");
const START_TIME = moment();
const APP_PORT = parseInt(process.env.PORT || '8000', 10);
const POLICY = {
    maxRetries: parseInt(process.env.POLICY_MAXRETRIES || '5', 10),
    minVMs: parseInt(process.env.POLICY_MINVMS || '0', 10),
    maxVMs: parseInt(process.env.POLICY_MAXVMS || '5', 10),
    taskQueueThreshold: parseInt(process.env.POLICY_THRESHOLD || '5', 10)
};
const PROVISIONER_POLICY = {
    minVMs: POLICY.minVMs,
    maxVMs: POLICY.maxVMs,
    taskQueueThreshold: POLICY.taskQueueThreshold
};
const SCHEDULER_POLICY = {
    maxRetries: POLICY.maxRetries
};
const reportStore = redux_1.createStore(report_reducer_1.default);
const provider = (process.env.PROVIDER || '').toLowerCase() === 'local' ? {
    startInstance: localProvider.startInstance,
    terminateInstance: localProvider.terminateInstance
} : {
    startInstance: awsProvider.startInstance,
    terminateInstance: awsProvider.terminateInstance
};
const loggerEpic = (action$) => (action$
    .do((a) => console.log('--> Action: ', a))
    .switchMapTo(rxjs_1.Observable.from([])));
const rootEpic = redux_observable_1.combineEpics(scheduler_1.default(SCHEDULER_POLICY), provisioner_1.default(PROVISIONER_POLICY, provider), reporter_1.default(reportStore));
const epicMiddleware = redux_observable_1.createEpicMiddleware(rootEpic);
const rootReducer = redux_1.combineReducers({
    taskQueue: task_queue_1.default,
    instances: instances_1.default
});
const store = redux_1.createStore(rootReducer, redux_1.applyMiddleware(epicMiddleware));
if (store) {
    const appServer = app_server_1.default({
        getState: (summarized) => {
            const state = store.getState();
            if (!summarized) {
                return state;
            }
            return {
                taskQueue: {
                    pending: R.toPairs(state.taskQueue.pending).length,
                    active: R.toPairs(state.taskQueue.active).length,
                },
                instances: {
                    starting: R.toPairs(state.instances.starting).length,
                    running: R.toPairs(state.instances.running).length,
                }
            };
        },
        getReport: () => reportStore.getState(),
        getUptime: () => moment().valueOf() - START_TIME.valueOf(),
        addTask: (args) => store.dispatch(task_queue_1.addTask(args)),
        terminateAll: () => store.dispatch({ type: 'TERMINATE_ALL_INSTANCES' })
    });
    const server = appServer.listen(APP_PORT, () => {
        console.log('App server listening on port: ', APP_PORT);
    });
    store.dispatch({ type: 'BOOTSTRAP' });
    const cleanup = () => {
        store.dispatch({ type: 'TERMINATE_ALL_INSTANCES' });
        server.close(() => {
            setTimeout(() => process.exit(0), 1000);
        });
    };
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
}
