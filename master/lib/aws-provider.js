"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
const moment = require("moment");
const ec2 = new AWS.EC2({
    apiVersion: '2016-11-15',
    region: 'us-east-1'
});
const EC2_INSTANCE_PARAMS = {
    ImageId: 'ami-860aabfc',
    MaxCount: 1,
    MinCount: 1,
    SecurityGroupIds: ['sg-d82e65aa'],
    InstanceType: 'm3.medium'
};
const ec2DataToInstance = function (ec2Data) {
    if (ec2Data.Instances) {
        return {
            id: ec2Data.Instances[0].InstanceId,
            ipAddress: ec2Data.Instances[0].PrivateIpAddress,
            startTime: moment(ec2Data.Instances[0].LaunchTime)
        };
    }
    return null;
};
function startInstance() {
    console.log('----> STARTING');
    return ec2.runInstances(EC2_INSTANCE_PARAMS)
        .promise()
        .then(ec2DataToInstance);
}
exports.startInstance = startInstance;
function terminateInstance(instance) {
    console.log('----> TERMINATING');
    return new Promise((resolve, reject) => {
        ec2.terminateInstances({
            InstanceIds: [instance.id]
        }).promise().then(() => resolve()).catch(reject);
    });
}
exports.terminateInstance = terminateInstance;
