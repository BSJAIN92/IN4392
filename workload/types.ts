import {Observable} from 'rxjs'

export type Callback = (url: string, i: number) => void

export type TimingFunction = (
    urls: string[], 
    baseDelay: number, 
    totalRequests: number, 
    callback: Callback
) => Observable<number>

export interface Functions {
    [key: string]: TimingFunction
}
