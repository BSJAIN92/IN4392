import * as R from 'ramda'
import {Store, Action} from 'redux'
import {ActionsObservable, combineEpics} from 'redux-observable'
import {Observable} from 'rxjs/Observable'
import axios from 'axios'

import {ProvisionerPolicy, Instance, MasterState, InstanceAction} from './types'
import {
    requestInstance, runInstance, scheduleForTerminationInstance, startInstance, terminateInstance,
    unscheduleForTerminationInstance
} from './instances'
import {pickFreeInstances, pickFreeInstancesScheduledForTermination} from "./utils";

const PROVISIONER_INTERVAL = 5000
const PROVISIONER_DEBOUNCE = 1000
const HEALTH_CHECK_INTERVAL = 1000
const INSTANCE_READY_TIMEOUT = 60 * 1000
const TERMINATION_WAIT_TIME = 20 * 1000

interface CloudProvider {
    startInstance: () => Promise<Instance>,
    terminateInstance: (i: Instance) => Promise<void>
}

const healthCheck = (i: Instance) => (
    Observable
        .interval(HEALTH_CHECK_INTERVAL)
        .flatMap(() => (
            Observable.fromPromise(axios.get(`http://${i.ipAddress}:3001/health`))
                .map((r) => r.data)
                .catch((e) => Observable.of('NOT_YET_READY'))
        ))
        .filter((d) => d !== 'NOT_YET_READY')
        .take(1)
        .timeout(INSTANCE_READY_TIMEOUT)
        .mapTo(i)
)

export default function createProvisioner<S extends MasterState>(policy: ProvisionerPolicy, cloudProvider: CloudProvider) {
    const provisionerPoll = Observable.interval(PROVISIONER_INTERVAL).startWith(0)
    const provisionerKickStart = Observable.of(0).delay(PROVISIONER_INTERVAL * 0.5)

    const provisionerBootstrapEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        action$
            .ofType('BOOTSTRAP')
            .switchMapTo(Observable.of(requestInstance()).repeat(policy.minVMs))
            .take(policy.minVMs)
    )

    const queueThresholdProvisioningPolicyEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        Observable.merge(action$.filter((a: Action) => a.type.endsWith('TASK')).debounceTime(PROVISIONER_DEBOUNCE), provisionerKickStart)
            .switchMap(() => provisionerPoll)
            // .do(() => console.log('------> PROVISIONER is running'))
            .flatMap(() => {
                const state = store.getState() as S
                const pendingQueueLength = R.toPairs(state.taskQueue.pending).length

                const allRunningInstances = R.compose(
                    R.map(([id, instance]) => ({...instance, id})),
                    R.toPairs
                )(state.instances.running) as Instance[]

                const allStartingInstances = R.compose(
                    R.map(([id, instance]) => ({...instance, id})),
                    R.toPairs
                )(state.instances.starting) as Instance[]

                const instancesScheduledForTermination = R.filter(((i) => i.scheduledForTermination || false), allRunningInstances)

                const allInstancesLength = allRunningInstances.length + allStartingInstances.length

                const freeInstances = pickFreeInstances(state)
                const terminationScheduleActions = Observable.of(...freeInstances).take(1).map(scheduleForTerminationInstance)

                if ((pendingQueueLength > policy.taskQueueThreshold ||
                    (pendingQueueLength > 0 && allInstancesLength === 0)) &&
                    allInstancesLength < policy.maxVMs) {
                    // Request for a new instance only if the starting instances is 0 or scheduled for termination is 0
                    if (instancesScheduledForTermination.length > 0) {
                        return terminationScheduleActions.concat(Observable.of(unscheduleForTerminationInstance(instancesScheduledForTermination[0])))
                    }

                    if (allStartingInstances.length === 0) {
                        return terminationScheduleActions.concat(Observable.of(requestInstance()))
                    }
                }

                return terminationScheduleActions
            })
    )

    const requestInstanceEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        action$
            .ofType('REQUEST_INSTANCE')
            .do(() => console.log('requesting instance'))
            .flatMap(() => {
                const state = store.getState() as S
                // Try to recover an existing instance scheduled for termination
                const instancesToTerminate = pickFreeInstancesScheduledForTermination(state)

                if (instancesToTerminate.length > 0) {
                    return Observable.of(...instancesToTerminate).take(1).map(unscheduleForTerminationInstance)
                }

                return Observable
                    .fromPromise(cloudProvider.startInstance())
                    .map(startInstance)
            })
    )

    const instanceStartEpic = (action$: ActionsObservable<InstanceAction>, store: Store<S>) => (
        action$
            .ofType('START_INSTANCE')
            .map((action: InstanceAction) => action.payload)
            .flatMap((instance) => (
                healthCheck(instance)
                    .map(runInstance)
                    .catch(() => Observable.of(terminateInstance(instance)))
            ))
    )

    const instanceTerminateSchedulerEpic = (action$: ActionsObservable<InstanceAction>, store: Store<S>) => (
        action$
            .ofType('SCHEDULE_FOR_TERMINATION_INSTANCE')
            .map((action: InstanceAction) => action.payload)
            .flatMap((instance: Instance) => {
                // Do not schedule the last instance for termination if pending queue is not empty
                const state = store.getState()
                const runningInstances = R.toPairs(state.instances.running)
                const pendingTasksLength = R.toPairs(state.taskQueue.pending).length

                const shouldTerminate = !(runningInstances.length === 1 && pendingTasksLength > 0)
                console.log('=======> should terminate: ', shouldTerminate)

                if (shouldTerminate) {
                    return Observable
                        .of(instance)
                        .delay(TERMINATION_WAIT_TIME)
                        .takeUntil(
                            action$
                                .ofType('UNSCHEDULE_FOR_TERMINATION_INSTANCE')
                                .map((a: InstanceAction) => a.payload)
                                .filter((i: Instance) => instance.id === i.id)
                        )
                        .map((i: Instance) => terminateInstance(i))
                } else {
                    return Observable.of(unscheduleForTerminationInstance(instance))
                }
            })
    )

    const instanceTerminateEpic = (action$: ActionsObservable<InstanceAction>, store: Store<S>) => (
        action$
            .ofType('TERMINATE_INSTANCE')
            .map((action: InstanceAction) => action.payload)
            .flatMap((instance: Instance) => Observable.fromPromise(cloudProvider.terminateInstance(instance)))
            .mapTo({type: 'NULL'})
    )

    const terminateAllInstancesEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        action$
            .ofType('TERMINATE_ALL_INSTANCES')
            .switchMap(() => {
                const state = store.getState()
                const allRunningInstances = R.compose(
                    R.map(([id, instance]) => ({...instance, id})),
                    R.toPairs
                )(state.instances.running) as Instance[]

                return Observable.of(...allRunningInstances).map((i: Instance) => terminateInstance(i))
            })
    )

    return combineEpics(
        provisionerBootstrapEpic,
        queueThresholdProvisioningPolicyEpic,
        requestInstanceEpic,
        instanceStartEpic,
        instanceTerminateSchedulerEpic,
        instanceTerminateEpic,
        terminateAllInstancesEpic
    )
}
