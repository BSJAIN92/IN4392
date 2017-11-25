const R = require('ramda')
const moment = require('moment')

const c3_e25 = require('./reports/c3-e2.5.json')
const c3_e5 = require('./reports/c3-e5.json')
const c3_e75 = require('./reports/c3-e7.5.json')

const se0_e25 = require('./reports/se0-e2.5.json')
const se0_e5 = require('./reports/se0-e5.json')
const se0_e75 = require('./reports/se0-e7.5.json')

const se7_e25 = require('./reports/se7-e2.5.json')
const se7_e5 = require('./reports/se7-e5.json')
const se7_e75 = require('./reports/se7-e7.5.json')

const test = require('./reports/test.json')

// Processing time - finish time of last request - arrival time of first request
// TODO: Min-Max
const getProcessingTime = function (report) {
    const lastFinishedTask = R.compose(
        R.nth(0),
        R.sort(R.descend(R.prop('finishTime')))
    )(report.finishedTasks)

    const firstArrivedTask = R.compose(
        R.nth(0),
        R.sort(R.ascend(R.prop('arrivalTime')))
    )(report.finishedTasks)

    return lastFinishedTask.finishTime - firstArrivedTask.arrivalTime
}

// Responsiveness (measure waiting time)
// Execution - arrival time
const getWaitingTime = function (report) {
    return R.compose(
        R.reduce(R.add, 0),
        R.map((t) => t.executeStartTime - t.arrivalTime),
    )(report.finishedTasks)
}

// Responsiveness (measure waiting time)
// Execution - arrival time
const getMinMaxWaitingTime = function (report) {
    const sortedWaitingTimes = R.compose(
        R.sort(R.ascend(R.identity)),
        R.map((t) => t.executeStartTime - t.arrivalTime)
    )(report.finishedTasks)

    return [
        R.nth(0, sortedWaitingTimes),
        R.nth(-5, sortedWaitingTimes),
        R.nth(-1, sortedWaitingTimes),
    ].map((n) => n / 1000)
}

// Instance termination - startTime
// Caution, termination might be null
const getTotalInstanceLifetime = function (report) {
    const lt = R.compose(
        R.reduce(R.add, 0),
        R.map((t) => t.terminatedTime - t.readyTime),
    )(report.terminatedInstances)

    if (lt === 0) return getProcessingTime(report) * 3

    return lt
}

// Instance cost if run for an hour
const getHourlyCost = function (report) {
    const instancesCount = getInstances(report)

    const COST_PER_HOUR = 0.067

    return COST_PER_HOUR * (1 + (instancesCount === 0 ? 3 : instancesCount))
}


const getExecutionTime = function (report) {
    return R.compose(
        R.reduce(R.add, 0),
        R.map((t) => t.finishTime - t.executeStartTime)
    )(report.finishedTasks)
n}

// execution time / total lifetime
const utilizationTime = function (report) {
    return getExecutionTime(report) / getTotalInstanceLifetime(report)
}

const getAverageVMAllocationOverhead = function(report) {
    return R.compose(
        R.divide(R.__, report.terminatedInstances.length),
        R.reduce(R.add, 0),
        R.map((t) => t.readyTime - t.startTime)
    )(report.terminatedInstances)
}

const getInstances = function(report) {
    return report.terminatedInstances.length
}

const getMedian = function(xs) {
    if (xs.length % 2 === 0) {
        return (xs[xs.length / 2] + xs[xs.length / 2 + 1]) * 0.5
    }

    return xs[Math.ceil(xs.length / 2)]
}

const getWaitingTimeBoxPlot = function(report) {
    const waitingTimes = R.compose(
        R.sort((a, b) => a - b),
        R.map((t) => t.executeStartTime - t.arrivalTime),
    )(report.finishedTasks)

    const median = getMedian(waitingTimes)

    const leftSide = waitingTimes.filter((n) => n < median)
    const rightSide = waitingTimes.filter((n) => n > median)

    const leftMedian = getMedian(leftSide)
    const rightMedian = getMedian(rightSide)
    
    return {
        min: R.nth(0, waitingTimes),
        max: R.last(waitingTimes),
        median,
        leftMedian,
        rightMedian
    }
}

const formatReport = function(report) {
    return {
        finishedTasks: R.map((t) => ({
            id: t.id,
            arrivalTime: moment.utc(t.arrivalTime).valueOf(),
            executeStartTime: moment.utc(t.executeStartTime).valueOf(),
            finishTime: moment.utc(t.finishTime).valueOf(),
        }))(report.finishedTasks),
        terminatedInstances: R.map((i) => ({
            ...i,
            startTime: moment.utc(i.startTime).valueOf(),
            readyTime: moment.utc(i.readyTime).valueOf(),
            terminatedTime: moment.utc(i.terminatedTime).valueOf(),
        }))(report.terminatedInstances)
    }
}

