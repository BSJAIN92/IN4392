import * as R from 'ramda'

import {Instance, MasterState, Task} from './types'

export function getRunningInstances(state: MasterState, includeScheduledForTermination = false): Instance[] {
    const runningInstances = R.toPairs(state.instances.running).map(([id, instance]) => ({
        ...instance,
        id
    })) as Instance[]

    return includeScheduledForTermination ? runningInstances : runningInstances.filter((i) => !(i.scheduledForTermination || false))
}

export function getActiveTasks(state: MasterState) {
    return R.compose(
        R.map(([id, task]) => ({...task, id})),
        R.toPairs
    )(state.taskQueue.active) as Task[]
}

export function pickFreeInstances(state: MasterState): Instance[] {
    const runningInstances = getRunningInstances(state)
    const activeTasks = getActiveTasks(state)

    return R.reject((i: Instance) => R.any((t: Task) => t.instanceId === i.id)(activeTasks))(runningInstances)
}

export function pickFreeInstancesScheduledForTermination(state: MasterState): Instance[] {
    const runningInstances = getRunningInstances(state, true)
    const runningInstancesForTermination = R.filter((i: Instance) => i.scheduledForTermination || false, runningInstances)
    const activeTasks = getActiveTasks(state)

    return R.reject(
        (i: Instance) => R.any((t: Task) => t.instanceId === i.id)(activeTasks)
    )(runningInstancesForTermination)
}

