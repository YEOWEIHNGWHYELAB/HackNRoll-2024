import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import csvParser from 'csv-parser';
import { n4jDriver } from '.';
import { checkAuthHeader } from '../auth/jwtmanager';
import pwdUtils from './utils';
import { getPool } from '../auth/pool';
import { D3Edge, D3Node, N4JEdge, N4JNode } from './types';
import { session } from 'neo4j-driver';

async function createRelationFromCSVRows(
    filePath: string,
    decoded: string | jwt.JwtPayload,
    res: Response
) {
    // console.log('Starting Relation Parsing Here!');
    const credSet: Set<string> = new Set();

    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            if (!credSet.has(pwdUtils.getDomainName(row.url) + row.username)) {
                credSet.add(pwdUtils.getDomainName(row.url) + row.username);

                pwdUtils.buildNodeRelations(row, n4jDriver, (decoded as jwt.JwtPayload).username);
            }
        })
        .on('end', () => {
            // Delete the file after reading
            fs.unlinkSync(filePath);
            res.json({ message: 'Credential uploaded successfully' });
        });
}

async function uploadCSV(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            const result = await session.run(`
                MATCH (n)
                WHERE n.created_by = "${(decoded as jwt.JwtPayload).username}"
                RETURN count(n) AS numberOfNodes;
            `);

            const filePath = req.file.path;
            const credSet: Set<string> = new Set();
            let nodeCreatePromises: Promise<void>[] = [];

            fs.createReadStream(filePath)
                .pipe(csvParser())
                .on('data', (row) => {
                    // Log each line of the CSV file
                    // console.log(row);
                    if (!credSet.has(pwdUtils.getDomainName(row.url) + row.username)) {
                        credSet.add(pwdUtils.getDomainName(row.url) + row.username);
                        const nodeCreatePromise = pwdUtils.readCredNUpdate(
                            row,
                            n4jDriver,
                            (decoded as jwt.JwtPayload).username
                        );
                        nodeCreatePromises = [...nodeCreatePromises, nodeCreatePromise];
                    }
                })
                .on('end', async () => {
                    await Promise.all(nodeCreatePromises);

                    if (result.records[0].get('numberOfNodes').low <= 1) {
                        createRelationFromCSVRows(filePath, decoded, res);
                    } else {
                        // Delete the file after reading
                        fs.unlinkSync(filePath);
                        res.json({ message: 'Credential uploaded successfully' });
                    }
                });
        } catch (err) {
            console.log(err);
            res.status(400).json('Not authenticated');
        }
    }
}

/**
 * Create credential node
 */
