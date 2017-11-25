import 'mocha'
import {expect} from 'chai'
import * as moment from 'moment'
import * as R from 'ramda'

import {Moment} from "moment";
import instances, {runInstance, startInstance, terminateInstance} from "./instances";

const createEmptyInstancesState = function () {
    return {
        starting: {},
        running: {}
    }
}

const createMockInstance = function (id: string, ipAddress: string, startTime: Moment) {
    return {id, ipAddress, startTime}
}

describe('Instances', () => {

    describe('reducer', () => {

        it('should process START_INSTANCE', () => {
            const initState = createEmptyInstancesState()
            const mockInstance = createMockInstance('1', '123.123.123.123', moment())
            const updatedState = instances(initState, startInstance(mockInstance))

            const starting = R.toPairs(updatedState.starting)
            const running = R.toPairs(updatedState.running)

            expect(running).to.be.of.length(0)
            expect(starting).to.be.of.length(1)
            expect(starting[0][1]).to.eql(R.dissoc('id', mockInstance))
        })

        it('should process RUN_INSTANCE', () => {
            const initState = createEmptyInstancesState()
            const mockInstance = createMockInstance('1', '123.123.123.123', moment())
            const updatedState1 = instances(initState, startInstance(mockInstance))

            const starting1 = R.toPairs(updatedState1.starting)

            const updatedState2 = instances(updatedState1, runInstance(R.assoc('id', starting1[0][0], starting1[0][1])))

            const starting = R.toPairs(updatedState2.starting)
            const running = R.toPairs(updatedState2.running)

            expect(starting).to.be.of.length(0)
            expect(running).to.be.of.length(1)
            expect(running[0][0]).to.eql('1')
        })

        it('should process TERMINATE_INSTANCE', () => {
            const initState = createEmptyInstancesState()
            const mockInstance = createMockInstance('1', '123.123.123.123', moment())
            const updatedState1 = instances(initState, startInstance(mockInstance))

            const starting1 = R.toPairs(updatedState1.starting)
            const updatedState2 = instances(updatedState1, runInstance(R.assoc('id', starting1[0][0], starting1[0][1])))


            const running1 = R.toPairs(updatedState2.running)
            const updatedState3 = instances(updatedState2, terminateInstance(R.assoc('id', running1[0][0], running1[0][1])))

            const starting = R.toPairs(updatedState3.starting)
            const running = R.toPairs(updatedState3.running)

            expect(starting).to.be.of.length(0)
            expect(running).to.be.of.length(0)
        })
    })
})
