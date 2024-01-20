import pg from 'pg';

let pool: pg.Pool;

function createPool() {
    const pool = new pg.Pool({
        user: process.env.PGDBUSERNAME,
        host: process.env.PGDBHOST,
        database: process.env.PGDBNAME,
        password: process.env.PGDBPASSWORD,
        port: parseInt(process.env.PGDBPORT || '')
    });

    return pool;
}

export function getPool() {
    if (!pool) pool = createPool();
    return pool;
}
