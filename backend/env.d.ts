declare namespace NodeJS {
    export interface ProcessEnv {
        JWT_SECRET: string;
        PGDBUSERNAME: string;
        PGDBHOST: string;
        PGDBNAME: string;
        PGDBPASSWORD: string;
        PGDBPORT: string;
        WEBPORT: string;
    }
}
