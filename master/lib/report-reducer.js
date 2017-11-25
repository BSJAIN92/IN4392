"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const INIT_STATE = {
    finishedTasks: [],
    terminatedInstances: []
};
function reportReducer(state = INIT_STATE, action) {
    switch (action.type) {
        case 'REPORT_FINISHED_TASK': {
            return R.assoc('finishedTasks', R.append(action.payload, state.finishedTasks), state);
        }
        case 'REPORT_TERMINATED_INSTANCE': {
            return R.assoc('terminatedInstances', R.append(action.payload, state.terminatedInstances), state);
        }
        default:
            return state;
    }
}
exports.default = reportReducer;
