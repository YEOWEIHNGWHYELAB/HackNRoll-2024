import express, { type Request, type Response } from 'express';
import authController from './apicaller';

const router = express.Router();

export function authRouter() {
    // Register user
    router.post('/register', (req: Request, res: Response) => {
        authController.register(req, res);
    });

    // Login user
    router.post('/login', (req: Request, res: Response) => {
        authController.login(req, res);
    });

    // whoami
    router.get('/whoami', (req: Request, res: Response) => {
        authController.getUsername(req, res);
    });

    return router;
}
