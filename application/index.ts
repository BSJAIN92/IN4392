import axios from 'axios'

import createAppServer from './lib/app-server'
import createHealthServer from './lib/health-server'
import {Readable} from "stream";

const APP_PORT = parseInt(process.env.PORT || '3000', 10)
const HEALTH_PORT = parseInt(process.env.PORT || '3001', 10)

const getHTTPImage = function (source: string): Promise<Readable> {
    console.log('Getting image from server')
    return axios({
        method: 'get',
        url: source,
        responseType: 'stream',
        onDownloadProgress: (e) => console.log('Downloading: ', e.toString())
    }).then(({data}) => data)
}

const appServer = createAppServer({getImage: getHTTPImage})
const healthServer = createHealthServer()

appServer.listen(APP_PORT, () => console.log('App server listening on port ', APP_PORT))
healthServer.listen(HEALTH_PORT, () => console.log('Health server listening on port ', HEALTH_PORT))
