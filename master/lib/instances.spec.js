"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const chai_1 = require("chai");
const moment = require("moment");
const R = require("ramda");
const instances_1 = require("./instances");
const createEmptyInstancesState = function () {
    return {
        starting: {},
        running: {}
    };
};
const createMockInstance = function (id, ipAddress, startTime) {
    return { id, ipAddress, startTime };
};
describe('Instances', () => {
    describe('reducer', () => {
        it('should process START_INSTANCE', () => {
            const initState = createEmptyInstancesState();
            const mockInstance = createMockInstance('1', '123.123.123.123', moment());
            const updatedState = instances_1.default(initState, instances_1.startInstance(mockInstance));
            const starting = R.toPairs(updatedState.starting);
            const running = R.toPairs(updatedState.running);
            chai_1.expect(running).to.be.of.length(0);
            chai_1.expect(starting).to.be.of.length(1);
            chai_1.expect(starting[0][1]).to.eql(R.dissoc('id', mockInstance));
        });
        it('should process RUN_INSTANCE', () => {
            const initState = createEmptyInstancesState();
            const mockInstance = createMockInstance('1', '123.123.123.123', moment());
            const updatedState1 = instances_1.default(initState, instances_1.startInstance(mockInstance));
            const starting1 = R.toPairs(updatedState1.starting);
            const updatedState2 = instances_1.default(updatedState1, instances_1.runInstance(R.assoc('id', starting1[0][0], starting1[0][1])));
            const starting = R.toPairs(updatedState2.starting);
            const running = R.toPairs(updatedState2.running);
            chai_1.expect(starting).to.be.of.length(0);
            chai_1.expect(running).to.be.of.length(1);
            chai_1.expect(running[0][0]).to.eql('1');
        });
        it('should process TERMINATE_INSTANCE', () => {
            const initState = createEmptyInstancesState();
            const mockInstance = createMockInstance('1', '123.123.123.123', moment());
            const updatedState1 = instances_1.default(initState, instances_1.startInstance(mockInstance));
            const starting1 = R.toPairs(updatedState1.starting);
            const updatedState2 = instances_1.default(updatedState1, instances_1.runInstance(R.assoc('id', starting1[0][0], starting1[0][1])));
            const running1 = R.toPairs(updatedState2.running);
            const updatedState3 = instances_1.default(updatedState2, instances_1.terminateInstance(R.assoc('id', running1[0][0], running1[0][1])));
            const starting = R.toPairs(updatedState3.starting);
            const running = R.toPairs(updatedState3.running);
            chai_1.expect(starting).to.be.of.length(0);
            chai_1.expect(running).to.be.of.length(0);
        });
    });
});
