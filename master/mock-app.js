"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const APP_PORT = parseInt(process.env.APP_PORT || '3000', 10);
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '3001', 10);
const TASK_DELAY = parseInt(process.env.TASK_DELAY || '5000', 10);
const app = express();
app.use(bodyParser.json());
app.post('/process', (_, res) => {
    setTimeout(() => {
        console.log('Responding');
        res.json([10, 0]);
    }, TASK_DELAY);
});
app.listen(APP_PORT, () => {
    console.log('Mock app is listening on port', APP_PORT);
});
const health = express();
health.get('/health', (_, res) => {
    setTimeout(() => {
        res.json({ ok: true });
    }, 1000);
});
health.listen(HEALTH_PORT, () => {
    console.log('Health check is listening on port', HEALTH_PORT);
});
