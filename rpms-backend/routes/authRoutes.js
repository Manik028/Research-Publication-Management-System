const express = require('express');
const router = express.Router();
const {
    register,
    login,
    verifyTwoFactor,
    forgotPassword,
    resetPassword,
    changePassword,
    setTwoFactorEnabled,
    me,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/verify-2fa - second step of login when 2FA is enabled
router.post('/verify-2fa', verifyTwoFactor);

// POST /api/auth/forgot-password - always responds the same way whether
// or not the email exists (see controller for why).
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password - email + otp + newPassword
router.post('/reset-password', resetPassword);

// PUT /api/auth/change-password - logged-in user changes their own password
router.put('/change-password', verifyToken, changePassword);

// PUT /api/auth/two-factor - toggle for the logged-in user's own account
router.put('/two-factor', verifyToken, setTwoFactorEnabled);

// GET /api/auth/me - current session user, straight from the database
router.get('/me', verifyToken, me);

module.exports = router;
