declare namespace NodeJS {
    export interface ProcessEnv {
        JWT_SECRET: string;
        PGDBUSERNAME: string;
        PGDBHOST: string;
        PGDBNAME: string;
        PGDBPASSWORD: string;
        PGDBPORT: string;
        WEBPORT: string;

        NEO4J_URI: string;
        NEO4J_PW_MANAGER_DB: string;
        NEO4J_USERNAME: string;
        NEO4J_PASSWORD: string;
    }
}
