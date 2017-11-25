"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const moment = require("moment");
const INIT_STATE = {
    starting: {},
    running: {}
};
function instances(state = INIT_STATE, { type, payload }) {
    switch (type) {
        case 'START_INSTANCE': {
            return R.assocPath(['starting', payload.id], R.dissoc('id', payload))(state);
        }
        case 'RUN_INSTANCE':
            return R.compose(R.assocPath(['running', payload.id], R.dissoc('id', payload)), R.dissocPath(['starting', payload.id]))(state);
        case 'SCHEDULE_FOR_TERMINATION_INSTANCE': {
            if (state.running[payload.id]) {
                return R.assocPath(['running', payload.id, 'scheduledForTermination'], true, state);
            }
            return state;
        }
        case 'UNSCHEDULE_FOR_TERMINATION_INSTANCE': {
            console.log(`unscheduling ${payload.id} out of termination`);
            if (state.running[payload.id]) {
                return R.assocPath(['running', payload.id, 'scheduledForTermination'], false, state);
            }
            return state;
        }
        case 'TERMINATE_INSTANCE':
            return R.compose(R.dissocPath(['starting', payload.id]), R.dissocPath(['running', payload.id]))(state);
        default:
            return state;
    }
}
exports.default = instances;
// Action creators
function requestInstance() {
    console.log('request instance action created');
    return {
        type: 'REQUEST_INSTANCE'
    };
}
exports.requestInstance = requestInstance;
function startInstance(instance) {
    return {
        type: 'START_INSTANCE',
        payload: instance
    };
}
exports.startInstance = startInstance;
function runInstance(instance) {
    return {
        type: 'RUN_INSTANCE',
        payload: Object.assign({}, instance, { readyTime: moment() })
    };
}
exports.runInstance = runInstance;
function scheduleForTerminationInstance(instance) {
    return {
        type: 'SCHEDULE_FOR_TERMINATION_INSTANCE',
        payload: instance
    };
}
exports.scheduleForTerminationInstance = scheduleForTerminationInstance;
function unscheduleForTerminationInstance(instance) {
    return {
        type: 'UNSCHEDULE_FOR_TERMINATION_INSTANCE',
        payload: instance
    };
}
exports.unscheduleForTerminationInstance = unscheduleForTerminationInstance;
function terminateInstance(instance, normalTermination = true) {
    return {
        type: 'TERMINATE_INSTANCE',
        payload: Object.assign({}, instance, { terminatedTime: moment(), normalTermination })
    };
}
exports.terminateInstance = terminateInstance;
