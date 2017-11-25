import {Store, Action} from 'redux'
import {ActionsObservable, combineEpics} from 'redux-observable'
import {Observable} from 'rxjs/Observable'
import axios from 'axios'

import {MasterState, Task, TaskQueueAction} from './types'
import {pickFreeInstances} from './utils'
import {executeTask, pickPendingTasks, failTask, finishTask, terminateTask} from './task-queue'

const SCHEDULER_INTERVAL = 5000
const SCHEDULER_DEBOUNCE = 1000
const TASK_TIMEOUT = 25 * 1000

interface SchedulerPolicy {
    maxRetries: number
}

export default function createScheduler<S extends MasterState>(policy: SchedulerPolicy) {
    const schedulerPoll = Observable.interval(SCHEDULER_INTERVAL).startWith(0)
    const schedulerKickStart = Observable.of(0).delay(SCHEDULER_INTERVAL * 0.5)

    const allocatorEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        Observable.merge(action$.ofType('ADD_TASK').debounceTime(SCHEDULER_DEBOUNCE), schedulerKickStart)
            .switchMap(() => schedulerPoll)
            // .do(() => console.log('---> SCHEDULER is running'))
            .switchMap(() => {
                const state = store.getState()
                const freeInstances = pickFreeInstances(state)

                if (freeInstances.length > 0) {
                    const pendingTasks = pickPendingTasks(state.taskQueue, freeInstances.length)

                    return Observable
                        .zip(Observable.from(freeInstances), Observable.from(pendingTasks))
                        .map(([fi, pt]) => executeTask(pt, fi.id))
                }

                return Observable.of({type: 'NULL'})
            })
    )

    const executorEpic = (action$: ActionsObservable<Action>, store: Store<S>) => (
        action$
            .ofType('EXECUTE_TASK')
            .flatMap((action: TaskQueueAction) => {
                // console.log('---> Executing task \n', action.payload)
                const state = store.getState() as S
                const task = action.payload as Task

                if (task.retries >= policy.maxRetries) {
                    return Observable.of(terminateTask(task))
                }

                if (task.instanceId) {
                    const instance = state.instances.running[task.instanceId]

                    return Observable
                        .fromPromise(axios.post(`http://${instance.ipAddress}:3000/process`, task.args))
                        .timeout(TASK_TIMEOUT)
                        .map(() => finishTask(task))
                        .catch((e) => {
                            console.log('---> Task fail error ', e)
                            return Observable.of(failTask(task))
                        })
                }

                return Observable.of(failTask(task))
            })
    )

    return combineEpics(
        allocatorEpic,
        executorEpic
    )
}