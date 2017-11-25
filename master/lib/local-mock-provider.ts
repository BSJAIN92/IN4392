import {Instance} from './types'
import * as uuid from 'uuid/v4'
import * as moment from 'moment'

export function startInstance(): Promise<Instance> {
    return new Promise<Instance>((resolve) => {
        setTimeout(() => {
            console.log('----> PROVISIONING.... ')
            resolve({
                id: `i-${uuid()}`,
                ipAddress: '127.0.0.1',
                startTime: moment()
            }), 5000
        })
    })
}

export function terminateInstance(instance: Instance): Promise<void> {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            console.log('----> TERMINATING.... ')
            resolve(), 5000
        })
    })
}
