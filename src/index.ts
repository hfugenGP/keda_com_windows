import { config } from "dotenv";
import { resolve } from 'path'; 
import DbConn from './dbconn';
import { DataFields } from "./data"; 
import SetelApi from './setelrequest'; 
import * as moment from 'moment';

export default class KedaComWatch { 
    private _watch: any; 
    private _setel: SetelApi; 
    private _dbconn: DbConn;

    constructor() {
        this._watch = require('node-watch');  
        this._setel = SetelApi.getInstance(); 
        this._dbconn = new DbConn('data');
    }
    
    /**
     * Start watching for changes in the directory where 
     * the mysql binary logs are stored.
     * 
     */
    public watchLogDir(): void { 
        console.log('Start watch on : %s \n', process.env.WATCH_DIR);
        this._watch(process.env.WATCH_DIR, { recursive: true }, (evt: any, name: any) => {
            console.log('%s has been changed. Checking %s database for changes.\n', name, process.env.DB_NAME); 
            this._checkPrevious();
        });
    }

    /**
     * Check the last 2 records in the database for changes. 
     * 
     */
    private _checkPrevious(): void {
        this._dbconn.fetch({limit: 2, sort: 'JGSJ DESC'}, (result) => {
            let recordset = <DataFields[]><unknown>result; 
            if (recordset != null && recordset.length != 0) {                 
                recordset.map((key, val) => {
                    console.log('License Plate: %s Bay Number: %s Timestamp: %s \n', recordset[val].HPHM, recordset[val].CDBH, recordset[val].JGSJ);
                });
                this._updateStatus(recordset);
            }
        });
    }

    /**
     * Compare records prior to sending POST request to SETEL.
     * 
     * @param recordset 
     */
    private _updateStatus(recordset: DataFields[]): void {
        if (recordset.length == 1) {
            console.log('Send enter status for License Plate: %s. No previous vehicle at bay number %s. \n', recordset[0].HPHM, recordset[0].CDBH);
            this._sendApiRequest(recordset[0], 'enter');
        } else {
            // Compare bay numbers.
            if (recordset[0].CDBH != recordset[1].CDBH) { 
                console.log('Different by number \n');
                this._checkPrevStatus(recordset[0]);
            } else {
                // Check if it's the same vehicle. 
                if (recordset[0].HPHM != recordset[1].HPHM) {                    
                    // Send enter status for latest record. 
                    console.log('Send enter status for License Plate: %s at bay number %s. \n', recordset[0].HPHM, recordset[0].CDBH);
                    this._sendApiRequest(recordset[0], 'enter');   

                    // Send exit status for previous record. 
                    console.log('Send exit status for License Plate: %s at bay number %s. \n', recordset[1].HPHM, recordset[1].CDBH);
                    this._sendApiRequest(recordset[1], 'exit');               
                } else {
                    this._checkPrevStatus(recordset[0]);
                }
            }
        }
    }

    /**
     * Check vehicle's previous record to see if it falls within the 2 min threshold.
     * 
     * @param vehicle 
     */
    private _checkPrevStatus(vehicle: DataFields): void {
        const searchstring = `HPHM = '${vehicle.HPHM}' AND CDBH = ${vehicle.CDBH}`; 
        this._dbconn.find({searchstring : searchstring, limit: 2, sort: 'JGSJ ASC'}, (result) => { 
            let recordset = <DataFields[]><unknown>result;              
            if (recordset != null && recordset.length != 0) {
                let timediff = Math.round(moment(vehicle.JGSJ).diff(moment(new Date(recordset[0].JGSJ)))/1000); 
                if (recordset.length < 2) {
                    // We'll ignore record counts that are less than 2 since vehicle will be the same record returned by 
                    // the previous query.
                    console.log('Send enter status for License Plate: %s at bay number %s. \n', vehicle.HPHM, vehicle.CDBH);
                    this._sendApiRequest(vehicle, 'enter'); 
                } else {
                    if (timediff > 120) { 
                        console.log('Send enter status for License Plate: %s at bay number %s. \n', vehicle.HPHM, vehicle.CDBH);
                        this._sendApiRequest(vehicle, 'enter'); 
                    } else {
                        console.log('Vehicle (License Plate: %s) has been on Bay number %s for less than 2 mins. \n', vehicle.HPHM, vehicle.CDBH);
                    }
                }
            } else {
                // No previous record. 
                console.log('Send enter status for License Plate: %s at bay number %s. \n', vehicle.HPHM, vehicle.CDBH);
                this._sendApiRequest(vehicle, 'enter'); 
            }
        });
    }

    /**
     * Send POST request to SETEL api.
     * 
     * @param vehicle 
     * @param status 
     */
    private _sendApiRequest(vehicle: DataFields, status: string): void {
        this._setel.vehicleStatus({
            "eventType" : status, 
            "timestamp" : new Date(vehicle.JGSJ).toISOString(), 
            "licensePlateNumber": vehicle.HPHM, 
            "pumpNumber": Number(vehicle.CDBH), 
            "stationId": process.env.STATION_ID
        }).then((result) => { 
            if (result != null) {
                console.log(result.status, ':' , result.statusText);
            }
        }).catch(e => {
            console.log('Error occured: ', e);
        });
    }
} 

// Load env file
config({ path: resolve(__dirname, "../.env") }); 
let watcher = new KedaComWatch; 
watcher.watchLogDir();