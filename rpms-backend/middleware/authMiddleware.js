const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Requires a valid Bearer token and populates req.user with { id, role, email }.
 */
const verifyToken = (req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const [scheme, token] = header.split(' ');

    if (!token || !/^Bearer$/i.test(scheme)) {
        return res.status(401).json({
            success: false,
            message: '401 Unauthorized: No token provided',
        });
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) {
            const expired = err.name === 'TokenExpiredError';
            return res.status(401).json({
                success: false,
                message: expired
                    ? '401 Unauthorized: Session expired, please log in again'
                    : '401 Unauthorized: Invalid token',
            });
        }

        req.user = { ...decoded, id: Number(decoded.id) };
        next();
    });
};

/**
 * Same as verifyToken but does not reject anonymous callers. Used by endpoints
 * that are publicly readable yet behave differently when signed in.
 */
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization || req.headers.Authorization || '';
    const [scheme, token] = header.split(' ');

    if (!token || !/^Bearer$/i.test(scheme)) return next();

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (!err && decoded) {
            req.user = { ...decoded, id: Number(decoded.id) };
        }
        next();
    });
};

const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: Insufficient role permissions',
            });
        }
        next();
    };
};

module.exports = { verifyToken, optionalAuth, authorizeRole };
