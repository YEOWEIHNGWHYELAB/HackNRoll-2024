import express, { Application } from 'express';
import dotenv from 'dotenv';
import Pool from 'pg';
import cors from 'cors';

import { authRouter } from './auth/routes';

dotenv.config();

const pool = new Pool.Pool({
    user: process.env.PGDBUSERNAME,
    host: process.env.PGDBHOST,
    database: process.env.PGDBNAME,
    password: process.env.PGDBPASSWORD,
    port: parseInt(process.env.PGDBPORT || '')
});

const app: Application = express();
app.use(express.json());

app.use(cors());

const port = process.env.WEBPORT;

app.use('/auth', authRouter(pool));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
