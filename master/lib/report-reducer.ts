import * as R from 'ramda'
import {ReportState, ReportAction} from './types'

const INIT_STATE: ReportState = {
    finishedTasks: [],
    terminatedInstances: []
}

export default function reportReducer(state = INIT_STATE, action: ReportAction): ReportState {
    switch(action.type) {
        case 'REPORT_FINISHED_TASK': {
            return R.assoc('finishedTasks', R.append(action.payload, state.finishedTasks), state)
        }

        case 'REPORT_TERMINATED_INSTANCE': {
            return R.assoc('terminatedInstances', R.append(action.payload, state.terminatedInstances), state)
        }

        default:
            return state
    }
}