async function addCred(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
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

                if (newNode.password) {
                    await getPool().query(
                        `
                        INSERT INTO PasswordHistory (username, element_id, password, time_changed)
                        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                        [
                            (decoded as jwt.JwtPayload).username,
                            createdNode.elementId,
                            newNode.password
                        ]
                    );
                }

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
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const updateNodeData = req.body;
            const updateID = updateNodeData.elementId;
            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            const paramArr: string[] = Object.entries(updateNodeData)
                .filter(
                    ([key, value]) =>
                        key !== 'password' &&
                        key !== 'elementId' &&
                        key !== 'label' &&
                        value !== undefined
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

                // Check if the password is updated
                const old_pwd_result = await getPool().query(`
                    SELECT password
                    FROM passwordhistory
                    WHERE element_id = '${updateID}'
                    ORDER BY time_changed DESC
                    LIMIT 1
                `);

                const oldPwd = old_pwd_result.rows[0].password;

                if (oldPwd !== updateNodeData.password) {
                    await getPool().query(
                        `
                        INSERT INTO PasswordHistory (username, element_id, password, time_changed)
                        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                        [(decoded as jwt.JwtPayload).username, updateID, updateNodeData.password]
                    );

                    await session.run(
                        `
                        MATCH (n)
                        WHERE elementId(n) = "${updateID}"
                        SET n.password = '${updateNodeData.password}'
                        RETURN n
                    `
                    );
                }

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

async function clearBreached(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            // TODO: REPLACE ME WITH REAL TABLE
            try {
                const elementId = req.body.elementId as string;
                await getPool().query(
                    `
                UPDATE BreachedNodes
                SET active=false, breached=false
                WHERE element_id=$1
            `,
                    [elementId]
                );
                res.status(200).json({ message: 'Breached cleared successfully' });
            } catch (err) {
                res.status(400).json('Error with database query: ' + err);
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

                let d3Nodes = n4jNodes.reduce((acc: D3Node[], cur) => {
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

                d3Nodes = await Promise.all(
                    d3Nodes.map(async (node) => {
                        const breached = await checkBreached(node.id);
                        return { ...node, breached };
                    })
                );

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

async function findCredential(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                const currLabel = req.body.label as string;

                const result = await session.run(`
                    MATCH (n:${currLabel})
                    WHERE n.created_by = "${(decoded as jwt.JwtPayload).username}"
                    RETURN n;
                `);

                // Return the number of records
                res.json({
                    num_match: result.records.length,
                    username:
                        result.records.length > 0
                            ? result.records[0].get('n').properties.username
                            : null,
                    email:
                        result.records.length > 0
                            ? result.records[0].get('n').properties.email
                            : null,
                    password:
                        result.records.length > 0
                            ? result.records[0].get('n').properties.password
                            : null
                });
            } catch (error) {
                res.status(500).json({ error: 'Error finding credential', message: error });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    } else {
        res.status(400).json('Not authenticated');
    }
}

async function storeCredential(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            try {
                const currData = {
                    url: req.body.url,
                    username: req.body.username,
                    password: req.body.password
                };

                const nodeCreatePromise = pwdUtils.readCredNUpdate(
                    currData,
                    n4jDriver,
                    (decoded as jwt.JwtPayload).username
                );

                await Promise.all([nodeCreatePromise]);

                // Return the number of records
                res.json({
                    message: 'Stored credentials!'
                });
            } catch (error) {
                res.status(500).json({ error: 'Error finding credential', message: error });
            } finally {
                await session.close();
            }
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    } else {
        res.status(400).json('Not authenticated');
    }
}

async function checkPassword(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const updateNodeData = req.body;
            const updateID = updateNodeData.elementId;

            // Check if the password is updated
            const oldPwdHistoryArr = await getPool().query(`
                SELECT password
                FROM passwordhistory
                WHERE element_id = '${updateID}' AND username = '${
                    (decoded as jwt.JwtPayload).username
                }'
            `);

            for (let i = 0; i < oldPwdHistoryArr.rows.length; i++) {
                if (
                    pwdUtils.isPasswordSimilar(
                        updateNodeData.password,
                        oldPwdHistoryArr.rows[i].password,
                        3
                    )
                ) {
                    return res.json({
                        is_similar: true,
                        message: 'Password is too similar to the old password'
                    });
                }
            }

            res.json({ is_similar: false, message: 'Password is not similar to the old password' });
        } catch (err) {
            res.status(400).json('Not authenticated');
        }
    }
}

async function checkBreached(elementId: string): Promise<boolean> {
    // TODO: REPLACE IWTH ACTUAL PG QUERY
    const pgRes = await getPool().query(
        `
        SELECT * 
        FROM BreachedNodes
        WHERE element_id=$1
            AND active=true 
            AND breached=true
        `,
        [elementId]
    );
    return (pgRes.rowCount ?? 0) > 0;
}

async function getRelatedNodes(elementId: string) {
    const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

    const relatedNodes = [];

    try {
        const nodeResults = await session.run(`
            MATCH (targetNode)<-[r]-(relatedNode)
            WHERE elementId(targetNode) = '${elementId}'
            RETURN r, relatedNode`);

        for (let i = 0; i < nodeResults.records.length; i++) {
            relatedNodes.push(nodeResults.records[i].get('relatedNode'));
        }

        return relatedNodes;
    } catch (error) {
        console.log(error);
    } finally {
        await session.close();
    }
}

async function addBreached(req: Request, res: Response) {
    const authHeader = req.headers.authorization as string;
    const token = checkAuthHeader(authHeader, res);

    if (token !== '') {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256']
            });

            const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

            console.log('Starting Breach Checking Here!');

            let nodeRecords = [];

            // Randomly choose nodes to mark as breached
            try {
                const nodeResults = await session.run(`
                    MATCH (n)
                    WHERE n.created_by = "${(decoded as jwt.JwtPayload).username}" 
                    RETURN (n)`);

                for (let i = 0; i < nodeResults.records.length; i++) {
                    nodeRecords.push(nodeResults.records[i].get('n'));
                }
            } catch (error) {
                if (error instanceof Error)
                    res.status(500).json({
                        error: 'Error updating relation into Neo4j',
                        message: error.message
                    });
            } finally {
                await session.close();
            }

            let marked = false;

            // Performing DFS/BFS to find all nodes connected to the breached node
            for (let i = 0; i < nodeRecords.length; i++) {
                let q = [];

                if (Math.random() < 0.1) {
                    q.push(nodeRecords[i]);
                    marked = true;
                }

                while (q.length > 0) {
                    let currNode = q.shift();

                    // Perform mark breached here
                    await getPool().query(
                        `
                        INSERT INTO BreachedNodes (element_id, breached, active)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (element_id)
                        DO UPDATE SET (breached, active) = ($2, $3)`,
                        [currNode.elementId, true, true]
                    );

                    let relatedNodes = await getRelatedNodes(currNode.elementId);

                    for (let j = 0; j < relatedNodes.length; j++) {
                        q.push(relatedNodes[j]);
                    }
                }

                if (i == nodeRecords.length - 1 && !marked) {
                    q.push(nodeRecords[i]);
                }

                // console.log('Start: ' + nodeRecords[i].elementId);
                // console.log('End: ' + relatedNodes);
            }

            res.json({ message: 'Successfully checked breaches!' });
        } catch (err) {
            console.log(err);
            res.status(400).json('Not authenticated');
        }
    }
}

export default {
    addCred,
    addRelation,
    getFullGraph,
    checkPassword,
    findCredential,
    storeCredential,
    updateCredNode,
    updateRelationProperties,
    deleteNode,
    deleteRelation,
    clearBreached,
    uploadCSV,
    addBreached
};
