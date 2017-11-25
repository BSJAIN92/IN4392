import * as R from 'ramda'
import * as moment from 'moment'
import {Instance, InstanceAction, InstanceRequestAction, InstanceState} from './types'
import {Action} from 'redux';

const INIT_STATE: InstanceState = {
    starting: {},
    running: {}
}

export default function instances(state = INIT_STATE, {type, payload}: InstanceAction) {
    switch (type) {
        case 'START_INSTANCE': {
            return R.assocPath(
                ['starting', payload.id],
                R.dissoc('id', payload)
            )(state) as InstanceState
        }

        case 'RUN_INSTANCE':
            return R.compose(
                R.assocPath(['running', payload.id], R.dissoc('id', payload)),
                R.dissocPath(['starting', payload.id])
            )(state) as InstanceState

        case 'SCHEDULE_FOR_TERMINATION_INSTANCE': {
            if (state.running[payload.id]) {
                return R.assocPath(
                    ['running', payload.id, 'scheduledForTermination'],
                    true,
                    state
                ) as InstanceState
            }

            return state
        }

        case 'UNSCHEDULE_FOR_TERMINATION_INSTANCE': {
            console.log(`unscheduling ${payload.id} out of termination`)
            if (state.running[payload.id]) {
                return R.assocPath(
                    ['running', payload.id, 'scheduledForTermination'],
                    false,
                    state
                ) as InstanceState
            }

            return state
        }

        case 'TERMINATE_INSTANCE':
            return R.compose(
                R.dissocPath(['starting', payload.id]),
                R.dissocPath(['running', payload.id])
            )(state) as InstanceState

        default:
            return state
    }
}

// Action creators
export function requestInstance(): Action {
    console.log('request instance action created')
    return {
        type: 'REQUEST_INSTANCE'
    }
}

export function startInstance(instance: Instance): InstanceAction {
    return {
        type: 'START_INSTANCE',
        payload: instance
    }
}

export function runInstance(instance: Instance): InstanceAction {
    return {
        type: 'RUN_INSTANCE',
        payload: {...instance, readyTime: moment()}
    }
}

export function scheduleForTerminationInstance(instance: Instance): InstanceAction {
    return {
        type: 'SCHEDULE_FOR_TERMINATION_INSTANCE',
        payload: instance
    }
}

export function unscheduleForTerminationInstance(instance: Instance): InstanceAction {
    return {
        type: 'UNSCHEDULE_FOR_TERMINATION_INSTANCE',
        payload: instance
    }
}

export function terminateInstance(instance: Instance, normalTermination = true): InstanceAction {
    return {
        type: 'TERMINATE_INSTANCE',
        payload: ({
            ...instance,
            terminatedTime: moment(),
            normalTermination
        } as Instance)
    }
}