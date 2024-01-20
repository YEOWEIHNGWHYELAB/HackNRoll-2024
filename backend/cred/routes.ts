import express, { Request, Response } from 'express';
import credController from './apicaller';

const router = express.Router();

export function credRouter() {
    // Create credential node
    router.post('/add', (req: Request, res: Response) => {
        credController.addCred(req, res);
    });

    // Create credential relation
    router.post('/relation', (req: Request, res: Response) => {
        credController.addRelation(req, res);
    });

    // Read full graph
    router.get('/fullGraph', async (req: Request, res: Response) => {
        const graph = await credController.getFullGraph(req, res);

        // if (graph.error) return res.status(400).json({ error: graph.error });

        return res.status(200).json(graph);
    });

    // Update credential node properties
    router.patch('/add', (req: Request, res: Response) => {
        credController.updateCredNode(req, res);
    });

    // Delete credential node property
    router.post('/deleteproperty', (req: Request, res: Response) => {
        credController.deleteNodeProperties(req, res);
    });

    // Delete credential node
    router.post('/delete', (req: Request, res: Response) => {
        credController.deleteNode(req, res);
    });

    return router;
}
