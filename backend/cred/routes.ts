import express, { Request, Response } from 'express';
import multer from 'multer';
import credController from './apicaller';

const router = express.Router();
const tempstorage = multer({ dest: '../tempstorage/' });

export function credRouter() {
    // Create credential node
    router.post('/add', (req: Request, res: Response) => {
        credController.addCred(req, res);
    });

    // Upload CSV file
    router.post('/addcsv', tempstorage.single('File'), (req: Request, res: Response) => {
        credController.uploadCSV(req, res);
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

    // Check if credential password similar to old password
    router.post('/checkpwd', async (req: Request, res: Response) => {
        credController.checkPassword(req, res);
    });

    // Find credential
    router.post('/getcred', async (req: Request, res: Response) => {
        credController.findCredential(req, res);
    });

    // Update credential node properties
    router.patch('/add', (req: Request, res: Response) => {
        credController.updateCredNode(req, res);
    });

    // Update credential relation properties, if you want to update a relationship, delete the
    // existing one and create a new one
    router.patch('/relation', (req: Request, res: Response) => {
        credController.updateRelationProperties(req, res);
    });

    // Delete credential node
    router.post('/delete', (req: Request, res: Response) => {
        credController.deleteNode(req, res);
    });

    // Delete relation
    router.post('/deleterelation', (req: Request, res: Response) => {
        credController.deleteRelation(req, res);
    });

    router.post('/clearBreached', (req: Request, res: Response) => {
        credController.clearBreached(req, res);
    });

    return router;
}
