import { getPool } from '../auth/pool';

async function initpgdb(sqlScript: string, dbName: string) {
    try {
        await getPool().query(sqlScript);
        console.log(`Completed initialization to database: ${dbName}`);
    } catch (error) {
        console.log('Error connecting to PostgreSQL database', error);
    }
}

async function testPGConnection() {
    try {
        const resultTime = await getPool().query('SELECT NOW()');
        console.log('Connected to PostgresDB at', resultTime.rows[0].now);
    } catch (error) {
        console.error('Error connecting to Postgres Database', error);
    }
}

export { initpgdb, testPGConnection };
