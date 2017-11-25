import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as process from 'process'

import * as childProcess from 'child_process'
import {Readable} from "stream";

const IMAGE_PROGRAM = process.platform.toLowerCase() === 'linux' ? 'convert' : 'magick'
const NS_PER_SEC = 1e9;

interface RequestBody {
    source: string,
    tasks: [[string, [string | number]]]
}

interface MagickTaskArgsMap {
    [key: string]: string;
}

const MAGICK_ARGS_TEMPLATE: MagickTaskArgsMap = {
    'scale': '|$|%',
    'rotate': '|$|',
    'resize': '|$|x|$|!'
}

const formatArgs = function (task: string, argsVector: [string | number]): string {
    return argsVector
        .map((a) => a.toString())
        .reduce((acc, a) => acc.replace('|$|', a), MAGICK_ARGS_TEMPLATE[task])
}

interface AppServerParams {
    getImage: (source: string) => Promise<Readable>,
}

export default function createAppServer({getImage}: AppServerParams) {
    const app = express()

    app.use(bodyParser.json())

    app.post('/process', (req, res) => {
        const startTime = process.hrtime()

        const {source, tasks} = req.body as RequestBody

        const args = tasks.map(([task, argsVector]) => {
            return [`-${task}`, formatArgs(task, argsVector)]
        }).reduce((a, b) => a.concat(b))

        const proc = childProcess.spawn(IMAGE_PROGRAM, ['-', ...args, '-quality', '100', 'jpeg:-'])

        proc.stdout.on('data', () => {
            // Mock reader, otherwise stdout is never drained
        })

        // proc.stdout.pipe(res)

        proc.on('exit', () => {
            const diff = process.hrtime(startTime)
            // console.log('---> ', diff)
            res.json(diff)
        })

        getImage(source).then((data) => {
            // res.set('Content-Type', 'image/jpeg')
            data.pipe(proc.stdin)
        })
    })

    return app
}