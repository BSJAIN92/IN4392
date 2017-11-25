"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
function getRunningInstances(state, includeScheduledForTermination = false) {
    const runningInstances = R.toPairs(state.instances.running).map(([id, instance]) => (Object.assign({}, instance, { id })));
    return includeScheduledForTermination ? runningInstances : runningInstances.filter((i) => !(i.scheduledForTermination || false));
}
exports.getRunningInstances = getRunningInstances;
function getActiveTasks(state) {
    return R.compose(R.map(([id, task]) => (Object.assign({}, task, { id }))), R.toPairs)(state.taskQueue.active);
}
exports.getActiveTasks = getActiveTasks;
function pickFreeInstances(state) {
    const runningInstances = getRunningInstances(state);
    const activeTasks = getActiveTasks(state);
    return R.reject((i) => R.any((t) => t.instanceId === i.id)(activeTasks))(runningInstances);
}
exports.pickFreeInstances = pickFreeInstances;
function pickFreeInstancesScheduledForTermination(state) {
    const runningInstances = getRunningInstances(state, true);
    const runningInstancesForTermination = R.filter((i) => i.scheduledForTermination || false, runningInstances);
    const activeTasks = getActiveTasks(state);
    return R.reject((i) => R.any((t) => t.instanceId === i.id)(activeTasks))(runningInstancesForTermination);
}
exports.pickFreeInstancesScheduledForTermination = pickFreeInstancesScheduledForTermination;
