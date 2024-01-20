import express from 'express';
import dotenv from 'dotenv';
import Pool from 'pg';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { authRouter } from './auth/routes';
import { credRouter } from './cred/routes';
import { initNeo4JDriver } from './cred';
import { initpgdb, testPGConnection } from './dbmanager/initdb';

dotenv.config();

initNeo4JDriver();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlScriptPath = path.join(__dirname, "./dbmanager/initpgdb.sql");
const sqlScript = fs.readFileSync(sqlScriptPath, "utf-8");
const pool = new Pool.Pool({
    user: process.env.PGDBUSERNAME,
    host: process.env.PGDBHOST,
    database: process.env.PGDBNAME,
    password: process.env.PGDBPASSWORD,
    port: parseInt(process.env.PGDBPORT || '3600')
});

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.WEBPORT;

Promise.all([
    initpgdb(pool, sqlScript, process.env.PGDBNAME),
    testPGConnection(pool)
]).then(() => {
    app.use('/auth', authRouter(pool));
    app.use('/cred', credRouter(pool));


    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch((error) => {
    console.error('Failed to initialize databases:', error);
});
