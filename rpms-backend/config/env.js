/**
 * Centralised environment loading + validation.
 *
 * Required first (before anything that reads process.env) by server.js.
 * Looks for config/.env first, then falls back to a .env at the backend root
 * so either layout works.
 */
const path = require('path');
const fs = require('fs');

const candidates = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env'),
];

const envPath = candidates.find((candidate) => fs.existsSync(candidate));

if (envPath) {
    require('dotenv').config({ path: envPath });
} else {
    require('dotenv').config();
}

const REQUIRED_KEYS = [
    'DB_USER',
    'DB_PASSWORD',
    'DB_CONNECTION_STRING',
    'JWT_SECRET',
];

const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);

if (missing.length > 0) {
    console.error(
        '\nMissing required environment variables: ' + missing.join(', ') +
        '\nCopy rpms-backend/config/.env.example to rpms-backend/config/.env and fill in your values.\n'
    );
    process.exit(1);
}

const config = {
    envPath: envPath || null,
    port: Number(process.env.PORT) || 5000,
    db: {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECTION_STRING,
        poolMin: Number(process.env.DB_POOL_MIN) || 2,
        poolMax: Number(process.env.DB_POOL_MAX) || 10,
        poolIncrement: Number(process.env.DB_POOL_INCREMENT) || 2,
        // Optional: only needed if you must run node-oracledb in Thick mode
        // (e.g. connecting to Oracle Database 11.2 or older).
        clientLibDir: process.env.ORACLE_CLIENT_LIB_DIR || null,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    },
    corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
