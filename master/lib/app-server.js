"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
function createAppServer({ getState, getReport, getUptime, addTask, terminateAll }) {
    const server = express();
    server.use(bodyParser.json());
    server.post('/add', (req, res) => {
        addTask(req.body);
        res.status(200).end('added task');
    });
    server.get('/state', (req, res) => {
        res.json(getState(req.query.summarized || false));
    });
    server.get('/report', (req, res) => {
        res.json(Object.assign({}, getReport(), { uptime: getUptime() }));
    });
    server.get('/terminate-all', (req, res) => {
        terminateAll();
        res.status(200).end();
    });
    return server;
}
exports.default = createAppServer;
