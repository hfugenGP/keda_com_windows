export interface Dsn {
    host?: string; 
    user?: string; 
    password?: string;
}

export interface SetelRequest {
    eventType: string;
    timestamp: string; 
    licensePlateNumber: string;
    pumpNumber: number;
    stationId: string | undefined;
}

export interface DataColumns {
    name: string; 
    charset: string; 
    type: number; 
    metadata: any;
}

export interface DataFields {
    DLDM: string; 
    CLBH: number;
    CDBH: string; 
    HPHM: string; 
    HPYS: string; 
    HPZL: string; 
    JGSJ: string; 
    TPID: string; 
    CS: number;
    GXBZ: string; 
    GXSJ: string; 
    CLSD: string; 
    SBSJ: number;
    HPJG: number;
    HPSL: number;
    SBZT: string; 
    CSYS: string; 
    XSFX: string; 
    CC: number;
    CLLX: string; 
    CDLX: number;
    CBLX: string; 
    YZYS: number;
    TPSL: number;
    WFLX: string; 
    XS: number;
    HDSJ: number;
    CJFS: string; 
    CJBM: string; 
    HDBJ: string; 
    WFDD: string; 
    CSYSSQ: number;
    FZGXBZ: string; 
    HPZBX: number;
    HPZBY: number;
    UPBZ: string; 
}

export interface NewRow {
    database: string; 
    table: string; 
    affectedColumns: DataColumns[]; 
    changedColumns: [];
    fields: DataFields;
} 