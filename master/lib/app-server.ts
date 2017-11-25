import * as express from 'express'
import * as bodyParser from 'body-parser'

interface AppParams {
    getState: (summarized: boolean) => object,
    getReport: () => object,
    getUptime: () => number,
    addTask: (args: object) => void,
    terminateAll: () => void
}

export default function createAppServer({getState, getReport, getUptime, addTask, terminateAll}: AppParams) {
    const server = express()

    server.use(bodyParser.json())

    server.post('/add', (req, res) => {
        addTask(req.body)
        res.status(200).end('added task')
    })

    server.get('/state', (req, res) => {
        res.json(getState(req.query.summarized || false))
    })

    server.get('/report', (req, res) => {
        res.json({
            ...getReport(),
            uptime: getUptime()
        })
    })

    server.get('/terminate-all', (req, res) => {
        terminateAll()
        res.status(200).end()
    })

    return server
}
