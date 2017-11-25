import {Observable} from 'rxjs'
import * as moment from 'moment'

import {Callback} from './types'

export default function spike(
    urls: string[], 
    baseDelay: number, 
    totalRequests: number, 
    callback: Callback
) {
    const TOTAL_HALF_REQUESTS = totalRequests / 2

    return Observable
        .from(urls)
        .take(totalRequests)
        .concatMap((url, i) => (
            Observable
                .of(url)
                .delayWhen(() => Observable.timer(
                    i <= TOTAL_HALF_REQUESTS ? (TOTAL_HALF_REQUESTS - i) * baseDelay : i * baseDelay
                ))
                .do(() => callback(url, i))
                .mapTo(i)
        ))
}