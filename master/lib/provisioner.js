"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const redux_observable_1 = require("redux-observable");
const Observable_1 = require("rxjs/Observable");
const axios_1 = require("axios");
const instances_1 = require("./instances");
const utils_1 = require("./utils");
const PROVISIONER_INTERVAL = 5000;
const PROVISIONER_DEBOUNCE = 1000;
const HEALTH_CHECK_INTERVAL = 1000;
const INSTANCE_READY_TIMEOUT = 60 * 1000;
const TERMINATION_WAIT_TIME = 30 * 1000;
const healthCheck = (i) => (Observable_1.Observable
    .interval(HEALTH_CHECK_INTERVAL)
    .flatMap(() => (Observable_1.Observable.fromPromise(axios_1.default.get(`http://${i.ipAddress}:3001/health`))
    .map((r) => r.data)
    .catch((e) => Observable_1.Observable.of('NOT_YET_READY'))))
    .filter((d) => d !== 'NOT_YET_READY')
    .take(1)
    .timeout(INSTANCE_READY_TIMEOUT)
    .mapTo(i));
function createProvisioner(policy, cloudProvider) {
    const provisionerPoll = Observable_1.Observable.interval(PROVISIONER_INTERVAL).startWith(0);
    const provisionerKickStart = Observable_1.Observable.of(0).delay(PROVISIONER_INTERVAL * 0.5);
    const provisionerBootstrapEpic = (action$, store) => (action$
        .ofType('BOOTSTRAP')
        .switchMapTo(Observable_1.Observable.of(instances_1.requestInstance()).repeat(policy.minVMs))
        .take(policy.minVMs));
    const queueThresholdProvisioningPolicyEpic = (action$, store) => (Observable_1.Observable.merge(action$.filter((a) => a.type.endsWith('TASK')).debounceTime(PROVISIONER_DEBOUNCE), provisionerKickStart)
        .switchMap(() => provisionerPoll)
        .flatMap(() => {
        const state = store.getState();
        const pendingQueueLength = R.toPairs(state.taskQueue.pending).length;
        const allRunningInstances = R.compose(R.map(([id, instance]) => (Object.assign({}, instance, { id }))), R.toPairs)(state.instances.running);
        const allStartingInstances = R.compose(R.map(([id, instance]) => (Object.assign({}, instance, { id }))), R.toPairs)(state.instances.starting);
        const allInstancesLength = allRunningInstances.length + allStartingInstances.length;
        const freeInstances = utils_1.pickFreeInstances(state);
        const terminationScheduleActions = Observable_1.Observable.of(...freeInstances).take(1).map(instances_1.scheduleForTerminationInstance);
        if ((pendingQueueLength > policy.taskQueueThreshold ||
            (pendingQueueLength > 0 && allInstancesLength === 0)) &&
            allInstancesLength < policy.maxVMs) {
            return terminationScheduleActions.concat(Observable_1.Observable.of(instances_1.requestInstance()));
        }
        return terminationScheduleActions;
    }));
    const requestInstanceEpic = (action$, store) => (action$
        .ofType('REQUEST_INSTANCE')
        .do(() => console.log('requesting instance'))
        .flatMap(() => {
        const state = store.getState();
        // Try to recover an existing instance scheduled for termination
        const instancesToTerminate = utils_1.pickFreeInstancesScheduledForTermination(state);
        if (instancesToTerminate.length > 0) {
            return Observable_1.Observable.of(...instancesToTerminate).take(1).map(instances_1.unscheduleForTerminationInstance);
        }
        return Observable_1.Observable
            .fromPromise(cloudProvider.startInstance())
            .map(instances_1.startInstance);
    }));
    const instanceStartEpic = (action$, store) => (action$
        .ofType('START_INSTANCE')
        .map((action) => action.payload)
        .flatMap((instance) => (healthCheck(instance)
        .map(instances_1.runInstance)
        .catch(() => Observable_1.Observable.of(instances_1.terminateInstance(instance))))));
    const instanceTerminateSchedulerEpic = (action$, store) => (action$
        .ofType('SCHEDULE_FOR_TERMINATION_INSTANCE')
        .map((action) => action.payload)
        .flatMap((instance) => {
        // Do not schedule the last instance for termination if pending queue is not empty
        const state = store.getState();
        const runningInstances = R.toPairs(state.instances.running);
        const pendingTasksLength = R.toPairs(state.taskQueue.pending).length;
        const shouldTerminate = !(runningInstances.length === 1 && pendingTasksLength > 0);
        console.log('=======> should terminate: ', shouldTerminate);
        if (shouldTerminate) {
            return Observable_1.Observable
                .of(instance)
                .delay(TERMINATION_WAIT_TIME)
                .takeUntil(action$
                .ofType('UNSCHEDULE_FOR_TERMINATION_INSTANCE')
                .map((a) => a.payload)
                .filter((i) => instance.id === i.id))
                .map((i) => instances_1.terminateInstance(i));
        }
        else {
            return Observable_1.Observable.of(instances_1.unscheduleForTerminationInstance(instance));
        }
    }));
    const instanceTerminateEpic = (action$, store) => (action$
        .ofType('TERMINATE_INSTANCE')
        .map((action) => action.payload)
        .flatMap((instance) => Observable_1.Observable.fromPromise(cloudProvider.terminateInstance(instance)))
        .mapTo({ type: 'NULL' }));
    const terminateAllInstancesEpic = (action$, store) => (action$
        .ofType('TERMINATE_ALL_INSTANCES')
        .switchMap(() => {
        const state = store.getState();
        const allRunningInstances = R.compose(R.map(([id, instance]) => (Object.assign({}, instance, { id }))), R.toPairs)(state.instances.running);
        return Observable_1.Observable.of(...allRunningInstances).map((i) => instances_1.terminateInstance(i));
    }));
    return redux_observable_1.combineEpics(provisionerBootstrapEpic, queueThresholdProvisioningPolicyEpic, requestInstanceEpic, instanceStartEpic, instanceTerminateSchedulerEpic, instanceTerminateEpic, terminateAllInstancesEpic);
}
exports.default = createProvisioner;
