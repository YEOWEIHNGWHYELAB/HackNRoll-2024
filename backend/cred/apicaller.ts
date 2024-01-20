import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { n4jDriver } from '.';
import { checkAuthHeader } from '../auth/jwtmanager';

type N4JNode = {
    elementId: string;
    identity: { low: number; high: number };
    labels: string[];
    properties: Record<string, string>;
};

type N4JEdge = {
    elementId: string;
    startNodeElementId: string;
    endNodeElementId: string;
    start: { low: number; high: number };
    end: { low: number; high: number };
    identity: { low: number; high: number };
    properties: Record<string, string>;
    type: string;
};

type D3Node = {
    id: string;
    name: string;
    group: string;
    properties: Record<string, string>;
};

type D3Edge = {
    id: string;
    source: string;
    target: string;
    value: string | number;
    properties: Record<string, string>;
};

/**
 * Create credential node
 */
async function addCred(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const newNode = req.body;
            const label = newNode.label;
            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                const result = await session.run(
                    `
                    CREATE (n:${label} {${Object.entries(newNode)
                        .filter(([key, value]) => key !== 'label' && value !== undefined)
                        .map(([key]) => `${key}: $${key}`)}})
                        RETURN n
                    `,
                    newNode
                );

                const createdNode = result.records[0].get('n');

                res.json({ message: 'Data inserted successfully', node: createdNode.properties });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error inserting data into Neo4j',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Create credential relation from a source node to a destination node
 */
async function addRelation(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const srcId = req.body.src_node_id;
            const destId = req.body.dest_node_id;
            const relationType = req.body.relation_type;
            const referenceProperties = req.body.reference_properties;
            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                await session.run(
                    `
                MATCH (srcNode)
                WHERE elementId(srcNode) = '${srcId}'
                MATCH (destNode)
                WHERE elementId(destNode) = '${destId}'
                CREATE (srcNode)-[r:${relationType}]->(destNode)
                SET r.relation_properties = $referenceProperties, r.created_by = "${
                    (decoded as jwt.JwtPayload).username
                }"
                `,
                    { referenceProperties }
                );

                res.json({ message: 'Relation added successfully' });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error adding relation into Neo4j',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Update credential node properties, you can specify a variable number of properties to update
 */
async function updateCredNode(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const updateNodeData = req.body;
            const updateID = updateNodeData.elementId;
            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            const paramArr: string[] = Object.entries(updateNodeData)
                .filter(
                    ([key, value]) => key !== 'elementId' && key !== 'label' && value !== undefined
                )
                .map(([key, value]) => `n.${key} = "${value}"`);
            const paramStr: string = paramArr.join(', ');

            try {
                const availableProperties = await session.run(`
                    MATCH (n)
                    WHERE elementId(n) = "${updateID}"
                    RETURN keys(n) AS propertyKeys`);

                const keyarr: string[] = availableProperties.records[0].get('propertyKeys');

                for (let i = 0; i < keyarr.length; i++) {
                    if (updateNodeData[keyarr[i]] === undefined && keyarr[i] !== 'created_by') {
                        await session.run(
                            `
                            MATCH (n)
                            WHERE elementId(n) = "${updateID}"
                            REMOVE n.${keyarr[i]}
                            `
                        );
                    }
                }

                const result = await session.run(
                    `
                    MATCH (n)
                    WHERE elementId(n) = "${updateID}"
                    SET ${paramStr}
                    RETURN n
                    `,
                    updateNodeData
                );

                const createdNode = result.records[0].get('n');

                res.json({ message: 'Data updated successfully', node: createdNode.properties });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error updating credential properties into Neo4j',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Update a relation properties
 */
async function updateRelationProperties(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const updateID = req.body.elementId;
            const referenceProperties = req.body.reference_properties;

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                await session.run(
                    `
                    MATCH ()-[r]-()
                    WHERE elementId(r) = "${updateID}"
                    SET r.relation_properties = $referenceProperties
                    `,
                    { referenceProperties }
                );

                res.json({ message: 'Relation properties updated successfully' });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error updating relation into Neo4j',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            console.error(err);
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Delete a selected node by its elementId, but it will delete all relation attached to it too
 */
async function deleteNode(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const nodeToDelete = req.body;
            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                await session.run(
                    `
                    MATCH (n)
                    WHERE elementId(n) = "${nodeToDelete.elementId}"
                    DETACH DELETE n
                    `
                );

                res.json({ message: 'Data deleted successfully' });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error deleting node',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Delete a selected relation by its elementId
 */
async function deleteRelation(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const deletionId = req.body.elementId;

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                await session.run(
                    `
                    MATCH ()-[r]-()
                    WHERE elementId(r) = "${deletionId}"
                    DELETE r;
                    `
                );

                res.json({ message: 'Relation deleted successfully' });
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error deleting relation',
                        message: error.message
                    });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

async function getFullGraph(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                const edgeResult = await session.run(`
                    MATCH ()-[r]->() 
                    WHERE r.created_by = "${(decoded as jwt.JwtPayload).username}"
                    RETURN r`);
                const n4jEdges = edgeResult.records.map((rec) => rec.get('r') as N4JEdge);

                const nodeResults = await session.run(`
                    MATCH (n)
                    WHERE n.created_by = "${(decoded as jwt.JwtPayload).username}" 
                    RETURN (n)`);
                const n4jNodes = nodeResults.records.map((rec) => rec.get('n') as N4JNode);

                const d3Nodes = n4jNodes.reduce((acc: D3Node[], cur) => {
                    if (acc.some((n) => n.id === cur.elementId)) return acc;
                    // const displayName = (Object.values(cur.properties) ?? [''])[0];
                    const category = cur.labels.join(', ');
                    return [
                        ...acc,
                        {
                            id: cur.elementId,
                            name: `${category}`,
                            group: 'default',
                            properties: cur.properties
                        }
                    ];
                }, []);

                const d3Edges = n4jEdges.map((e) => {
                    return {
                        id: e.elementId,
                        source: e.startNodeElementId,
                        target: e.endNodeElementId,
                        value: e.type,
                        properties: e.properties
                    } as D3Edge;
                });

                return { nodes: d3Nodes, links: d3Edges };
            } catch (error) {
                if (error instanceof Error) return { error };
                return { error: 'Unexpected value' };
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

export default {
    addCred,
    addRelation,
    getFullGraph,
    updateCredNode,
    updateRelationProperties,
    deleteNode,
    deleteRelation
};
