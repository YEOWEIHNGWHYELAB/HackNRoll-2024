import neo4j, { Driver } from 'neo4j-driver';

export let n4jDriver: Driver;

export function initNeo4JDriver() {
    n4jDriver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
    );
}
