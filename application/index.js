"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const app_server_1 = require("./lib/app-server");
const health_server_1 = require("./lib/health-server");
const APP_PORT = parseInt(process.env.PORT || '3000', 10);
const HEALTH_PORT = parseInt(process.env.PORT || '3001', 10);
const getHTTPImage = function (source) {
    console.log('Getting image from server');
    return axios_1.default({
        method: 'get',
        url: source,
        responseType: 'stream',
        onDownloadProgress: (e) => console.log('Downloading: ', e.toString())
    }).then(({ data }) => data);
};
const appServer = app_server_1.default({ getImage: getHTTPImage });
const healthServer = health_server_1.default();
appServer.listen(APP_PORT, () => console.log('App server listening on port ', APP_PORT));
healthServer.listen(HEALTH_PORT, () => console.log('Health server listening on port ', HEALTH_PORT));
