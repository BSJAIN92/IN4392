"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const moment = require("moment");
const uuid = require("uuid/v4");
const INIT_STATE = {
    pending: {},
    active: {}
};
// Reducer
function taskQueue(state = INIT_STATE, { type, payload }) {
    switch (type) {
        case 'ADD_TASK': {
            return R.assocPath(['pending', payload.id], R.dissoc('id', payload))(state);
        }
        case 'EXECUTE_TASK': {
            return R.compose(R.assocPath(['active', payload.id], R.dissoc('id', payload)), R.dissocPath(['pending', payload.id]))(state);
        }
        case 'FINISH_TASK': {
            return R.dissocPath(['active', payload.id])(state);
        }
        case 'FAIL_TASK': {
            return R.compose(R.assocPath(['pending', payload.id], R.dissoc('id', payload)), R.dissocPath(['active', payload.id]))(state);
        }
        case 'TERMINATE_TASK': {
            return R.compose(R.dissocPath(['pending', payload.id]), R.dissocPath(['active', payload.id]))(state);
        }
        default:
            return state;
    }
}
exports.default = taskQueue;
// Action creators
function addTask(args) {
    return {
        type: 'ADD_TASK',
        payload: {
            id: uuid(),
            args,
            arrivalTime: moment(),
            retries: -1
        }
    };
}
exports.addTask = addTask;
function executeTask(task, instanceId) {
    return {
        type: 'EXECUTE_TASK',
        payload: Object.assign({}, task, { executeStartTime: moment(), retries: task.retries + 1, instanceId })
    };
}
exports.executeTask = executeTask;
function finishTask(task) {
    console.log('----> Finishing task: ', task.id, ' at: ', moment());
    return {
        type: 'FINISH_TASK',
        payload: Object.assign({}, task, { finishTime: moment() })
    };
}
exports.finishTask = finishTask;
function failTask(task) {
    return {
        type: 'FAIL_TASK',
        payload: R.dissoc('finishTime', task)
    };
}
exports.failTask = failTask;
function terminateTask(task) {
    return {
        type: 'TERMINATE_TASK',
        payload: R.assoc('failed', true, task)
    };
}
exports.terminateTask = terminateTask;
// Util functions
function pickPendingTasks(state, count) {
    const taskPairs = R.toPairs(state.pending);
    const earliestArrivedTasks = R.compose(R.take(count), R.sortWith([R.ascend((t) => t.arrivalTime.valueOf())]), R.map(([id, task]) => (Object.assign({}, task, { id }))))(taskPairs);
    return earliestArrivedTasks;
}
exports.pickPendingTasks = pickPendingTasks;
