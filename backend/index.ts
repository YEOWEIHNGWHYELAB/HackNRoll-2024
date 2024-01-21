import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import sgMail from '@sendgrid/mail';
import { fileURLToPath } from 'url';
import postmark from 'postmark';

import { authRouter } from './auth/routes';
import { credRouter } from './cred/routes';
import { initNeo4JDriver } from './cred';
import { initpgdb, testPGConnection } from './dbmanager/initdb';

dotenv.config();

initNeo4JDriver();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlScriptPath = path.join(__dirname, './dbmanager/initpgdb.sql');
const sqlScript = fs.readFileSync(sqlScriptPath, 'utf-8');

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.WEBPORT;

const pmClient = new postmark.ServerClient("af33ae9b-951a-4670-91df-1f2105cfecbe");

Promise.all([initpgdb(sqlScript, process.env.PGDBNAME), testPGConnection()])
    .then(() => {
        app.use('/auth', authRouter());
        app.use('/cred', credRouter(pmClient));

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Failed to initialize databases:', error);
    });
