import {Moment} from 'moment'
import {Action} from 'redux'

export interface Task {
    id: string
    args: {}
    arrivalTime: Moment,
    retries: number,
    executeStartTime?: Moment,
    finishTime?: Moment,
    instanceId?: string
    failed?: boolean
}

export interface TaskQueueAction extends Action {
    type: 'ADD_TASK' | 'EXECUTE_TASK' | 'FINISH_TASK' | 'FAIL_TASK' | 'TERMINATE_TASK',
    payload: Task
}

export interface TaskQueueState {
    pending: { [id: string]: Task },
    active: { [id: string]: Task }
}

export interface Instance {
    id: string,
    ipAddress: string,
    startTime: Moment,
    readyTime?: Moment,
    terminatedTime?: Moment,
    scheduledForTermination?: boolean,
    normalTermination?: boolean // for spot instances
}

export interface InstanceRequestAction extends Action {
    type: 'REQUEST_INSTANCES',
    payload: {count: number}
}

export interface InstanceAction extends Action {
    type: 'START_INSTANCE' | 'RUN_INSTANCE' | 'UNSCHEDULE_FOR_TERMINATION_INSTANCE' | 'SCHEDULE_FOR_TERMINATION_INSTANCE' | 'TERMINATE_INSTANCE',
    payload: Instance
}

export interface InstanceState {
    starting: { [id: string]: Instance },
    running: { [id: string]: Instance }
}

export interface MasterState {
    taskQueue: TaskQueueState,
    instances: InstanceState
}

export interface ProvisionerPolicy {
    taskQueueThreshold: number,
    minVMs: number,
    maxVMs: number
}

export interface ReportState {
    finishedTasks: Task[],
    terminatedInstances: Instance[]
}

export interface ReportAction extends Action {
    type: 'REPORT_FINISHED_TASK' | 'REPORT_TERMINATED_INSTANCE',
    payload:  Task | Instance
}