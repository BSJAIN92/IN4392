"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const moment = require("moment");
const R = require("ramda");
const task_queue_1 = require("./task-queue");
const createEmptyTaskQueueState = function () {
    return {
        pending: {},
        active: {}
    };
};
const createMockTask = function (id, arrivalTime) {
    return {
        id,
        args: {},
        arrivalTime,
        retries: -1
    };
};
describe('Task queue', () => {
    describe('reducer', () => {
        it('should process ADD_TASK', () => {
            const initState = createEmptyTaskQueueState();
            const addTaskAction = task_queue_1.addTask({ source: 'source1' });
            const updatedState = task_queue_1.default(initState, addTaskAction);
            const pendingQueue = R.toPairs(updatedState.pending);
            chai_1.expect(pendingQueue).to.be.of.length(1);
            chai_1.expect(pendingQueue[0][1].args).to.eql(addTaskAction.payload.args);
        });
        it('should process ADD_TASK - 2 tasks', () => {
            const initState = createEmptyTaskQueueState();
            const addTaskAction1 = task_queue_1.addTask({ source: 'source1' });
            const addTaskAction2 = task_queue_1.addTask({ source: 'source2' });
            const updatedState = task_queue_1.default(task_queue_1.default(initState, addTaskAction1), addTaskAction2);
            const pendingQueue = R.toPairs(updatedState.pending);
            chai_1.expect(pendingQueue).to.be.of.length(2);
            chai_1.expect(pendingQueue[0][1].args).to.eql(addTaskAction1.payload.args);
            chai_1.expect(pendingQueue[1][1].args).to.eql(addTaskAction2.payload.args);
        });
        it('should process EXECUTE_TASK', () => {
            const initState = createEmptyTaskQueueState();
            const addTaskAction1 = task_queue_1.addTask({ source: 'source1' });
            const addTaskAction2 = task_queue_1.addTask({ source: 'source2' });
            const updatedState1 = task_queue_1.default(task_queue_1.default(initState, addTaskAction1), addTaskAction2);
            const pendingTask = task_queue_1.pickPendingTasks(updatedState1, 1)[0];
            const updatedState2 = task_queue_1.default(updatedState1, task_queue_1.executeTask(pendingTask, 'instance-1'));
            const pendingQueue = R.toPairs(updatedState2.pending);
            const activeQueue = R.toPairs(updatedState2.active);
            chai_1.expect(pendingQueue).to.be.of.length(1);
            chai_1.expect(activeQueue).to.be.of.length(1);
            chai_1.expect(activeQueue[0][1].retries).to.be.eql(0);
            chai_1.expect(activeQueue[0][1].instanceId).to.be.eql('instance-1');
        });
        it('should remove task from active FINISH_TASK', () => {
            const initState = createEmptyTaskQueueState();
            const addTaskAction1 = task_queue_1.addTask({ source: 'source1' });
            const addTaskAction2 = task_queue_1.addTask({ source: 'source2' });
            const updatedState1 = task_queue_1.default(task_queue_1.default(initState, addTaskAction1), addTaskAction2);
            const pendingTask = task_queue_1.pickPendingTasks(updatedState1, 1)[0];
            const updatedState2 = task_queue_1.default(updatedState1, task_queue_1.executeTask(pendingTask, 'instance-1'));
            const activeQueue1 = R.toPairs(updatedState2.active);
            const activeTaskToFinish = Object.assign({ id: activeQueue1[0][0] }, activeQueue1[0][1]);
            const updatedState3 = task_queue_1.default(updatedState2, task_queue_1.finishTask(activeTaskToFinish));
            const pendingQueue = R.toPairs(updatedState3.pending);
            const activeQueue = R.toPairs(updatedState3.active);
            chai_1.expect(pendingQueue).to.be.of.length(1);
            chai_1.expect(activeQueue).to.be.of.length(0);
        });
        it('should FAIL_TASK and add back to execution', () => {
            const initState = createEmptyTaskQueueState();
            const addTaskAction1 = task_queue_1.addTask({ source: 'source1' });
            const addTaskAction2 = task_queue_1.addTask({ source: 'source2' });
            const updatedState1 = task_queue_1.default(task_queue_1.default(initState, addTaskAction1), addTaskAction2);
            const pendingTask = task_queue_1.pickPendingTasks(updatedState1, 1)[0];
            const updatedState2 = task_queue_1.default(updatedState1, task_queue_1.executeTask(pendingTask, 'instance-1'));
            const activeQueue1 = R.toPairs(updatedState2.active);
            const activeTaskToFail = Object.assign({ id: activeQueue1[0][0] }, activeQueue1[0][1]);
            const updatedState3 = task_queue_1.default(updatedState2, task_queue_1.failTask(activeTaskToFail));
            const pendingQueue = R.toPairs(updatedState3.pending);
            const activeQueue = R.toPairs(updatedState3.active);
            chai_1.expect(pendingQueue).to.be.of.length(2);
            chai_1.expect(activeQueue).to.be.of.length(0);
        });
    });
    describe('util functions', () => {
        describe('pick 1 task from pending queue', () => {
            it('should return empty for empty queue', () => {
                const taskQueueState = createEmptyTaskQueueState();
                const pickedTasks = task_queue_1.pickPendingTasks(taskQueueState, 1);
                chai_1.expect(pickedTasks).to.be.empty;
            });
            it('should return only task in queue', () => {
                const mockTask1 = createMockTask('1', moment().subtract(1, 'day'));
                const taskQueueState = Object.assign({}, createEmptyTaskQueueState(), { pending: { '1': mockTask1 } });
                const pickedTasks = task_queue_1.pickPendingTasks(taskQueueState, 1);
                chai_1.expect(pickedTasks).to.be.of.length(1);
                chai_1.expect(pickedTasks[0]).to.eql(mockTask1);
            });
            it('should return the earliest in the list', () => {
                const mockTask1 = createMockTask('1', moment().subtract(5, 'seconds'));
                const mockTask2 = createMockTask('2', moment().subtract(7, 'seconds'));
                const mockTask3 = createMockTask('3', moment().subtract(3, 'seconds'));
                const taskQueueState = Object.assign({}, createEmptyTaskQueueState(), { pending: { '1': mockTask1, '2': mockTask2, '3': mockTask3 } });
                const pickedTasks = task_queue_1.pickPendingTasks(taskQueueState, 1);
                chai_1.expect(pickedTasks).to.be.of.length(1);
                chai_1.expect(pickedTasks[0]).to.eql(mockTask2);
            });
        });
        describe('pick 3 tasks from pending queue', () => {
            it('should pick earliest 3 tasks', () => {
                const mockTask1 = createMockTask('1', moment().subtract(5, 'seconds'));
                const mockTask2 = createMockTask('2', moment().subtract(7, 'seconds'));
                const mockTask3 = createMockTask('3', moment().subtract(3, 'seconds'));
                const mockTask4 = createMockTask('4', moment().subtract(9, 'seconds'));
                const mockTask5 = createMockTask('5', moment().subtract(1, 'seconds'));
                const mockTask6 = createMockTask('6', moment().subtract(2, 'seconds'));
                const taskQueueState = Object.assign({}, createEmptyTaskQueueState(), { pending: {
                        '1': mockTask1,
                        '2': mockTask2,
                        '3': mockTask3,
                        '4': mockTask4,
                        '5': mockTask5,
                        '6': mockTask6
                    } });
                const pickedTasks = task_queue_1.pickPendingTasks(taskQueueState, 3);
                chai_1.expect(pickedTasks).to.be.of.length(3);
                chai_1.expect(pickedTasks[0]).to.eql(mockTask4);
                chai_1.expect(pickedTasks[1]).to.eql(mockTask2);
                chai_1.expect(pickedTasks[2]).to.eql(mockTask1);
            });
        });
    });
});
