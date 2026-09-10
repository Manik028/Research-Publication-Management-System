/**
 * 404 handler for unknown /api routes, plus a catch-all error handler so the
 * client always receives JSON instead of Express' default HTML error page
 * (which used to make res.json() throw in the frontend).
 */
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `404 Not Found: ${req.method} ${req.originalUrl}`,
    });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled error:', err);

    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.status ? err.message : 'Internal server error',
    });
};

module.exports = { notFound, errorHandler };
