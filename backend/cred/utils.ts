import { Driver } from 'neo4j-driver';
import validator from 'validator';
import { getPool } from '../auth/pool';

const knownURLs: string[] = [
    'reddit',
    'github',
    'facebook',
    'leetcode',
    'twitter',
    'ebay',
    'amazon',
    'google',
    'linkedin',
    'instagram',
    'stackoverflow',
    'netflix',
    'live',
    'tcscodevita',
    'talenox',
    'apple',
    'lenovo',
    'steam',
    'discord',
    'hackerrank',
    'epicgames',
    'nus'
];

/**
 * Warning:
 *
 * The ordering of authentication matters! You should order by specific authentication to general authentication (email)
 */
type AuthRelationTable = {
    [key: string]: string[];
};

const authRelationTable: AuthRelationTable = {
    leetcode: ['github', 'email'],
    reddit: ['apple', 'email'],
    github: ['email'],
    epicgames: ['steam', 'apple', 'email'],
    steam: ['email'],
    discord: ['email'],
    hackerrank: ['linkedin', 'github', 'email'],
    amazon: ['email'],
    linkedin: ['email']
};

/**
 * Email domain name lookup
 */
type EmailRelationTable = {
    [key: string]: string;
};

const emailRelationTable: EmailRelationTable = {
    'u.nus.edu': 'nus',
    'live.com': 'live',
    'hotmail.com': 'live',
    'icloud.com': 'apple',
    'gmail.com': 'google',
    'outlook.com': 'live'
};

const isEmail = (input: string): boolean => {
    return validator.isEmail(input);
};

function getDomainName(url: string): string | null {
    try {
        const parsedUrl = new URL(url);

        for (let i = 0; i < knownURLs.length; i++) {
            if (parsedUrl.hostname.includes(knownURLs[i])) {
                return knownURLs[i];
            }
        }
        return '';

        // return parsedUrl.hostname.replace(/^www\./, '').replace(/-/g, '');
    } catch (error) {
        // Handle invalid URLs or other parsing errors
        console.error(`Error parsing URL: ${url}`);
        return url;
    }
}

