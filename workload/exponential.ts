import {Observable} from 'rxjs'
import * as moment from 'moment'

import {Callback} from './types'

export default function exponential(
    urls: string[], 
    baseDelay: number, 
    totalRequests: number, 
    callback: Callback
) {
    return Observable
        .from(urls)
        .take(totalRequests)
        .concatMap((url, i) => (
            Observable
                .of(url)
                .delayWhen(() => Observable.timer((totalRequests - i) * baseDelay))
                .do(() => callback(url, i))
                .mapTo(i)
        ))
}