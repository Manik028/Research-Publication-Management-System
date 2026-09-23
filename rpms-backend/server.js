// Environment must be loaded before anything reads process.env.
const config = require('./config/env');

const express = require('express');
const cors = require('cors');

const { initializeDB, closeDB, executeQuery } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const pubRoutes = require('./routes/pubRoutes');
const projectRoutes = require('./routes/projectRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const venueRoutes = require('./routes/venueRoutes');
const institutionRoutes = require('./routes/institutionRoutes');
const researchAreaRoutes = require('./routes/researchAreaRoutes');
const fileRoutes = require('./routes/fileRoutes');
const grantRoutes = require('./routes/grantRoutes');
const awardRoutes = require('./routes/awardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const moderationRoutes = require('./routes/moderationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ---------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------
// Health checks
// ---------------------------------------------------------------
app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'RPMS Backend is running' });
});

// Verifies the Oracle pool can actually hand out a working connection.
app.get('/api/health/db', async (req, res) => {
    try {
        const result = await executeQuery('SELECT 1 AS OK FROM DUAL');
        res.status(200).json({
            success: true,
            message: 'Oracle database reachable',
            data: result.rows[0],
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'Oracle database unreachable',
            error: error.message,
        });
    }
});

// ---------------------------------------------------------------
// Route bindings
// ---------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/publications', pubRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/research-areas', researchAreaRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/grants', grantRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---------------------------------------------------------------
// 404 + error handling (must be last)
// ---------------------------------------------------------------
app.use('/api', notFound);
app.use(errorHandler);

// ---------------------------------------------------------------
// Startup
// ---------------------------------------------------------------
let server;

async function start() {
    try {
        await initializeDB();
    } catch (err) {
        console.error('\nCould not connect to the Oracle database.');
        console.error('Check DB_USER / DB_PASSWORD / DB_CONNECTION_STRING in config/.env');
        console.error('Reason:', err.message, '\n');
        process.exit(1);
    }

    server = app.listen(config.port, () => {
        console.log(`RPMS backend listening on http://localhost:${config.port}`);
        console.log(`Health check: http://localhost:${config.port}/api/health/db`);
    });
}

async function shutdown(signal) {
    console.log(`\n${signal} received, shutting down...`);
    if (server) server.close();
    await closeDB();
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Only start the server when run directly, so the app can be imported in tests.
if (require.main === module) {
    start();
}

module.exports = app;