function isIPAddress(url: string): boolean {
    // Regular expression for matching an IPv4 address
    const ipv4Pattern =
        /^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$/;

    // Regular expression for matching an IPv6 address
    const ipv6Pattern =
        /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:|^([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$/;

    return ipv4Pattern.test(url) || ipv6Pattern.test(url);
}

function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Initialize a matrix to store distances
    const matrix: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    // Initialize the matrix with the distances from the empty string
    for (let i = 0; i <= m; i++) {
        matrix[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
        matrix[0][j] = j;
    }

    // Fill in the matrix with the minimum distances
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // Deletion
                matrix[i][j - 1] + 1, // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }

    // The bottom-right cell contains the Levenshtein distance
    return matrix[m][n];
}

function isPasswordSimilar(
    newPassword: string,
    oldPassword: string,
    similarityThreshold: number = 3
): boolean {
    const distance = levenshteinDistance(newPassword, oldPassword);
    return distance <= similarityThreshold;
}

/**
 * Build the relationship between nodes from the csv file
 */
async function buildNodeRelations(
    csvRow: Record<string, string>,
    n4jDriver: Driver,
    username: string
) {
    const domainName = getDomainName(csvRow.url);

    if (domainName === null || isIPAddress(domainName) || domainName.length <= 1) {
        return;
    }

    const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

    try {
        const result = await session.run(`
            MATCH (n:${domainName})
            WHERE n.created_by = "${username}" 
                AND (n.email = "${csvRow.username}" OR n.username = "${csvRow.username}")
            RETURN n;
        `);

        const currentNode = result.records[0].get('n').elementId;

        // console.log("Source: " + domainName + ", " + result.records[0].get('n').elementId);

        // Check for relavant relations
        if (authRelationTable[domainName] !== undefined) {
            let authRelationTarget;

            for (let i = 0; i < authRelationTable[domainName].length; i++) {
                authRelationTarget = authRelationTable[domainName][i];

                // console.log("Target: " + authRelationTarget);

                if (authRelationTarget === 'email') {
                    break;
                }

                const authResult = await session.run(`
                    MATCH (n:${authRelationTarget})
                    WHERE n.created_by = "${username}"
                        AND (n.email = "${csvRow.username}" OR n.username = "${csvRow.username}")
                    RETURN n;
                `);

                const isEmailProperty = isEmail(csvRow.username);
                const propertyRef = isEmailProperty ? 'email' : 'username';

                if (authResult.records.length > 0) {
                    const authNode = authResult.records[0].get('n').elementId;

                    await session.run(
                        `
                        MATCH (n1), (n2)
                        WHERE elementId(n1) = "${currentNode}" AND elementId(n2) = "${authNode}"
                        CREATE (n1)-[r:${authRelationTarget}_Relation]->(n2)
                        SET r.relation_properties = [$propertyRef], r.created_by = "${username}"
                    `,
                        { propertyRef }
                    );

                    return;
                }
            }

            if (authRelationTarget === 'email' && isEmail(csvRow.username)) {
                const emailDomainTarget = emailRelationTable[csvRow.username.split('@')[1]];

                const authResultEmail = await session.run(`
                    MATCH (n:${emailDomainTarget})
                    WHERE n.created_by = "${username}"
                        AND n.email = "${csvRow.username}"
                    RETURN n;
                `);

                if (authResultEmail.records.length > 0) {
                    const authNode = authResultEmail.records[0].get('n').elementId;

                    await session.run(`
                        MATCH (n1), (n2)
                        WHERE elementId(n1) = "${currentNode}" AND elementId(n2) = "${authNode}"
                        CREATE (n1)-[r:${emailDomainTarget}_Relation]->(n2)
                        SET r.relation_properties = ["email"], r.created_by = "${username}"
                    `);

                    return;
                }
            }
        }
    } catch (error) {
        if (error instanceof Error) console.error(`Error: ${error.message}`);
    } finally {
        await session.close();
    }
}

/**
 * Read a single row from the csv file and write to database if it does not exist, if it existupdate the database,
 * but for simplicity, we will only update nodes and not relation
 *
 * Note that each credential are identified by a combination of name and username from the chrome csv password
 * export, it does not apply for other browsers
 *
 * @param csvRow single row from the csv file
 */
async function readCredNUpdate(
    csvRow: Record<string, string>,
    n4jDriver: Driver,
    username: string
) {
    const domainName = getDomainName(csvRow.url);

    if (domainName === null || isIPAddress(domainName) || domainName.length <= 1) {
        return;
    }

    // console.log(domainName);

    const session = n4jDriver.session({ database: process.env.NEO4J_PW_MANAGER_DB });

    try {
        const result = await session.run(`
            MATCH (n:${domainName})
            WHERE n.created_by = "${username}" 
                AND (n.email = "${csvRow.username}" OR n.username = "${csvRow.username}")
            RETURN n;
        `);

        if (result.records.length > 0) {
            // Update password
            const existingElementID = result.records[0].get('n').elementId;

            if (result.records[0].get('n').properties.password !== csvRow.password) {
                // console.log(`Updating password for ${csvRow.url}, ${csvRow.username}`);

                // Query if password exist in history first
                const passwordHistoryResult = await getPool().query(
                    `
                    SELECT password
                    FROM PasswordHistory
                    WHERE username = $1 AND element_id = $2
                    `, [username, existingElementID]
                );

                let pwdExist: boolean = false;

                for (let i = 0; i < passwordHistoryResult.rows.length; i++) {
                    if (passwordHistoryResult.rows[i].password === csvRow.password) {
                        pwdExist = true;
                        break;
                    }
                }

                if (!pwdExist) {
                    await getPool().query(
                        `
                        INSERT INTO PasswordHistory (username, element_id, password, time_changed)
                        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                        [username, existingElementID, csvRow.password]
                    );
                }

                await session.run(`
                    MATCH (n)
                    WHERE elementId(n) = "${existingElementID}"
                    SET n.password = '${csvRow.password}'
                    RETURN n
                `);
            }
        } else {
            ``;
            // Create new node
            let currNewNode;

            if (isEmail(csvRow.username)) {
                currNewNode = await session.run(`
                    CREATE (n:${domainName} {
                        email: "${csvRow.username}",
                        password: "${csvRow.password}",
                        created_by: "${username}"
                    })
                    RETURN n;
                `);
            } else {
                currNewNode = await session.run(`
                    CREATE (n:${domainName} {
                        username: "${csvRow.username}",
                        password: "${csvRow.password}",
                        created_by: "${username}"
                    })
                    RETURN n;
                `);
            }

            const newNodeID = currNewNode.records[0].get('n').elementId;

            await getPool().query(
                `
                INSERT INTO PasswordHistory (username, element_id, password, time_changed)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
                [username, newNodeID, csvRow.password]
            );
        }
    } catch (error) {
        if (error instanceof Error) console.error(`Error: ${error.message}`);
    } finally {
        await session.close();
    }
}

export default {
    getDomainName,
    isPasswordSimilar,
    readCredNUpdate,
    buildNodeRelations
};
