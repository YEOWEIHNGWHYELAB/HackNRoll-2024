import { type Pool } from 'pg';

async function initpgdb(pool: Pool, sqlScript: string, dbName: string) {
    try {
        await pool.query(sqlScript);
        console.log(`Completed initialization to database: ${dbName}`);
    } catch(error) {
        console.log("Error connecting to PostgreSQL database", error);
    }
};

async function testPGConnection(pool: Pool) {
    try {
        const resultTime = await pool.query('SELECT NOW()');
        console.log('Connected to PostgresDB at', resultTime.rows[0].now);
    } catch(error) {
        console.error('Error connecting to Postgres Database', error);
    }
}

export { initpgdb, testPGConnection };