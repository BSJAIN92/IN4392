import * as AWS from 'aws-sdk'
import * as moment from 'moment'

import {Instance} from './types'
import EC2 = require("aws-sdk/clients/ec2");

const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: 'us-east-1'
})

const EC2_INSTANCE_PARAMS = {
    ImageId: 'ami-860aabfc',
    MaxCount: 1,
    MinCount: 1,
    SecurityGroupIds: ['sg-d82e65aa'],
    InstanceType: 'm3.medium'
}

const ec2DataToInstance = function (ec2Data: EC2.Types.Reservation): Instance | null {
    if (ec2Data.Instances) {
        return {
            id: ec2Data.Instances[0].InstanceId as string,
            ipAddress: ec2Data.Instances[0].PrivateIpAddress as string,
            startTime: moment(ec2Data.Instances[0].LaunchTime as Date)
        }
    }

    return null
}

export function startInstance(): Promise<Instance> {
    console.log('----> STARTING')
    return ec2.runInstances(EC2_INSTANCE_PARAMS)
        .promise()
        .then(ec2DataToInstance) as Promise<Instance>
}

export function terminateInstance(instance: Instance): Promise<void> {
    console.log('----> TERMINATING')
    return new Promise<void>((resolve, reject) => {
        ec2.terminateInstances({
            InstanceIds: [instance.id]
        }).promise().then(() => resolve()).catch(reject)
    })
}