import express from 'express';
import dotenv from 'dotenv';
import Pool from 'pg';
import cors from 'cors';

dotenv.config();

import { authRouter } from './auth/routes';
import { credRouter } from './cred/routes';
import { initNeo4JDriver } from './cred';

const pool = new Pool.Pool({
    user: process.env.PGDBUSERNAME,
    host: process.env.PGDBHOST,
    database: process.env.PGDBNAME,
    password: process.env.PGDBPASSWORD,
    port: parseInt(process.env.PGDBPORT || '')
});

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.WEBPORT;

app.use('/auth', authRouter(pool));
app.use('/cred', credRouter());

initNeo4JDriver();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
