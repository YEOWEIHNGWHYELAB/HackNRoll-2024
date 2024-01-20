import express, { Request, Response } from 'express';
import Pool from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Provides the JWT Options
export const jwtOptions = () => {
    const token_id = crypto.randomBytes(16).toString('hex');
    const options = { algorithm: 'HS256', expiresIn: '1h', jwtid: token_id };
    return options;
}

// Generate the JWT token
export async function generateToken(user : string, res : Response, isRegister = false) {
    const payload = { username: user };
    const options = jwtOptions();

    try {
        // Token is valid, sign it and return the token string
        const token = await jwt.sign(payload, process.env.JWT_SECRET, options);

        // Return token
        if (isRegister) {
            // Registration
            res.json({ message: 'User created successfully', token: token });
        } else {
            // Login
            res.json({ message: 'Login successfully', token: token });
        }
    } catch (err) {
        // console.error(err);
        res.json("Fail to genereate token");
    }
}

// Check if the auth header exist
export function checkAuthHeader(authHeader : string, res : Response) {
    if (!authHeader) {
        return "";
    }

    if (!authHeader.startsWith("Bearer ")) {
        return "";
    }

    return authHeader.split(" ")[1];
}
