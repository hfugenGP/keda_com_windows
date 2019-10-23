import axios, { AxiosInstance, AxiosPromise } from 'axios';
import { SetelRequest } from './data.d';

export default class SetelApi {
    private static instance: SetelApi;
    private _api: AxiosInstance;

    private constructor() {
        this._api = axios.create({
            baseURL: process.env.SETEL_API, 
            "headers": {
                "access_token" : process.env.ACCESS_TOKEN
            }
        });
    }

    /**
     * Singleton
     * 
     */
    public static getInstance(): SetelApi {
        if (!SetelApi.instance) {
            SetelApi.instance = new SetelApi;
        }
        return SetelApi.instance;
    }
    
    /**
     * Send POST request to Setel API
     * 
     * @param body 
     */
    public vehicleStatus(body: SetelRequest): AxiosPromise<any> {
        return this._api.post('/api/cameras/license-plate-events', body);
    }
}