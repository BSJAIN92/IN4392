import {Observable} from 'rxjs'
import * as moment from 'moment'

import {Callback} from './types'

export default function constant(
    urls: string[], 
    baseDelay: number, 
    totalRequests: number, 
    callback: Callback
) {
   return Observable.zip(
        Observable.from(urls).take(totalRequests),
        Observable.interval(baseDelay)
   ).do(([url, i]) => callback(url as string, i as number))
    .map(([_, i]) => i)
}