console.log('------- Box Plot waiting time -------')
console.log('C3-E2.5 : ', getWaitingTimeBoxPlot(formatReport(c3_e25)))
console.log('SE0-E2.5 : ', getWaitingTimeBoxPlot(formatReport(se0_e25)))
console.log('SE7-E2.5 : ', getWaitingTimeBoxPlot(formatReport(se7_e25)))

// console.log('------- PROCESSING TIME --------')
// console.log('C3-E2.5 :', getProcessingTime(formatReport(c3_e25)) / 1000, ' seconds')
// console.log('C3-E5.0 :', getProcessingTime(formatReport(c3_e5)) / 1000, ' seconds')
// console.log('C3-E7.5 :', getProcessingTime(formatReport(c3_e75)) / 1000, ' seconds')
// console.log()
// console.log('SE0-E2.5 :', getProcessingTime(formatReport(se0_e25)) / 1000, ' seconds')
// console.log('SE0-E5.0 :', getProcessingTime(formatReport(se0_e5)) / 1000, ' seconds')
// console.log('SE0-E7.5 :', getProcessingTime(formatReport(se0_e75)) / 1000, ' seconds')
// console.log()
// console.log('SE7-E2.5 :', getProcessingTime(formatReport(se7_e25)) / 1000, ' seconds')
// console.log('SE7-E5.0 :', getProcessingTime(formatReport(se7_e5)) / 1000, ' seconds')
// console.log('SE7-E7.5 :', getProcessingTime(formatReport(se7_e75)) / 1000, ' seconds')

// console.log('------- Responsiveness --------')
// console.log('C3-E2.5 :', getWaitingTime(formatReport(c3_e25)) / 1000, ' seconds')
// console.log('C3-E5.0 :', getWaitingTime(formatReport(c3_e5)) / 1000, ' seconds')
// console.log('C3-E7.5 :', getWaitingTime(formatReport(c3_e75)) / 1000, ' seconds')
// console.log()
// console.log('SE0-E2.5 :', getWaitingTime(formatReport(se0_e25)) / 1000, ' seconds')
// console.log('SE0-E5.0 :', getWaitingTime(formatReport(se0_e5)) / 1000, ' seconds')
// console.log('SE0-E7.5 :', getWaitingTime(formatReport(se0_e75)) / 1000, ' seconds')
// console.log()
// console.log('SE7-E2.5 :', getWaitingTime(formatReport(se7_e25)) / 1000, ' seconds')
// console.log('SE7-E5.0 :', getWaitingTime(formatReport(se7_e5)) / 1000, ' seconds')
// console.log('SE7-E7.5 :', getWaitingTime(formatReport(se7_e75)) / 1000, ' seconds')

// console.log('------- Responsiveness [Min-Max] --------')
// console.log('C3-E2.5 :', getMinMaxWaitingTime(formatReport(c3_e25)), ' seconds')
// console.log('C3-E5.0 :', getMinMaxWaitingTime(formatReport(c3_e5)), ' seconds')
// console.log('C3-E7.5 :', getMinMaxWaitingTime(formatReport(c3_e75)), ' seconds')
// console.log()
// console.log('SE0-E2.5 :', getMinMaxWaitingTime(formatReport(se0_e25)), ' seconds')
// console.log('SE0-E5.0 :', getMinMaxWaitingTime(formatReport(se0_e5)), ' seconds')
// console.log('SE0-E7.5 :', getMinMaxWaitingTime(formatReport(se0_e75)), ' seconds')
// console.log()
// console.log('SE7-E2.5 :', getMinMaxWaitingTime(formatReport(se7_e25)), ' seconds')
// console.log('SE7-E5.0 :', getMinMaxWaitingTime(formatReport(se7_e5)), ' seconds')
// console.log('SE7-E7.5 :', getMinMaxWaitingTime(formatReport(se7_e75)), ' seconds')

