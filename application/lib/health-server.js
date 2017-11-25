"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const express = require("express");
const cors = require("cors");
const osUtils = require('os-utils');
function createHealthServer() {
    const app = express();
    app.use(cors());
    app.get('/health', (_, res) => {
        osUtils.cpuUsage((v) => {
            res.send({
                memoryFree: os.freemem(),
                memoryPercentage: os.freemem() / os.totalmem(),
                cpu: v
            });
        });
    });
    return app;
}
exports.default = createHealthServer;
