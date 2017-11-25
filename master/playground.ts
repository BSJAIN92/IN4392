import {Observable} from 'rxjs'
import * as moment from 'moment'
import axios from 'axios'

import {Instance} from './lib/types';

const HEALTH_CHECK_INTERVAL = 2500
const HEALTH_TIMEOUT = 20 * 1000
const instance: Instance = {
    id: 'i-0da160f09e58bb31c',
    ipAddress: '34.203.215.148',
    startTime: moment()
}

const healthCheck = (i: Instance) => (
    Observable
        .interval(HEALTH_CHECK_INTERVAL)
        .flatMap(() => (
            Observable.fromPromise(axios.get(`http://${i.ipAddress}:3001/health`))
                .map((r) => r.data)
                .catch((e) => Observable.of('NOT_YET_READY'))
        ))
        .filter((d) => d !== 'NOT_YET_READY')
        .take(1)
        .timeout(HEALTH_TIMEOUT)
)

healthCheck(instance)
    .subscribe(() => {
        console.log('-----> INSTANCE IS READY ------>')
    })
