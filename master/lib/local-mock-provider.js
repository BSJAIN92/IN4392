"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid/v4");
const moment = require("moment");
function startInstance() {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('----> PROVISIONING.... ');
            resolve({
                id: `i-${uuid()}`,
                ipAddress: '127.0.0.1',
                startTime: moment()
            }), 5000;
        });
    });
}
exports.startInstance = startInstance;
function terminateInstance(instance) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('----> TERMINATING.... ');
            resolve(), 5000;
        });
    });
}
exports.terminateInstance = terminateInstance;