// console.log('------- TotalInstanceTime --------')
// console.log('C3-E2.5 :', (getTotalInstanceLifetime(formatReport(c3_e25))) / 1000, ' seconds')
// console.log('C3-E5.0 :', (getTotalInstanceLifetime(formatReport(c3_e5))) / 1000, ' seconds')
// console.log('C3-E7.5 :', (getTotalInstanceLifetime(formatReport(c3_e75))) / 1000, ' seconds')
// console.log()
// console.log('SE0-E2.5 :', getTotalInstanceLifetime(formatReport(se0_e25)) / 1000, ' seconds')
// console.log('SE0-E5.0 :', getTotalInstanceLifetime(formatReport(se0_e5)) / 1000, ' seconds')
// console.log('SE0-E7.5 :', getTotalInstanceLifetime(formatReport(se0_e75)) / 1000, ' seconds')
// console.log()
// console.log('SE7-E2.5 :', getTotalInstanceLifetime(formatReport(se7_e25)) / 1000, ' seconds')
// console.log('SE7-E5.0 :', getTotalInstanceLifetime(formatReport(se7_e5)) / 1000, ' seconds')
// console.log('SE7-E7.5 :', getTotalInstanceLifetime(formatReport(se7_e75)) / 1000, ' seconds')

// console.log('------- Hourly Cost --------')
// console.log('C3-E2.5 :', getHourlyCost(formatReport(c3_e25)), ' USD')
// console.log('C3-E5.0 :', getHourlyCost(formatReport(c3_e5)), ' USD')
// console.log('C3-E7.5 :', getHourlyCost(formatReport(c3_e75)), ' USD')
// console.log()
// console.log('SE0-E2.5 :', getHourlyCost(formatReport(se0_e25)), ' USD')
// console.log('SE0-E5.0 :', getHourlyCost(formatReport(se0_e5)), ' USD')
// console.log('SE0-E7.5 :', getHourlyCost(formatReport(se0_e75)), ' USD')
// console.log()
// console.log('SE7-E2.5 :', getHourlyCost(formatReport(se7_e25)), ' USD')
// console.log('SE7-E5.0 :', getHourlyCost(formatReport(se7_e5)), ' USD')
// console.log('SE7-E7.5 :', getHourlyCost(formatReport(se7_e75)), ' USD')

// console.log('------- Utilization --------')
// console.log('C3-E2.5 :', utilizationTime(formatReport(c3_e25)))
// console.log('C3-E5.0 :', utilizationTime(formatReport(c3_e5)))
// console.log('C3-E7.5 :', utilizationTime(formatReport(c3_e75)))
// console.log()
// console.log('SE0-E2.5 :', utilizationTime(formatReport(se0_e25)))
// console.log('SE0-E5.0 :', utilizationTime(formatReport(se0_e5)))
// console.log('SE0-E7.5 :', utilizationTime(formatReport(se0_e75)))
// console.log()
// console.log('SE7-E2.5 :', utilizationTime(formatReport(se7_e25)))
// console.log('SE7-E5.0 :', utilizationTime(formatReport(se7_e5)))
// console.log('SE7-E7.5 :', utilizationTime(formatReport(se7_e75)))

// console.log('------- Average VM Allocation Overhead --------')
// console.log('C3-E2.5 :', getAverageVMAllocationOverhead(formatReport(c3_e25)))
// console.log('C3-E5.0 :', getAverageVMAllocationOverhead(formatReport(c3_e5)))
// console.log('C3-E7.5 :', getAverageVMAllocationOverhead(formatReport(c3_e75)))
// console.log()
// console.log('SE0-E2.5 :', getAverageVMAllocationOverhead(formatReport(se0_e25)))
// console.log('SE0-E5.0 :', getAverageVMAllocationOverhead(formatReport(se0_e5)))
// console.log('SE0-E7.5 :', getAverageVMAllocationOverhead(formatReport(se0_e75)))
// console.log()
// console.log('SE7-E2.5 :', getAverageVMAllocationOverhead(formatReport(se7_e25)))
// console.log('SE7-E5.0 :', getAverageVMAllocationOverhead(formatReport(se7_e5)))
// console.log('SE7-E7.5 :', getAverageVMAllocationOverhead(formatReport(se7_e75)))

// console.log('------- Average VM Allocation Overhead --------')
// console.log('C3-E2.5 :', getInstances(formatReport(c3_e25)))
// console.log('C3-E5.0 :', getInstances(formatReport(c3_e5)))
// console.log('C3-E7.5 :', getInstances(formatReport(c3_e75)))
// console.log()
// console.log('SE0-E2.5 :', getInstances(formatReport(se0_e25)))
// console.log('SE0-E5.0 :', getInstances(formatReport(se0_e5)))
// console.log('SE0-E7.5 :', getInstances(formatReport(se0_e75)))
// console.log()
// console.log('SE7-E2.5 :', getInstances(formatReport(se7_e25)))
// console.log('SE7-E5.0 :', getInstances(formatReport(se7_e5)))
// console.log('SE7-E7.5 :', getInstances(formatReport(se7_e75)))