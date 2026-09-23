const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../models/userModel');

/**
 * Requires a valid Bearer token and populates req.user with { id, role, email }.
 * Also rejects tokens issued BEFORE the user's most recent password reset —
 * without this, RESET_PASSWORD would change the database row but every
 * already-issued JWT would keep working right up until its 8h expiry,
 * which defeats the point of a password reset (e.g. after a suspected
 * compromise). The token's `pwd` claim is the PASSWORD_CHANGED_AT value
 * at the moment it was issued; if the live value has moved on, the
 * session is stale and must re-authenticate.
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

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
        if (err) {
            const expired = err.name === 'TokenExpiredError';
            return res.status(401).json({
                success: false,
                message: expired
                    ? '401 Unauthorized: Session expired, please log in again'
                    : '401 Unauthorized: Invalid token',
            });
        }

        try {
            const currentPwdChangedAt = await UserModel.getPasswordChangedAt(Number(decoded.id));
            const currentTimestamp = currentPwdChangedAt ? new Date(currentPwdChangedAt).getTime() : 0;

            if (Number(decoded.pwd || 0) !== currentTimestamp) {
                return res.status(401).json({
                    success: false,
                    message: '401 Unauthorized: Your password was changed. Please log in again.',
                });
            }
        } catch (dbErr) {
            console.error('Error checking password-change invalidation:', dbErr);
            return res.status(500).json({ success: false, message: 'Internal server error' });
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