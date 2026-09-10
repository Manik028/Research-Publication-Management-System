/**
 * Standalone role guard, kept for compatibility with existing imports.
 * Mount it after verifyToken so req.user is populated.
 *
 * Usage: router.post('/', verifyToken, roleGuard('Admin'), handler)
 */
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: Your role does not have permission to access this resource.',
            });
        }
        next();
    };
};

module.exports = roleGuard;
