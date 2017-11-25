import * as path from 'path'
import * as fs from 'fs'
import axios from 'axios'
import * as PoissonProcess from 'poisson-process'
import * as moment from 'moment'

const HOST = process.env.HOST || 'localhost'
const INTERVAL = parseInt(process.env.INTERVAL || '0', 10)

if (INTERVAL === 0) {
    console.log('Specify interval')
    process.exit(1)
}

const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '100', 10)

const urls = fs.readFileSync(path.join(__dirname, '45-55-urls.txt')).toString().split('\n')

const START_TIMESTAMP = moment().valueOf()

let i = 0
const p = PoissonProcess.create(INTERVAL, () => {
    console.log(`${i + 1}\t${moment().valueOf() - START_TIMESTAMP}`)
    axios.post(`http://${HOST}:8000/add`, {
        source: urls[i],
        tasks: [['scale', [25]], ['rotate', [90]]]
    }).then(() => {}).catch(() => console.log('Error making request at tick: ', i + 1))

    if (i + 1 === TOTAL_REQUESTS) {
        p.stop()
    } else {
        i = i + 1
    }
})

p.start()