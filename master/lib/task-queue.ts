import * as R from 'ramda'
import * as moment from 'moment'
import * as uuid from 'uuid/v4'

import {Task, TaskQueueAction, TaskQueueState} from './types'

const INIT_STATE: TaskQueueState = {
    pending: {},
    active: {}
}

// Reducer
export default function taskQueue(state = INIT_STATE, {type, payload}: TaskQueueAction): TaskQueueState {
    switch (type) {
        case 'ADD_TASK': {
            return R.assocPath(
                ['pending', payload.id],
                R.dissoc('id', payload)
            )(state) as TaskQueueState
        }

        case 'EXECUTE_TASK': {
            return R.compose(
                R.assocPath(['active', payload.id], R.dissoc('id', payload)),
                R.dissocPath(['pending', payload.id])
            )(state) as TaskQueueState
        }

        case 'FINISH_TASK': {
            return R.dissocPath(
                ['active', payload.id]
            )(state) as TaskQueueState
        }

        case 'FAIL_TASK': {
            return R.compose(
                R.assocPath(['pending', payload.id], R.dissoc('id', payload)),
                R.dissocPath(['active', payload.id])
            )(state) as TaskQueueState
        }

        case 'TERMINATE_TASK': {
            return R.compose(
                R.dissocPath(['pending', payload.id]),
                R.dissocPath(['active', payload.id])
            )(state) as TaskQueueState
        }

        default:
            return state
    }
}

// Action creators
export function addTask(args: {}): TaskQueueAction {
    return {
        type: 'ADD_TASK',
        payload: {
            id: uuid(),
            args,
            arrivalTime: moment(),
            retries: -1
        }
    }
}

export function executeTask(task: Task, instanceId: string): TaskQueueAction {
    return {
        type: 'EXECUTE_TASK',
        payload: {
            ...task,
            executeStartTime: moment(),
            retries: task.retries + 1,
            instanceId
        }
    }
}

export function finishTask(task: Task): TaskQueueAction {
    console.log('----> Finishing task: ', task.id, ' at: ', moment())
    return {
        type: 'FINISH_TASK',
        payload: {
            ...task,
            finishTime: moment()
        }
    }
}

export function failTask(task: Task): TaskQueueAction {
    return {
        type: 'FAIL_TASK',
        payload: R.dissoc('finishTime', task)
    }
}

export function terminateTask(task: Task): TaskQueueAction {
    return {
        type: 'TERMINATE_TASK',
        payload: R.assoc('failed', true, task)
    }
}

// Util functions
export function pickPendingTasks(state: TaskQueueState, count: number): Task[] {
    const taskPairs = R.toPairs(state.pending)

    const earliestArrivedTasks = R.compose(
        R.take(count),
        R.sortWith([R.ascend((t: Task) => t.arrivalTime.valueOf())]),
        R.map(([id, task]) => ({...task, id}))
    )(taskPairs)

    return earliestArrivedTasks as Task[]
}