import {Observable} from 'rxjs'
import {Store, Action} from 'redux'
import {ActionsObservable, combineEpics} from 'redux-observable'
import {MasterState, ReportState, ReportAction, TaskQueueAction, InstanceAction} from './types'

export default function createReporter<S extends MasterState>(reportStore: Store<ReportState>) {
    const taskReportingEpic = (action$: ActionsObservable<TaskQueueAction>, store: Store<S>) => (
        Observable.merge(action$.ofType('FINISH_TASK'), action$.ofType('TERMINATE_TASK'))
            .do((action) => reportStore.dispatch({type: 'REPORT_FINISHED_TASK', payload: action.payload}))
            .mapTo({type: 'NULL'})
    )

    const instanceReportingEpic = (action$: ActionsObservable<InstanceAction>, store: Store<S>) => (
        action$
            .ofType('TERMINATE_INSTANCE')
            .do((action) => reportStore.dispatch({type: 'REPORT_TERMINATED_INSTANCE', payload: action.payload}))
            .mapTo({type: 'NULL'})
    )

    return combineEpics(taskReportingEpic, instanceReportingEpic)
}