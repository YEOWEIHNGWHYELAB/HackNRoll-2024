import express, { type Request, type Response } from 'express';
import { type Pool } from 'pg';
import authController from './apicaller';

const router = express.Router();

export function authRouter(pool: Pool) {
    // Register user
    router.post('/register', (req: Request, res: Response) => {
        authController.register(req, res, pool);
    });

    // Login user
    router.post('/login', (req: Request, res: Response) => {
        authController.login(req, res, pool);
    });

    // whoami
    router.get('/whoami', (req: Request, res: Response) => {
        authController.getUsername(req, res);
    });

    return router;
}
