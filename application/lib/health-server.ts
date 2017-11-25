import * as os from 'os'

import * as express from 'express'
import * as cors from 'cors'

const osUtils = require('os-utils')

export default function createHealthServer() {
    const app = express()

    app.use(cors())

    app.get('/health', (_, res) => {
        osUtils.cpuUsage((v: number) => {
            res.send({
                memoryFree: os.freemem(),
                memoryPercentage: os.freemem() / os.totalmem(),
                cpu: v
            })
        })
    })

    return app
}