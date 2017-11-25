import 'rxjs'
import {Observable} from 'rxjs'
import {createStore, combineReducers, applyMiddleware, Store, Action} from 'redux'
import {createEpicMiddleware, combineEpics, ActionsObservable} from 'redux-observable'
import * as moment from 'moment'
import * as R from 'ramda'

import {MasterState, ReportState} from './lib/types'
import * as awsProvider from './lib/aws-provider'
import * as localProvider from './lib/local-mock-provider'

import taskQueue, {addTask} from './lib/task-queue'
import createAppServer from './lib/app-server'
import createScheduler from './lib/scheduler'
import instances from './lib/instances'
import createProvisioner from './lib/provisioner'
import reportReducer from './lib/report-reducer'
import createReporter from './lib/reporter'

const START_TIME = moment()

const APP_PORT = parseInt(process.env.PORT || '8000', 10)
const POLICY = {
    maxRetries: parseInt(process.env.POLICY_MAXRETRIES || '5', 10),
    minVMs: parseInt(process.env.POLICY_MINVMS || '0', 10),
    maxVMs: parseInt(process.env.POLICY_MAXVMS || '5', 10),
    taskQueueThreshold: parseInt(process.env.POLICY_THRESHOLD || '5', 10)
}

const PROVISIONER_POLICY = {
    minVMs: POLICY.minVMs,
    maxVMs: POLICY.maxVMs,
    taskQueueThreshold: POLICY.taskQueueThreshold
}

const SCHEDULER_POLICY = {
    maxRetries: POLICY.maxRetries
}

const reportStore = createStore(reportReducer)

const provider = (process.env.PROVIDER || '').toLowerCase() === 'local' ? {
    startInstance: localProvider.startInstance,
    terminateInstance: localProvider.terminateInstance
} : {
    startInstance: awsProvider.startInstance,
    terminateInstance: awsProvider.terminateInstance
}

const loggerEpic = (action$: ActionsObservable<Action>) => (
    action$
        .do((a: Action) => console.log('--> Action: ', a))
        .switchMapTo(Observable.from([]))
)

const rootEpic = combineEpics(
    createScheduler(SCHEDULER_POLICY),
    createProvisioner(PROVISIONER_POLICY, provider),
    createReporter(reportStore as Store<ReportState>),
    // loggerEpic
)

const epicMiddleware = createEpicMiddleware(rootEpic)

const rootReducer = combineReducers({
    taskQueue,
    instances
})

const store = createStore(rootReducer, applyMiddleware(epicMiddleware))

if (store) {
    const appServer = createAppServer({
        getState: (summarized: boolean) => {
            const state = store.getState() as MasterState
            if (!summarized) {
                return state
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
            }
        },
        getReport: () => reportStore.getState() as ReportState,
        getUptime: () => moment().valueOf() - START_TIME.valueOf(),
        addTask: (args) => store.dispatch(addTask(args)),
        terminateAll: () => store.dispatch({type: 'TERMINATE_ALL_INSTANCES'})
    })

    const server = appServer.listen(APP_PORT, () => {
        console.log('App server listening on port: ', APP_PORT)
    })

    store.dispatch({type: 'BOOTSTRAP'})

    const cleanup = () => {
        store.dispatch({type: 'TERMINATE_ALL_INSTANCES'})
        server.close(() => {
            setTimeout(() => process.exit(0), 1000)
        })
    }

    process.on('SIGTERM', cleanup)
    process.on('SIGINT', cleanup)
}