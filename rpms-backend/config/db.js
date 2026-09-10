const oracledb = require('oracledb');
const config = require('./env');

/**
 * Global node-oracledb defaults.
 *
 * fetchAsString for CLOB is essential here: PUBLICATION.ABSTRACT,
 * REVIEW.COMMENTS_AUTHOR / COMMENTS_EDITOR, RESEARCH_AREA.DESCRIPTION,
 * MODERATION_QUEUE.FLAG_REASON and NOTIFICATION.MESSAGE are all CLOBs.
 * Without this, oracledb returns Lob stream objects which serialise to `{}`
 * in res.json(), so the frontend silently shows empty abstracts/comments.
 */
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.autoCommit = true;

let pool = null;

async function initializeDB() {
    if (pool) return pool;

    // Thick mode is only required for very old database versions.
    if (config.db.clientLibDir) {
        try {
            oracledb.initOracleClient({ libDir: config.db.clientLibDir });
            console.log('Oracle Client initialised in Thick mode.');
        } catch (err) {
            console.error('Failed to initialise Oracle Thick client:', err.message);
            throw err;
        }
    }

    pool = await oracledb.createPool({
        user: config.db.user,
        password: config.db.password,
        connectString: config.db.connectString,
        poolMin: config.db.poolMin,
        poolMax: config.db.poolMax,
        poolIncrement: config.db.poolIncrement,
    });

    console.log(`Oracle DB connection pool created (${config.db.connectString}).`);
    return pool;
}

async function closeDB() {
    if (!pool) return;
    try {
        await pool.close(5);
        pool = null;
        console.log('Oracle DB connection pool closed.');
    } catch (err) {
        console.error('Error closing Oracle DB pool:', err);
    }
}

/**
 * Execute a parameterised SQL statement.
 *
 * NOTE: `options` is merged into the defaults rather than replacing them, so a
 * caller passing `{ autoCommit: true }` no longer accidentally drops
 * OUT_FORMAT_OBJECT (which used to return rows as arrays instead of objects).
 */
async function executeQuery(sql, binds = {}, options = {}) {
    const execOptions = {
        autoCommit: true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options,
    };

    let connection;
    try {
        connection = await oracledb.getConnection();
        return await connection.execute(sql, binds, execOptions);
    } catch (err) {
        console.error('SQL execution error:', err.message);
        console.error('Statement:', sql.trim().split('\n')[0].trim(), '...');
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing DB connection:', err);
            }
        }
    }
}

/**
 * Insert helper for IDENTITY primary keys.
 * Pass the SQL with a `RETURNING <pk> INTO :newId` clause.
 */
async function insertReturningId(sql, binds = {}) {
    const result = await executeQuery(sql, {
        ...binds,
        newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });
    return result.outBinds && result.outBinds.newId
        ? result.outBinds.newId[0]
        : null;
}

module.exports = { oracledb, initializeDB, closeDB, executeQuery, insertReturningId };
