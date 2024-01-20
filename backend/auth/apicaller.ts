import { Request, Response } from 'express';
import { type Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { n4jDriver } from '../cred/index';
import { generateToken } from './jwtmanager';

// Register user
async function register(req: Request, res: Response, pool: Pool) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json('Username and password are required');
    }

    try {
        // Check if user already exists
        const queryResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = queryResult.rows[0];

        if (user) {
            return res.status(400).json('Username already taken');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const insertResult = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        );
        const newUser = insertResult.rows[0];

        // Sign JWT token
        generateToken(newUser.username, res, true);

        const session = n4jDriver.session();

        try {
            await session.run(`CREATE (:RootInfo {email: "${email}", username: "${username}", created_by: "${username}"});`);
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
        console.error(err);
        res.status(400).json('Registration Error');
    }
}

// Login user
async function login(req: Request, res: Response, pool: Pool) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json('Username and password are required');
    }

    try {
        // Check if user exists
        const queryResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = queryResult.rows[0];

        if (!user) {
            return res.status(400).json('Invalid username or password');
        }

        // Check if password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json('Invalid username or password');
        }

        // Sign JWT token
        generateToken(user.username, res, false);
    } catch (err) {
        res.status(400).json('Login Error');
    }
}

// whoami
async function getUsername(req: Request, res: Response) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.json('Authorization header missing');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256'],
            ignoreExpiration: false
        });

        res.json({ username: (decoded as jwt.JwtPayload).username });
    } catch (err) {
        res.status(400).json('Please login again!');
    }
}

export default { getUsername, login, register };
