const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../models/userModel');
const AuthOtpModel = require('../models/authOtpModel');
const { validatePassword } = require('../utils/passwordPolicy');
const { isPlsqlBusinessError, cleanPlsqlMessage } = require('../utils/plsqlErrors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Embeds PASSWORD_CHANGED_AT in the token so authMiddleware can tell a
// token apart from "issued before the user's most recent password reset" —
// that's what makes RESET_PASSWORD actually invalidate old sessions
// instead of just changing the DB row while old JWTs keep working.
function signToken(user) {
    return jwt.sign(
        {
            id: user.ID,
            role: user.ROLE,
            email: user.EMAIL,
            pwd: user.PASSWORD_CHANGED_AT ? new Date(user.PASSWORD_CHANGED_AT).getTime() : 0,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
}

const register = async (req, res) => {
    try {
        const { FULL_NAME, EMAIL, PASSWORD, DEPARTMENT, ORCID, ROLE } = req.body || {};

        if (!FULL_NAME || !EMAIL || !PASSWORD || !ROLE) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email, password and role are required',
            });
        }

        if (!EMAIL_PATTERN.test(EMAIL)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        const policyCheck = validatePassword(PASSWORD);
        if (!policyCheck.valid) {
            return res.status(400).json({ success: false, message: policyCheck.message });
        }

        // Resolve the role name coming from the UI into a ROLE_ID.
        const roleRecord = await UserModel.getRoleByName(ROLE);
        if (!roleRecord) {
            return res.status(400).json({
                success: false,
                message: `Invalid role "${ROLE}". Make sure database/seed.sql has been run.`,
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(PASSWORD, salt);

        const newId = await UserModel.createUser(
            FULL_NAME.trim(),
            EMAIL.trim().toLowerCase(),
            hashedPassword,
            DEPARTMENT ? DEPARTMENT.trim() : null,
            ORCID ? ORCID.trim() : null,
            roleRecord.ROLE_ID
        );

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { ID: newId },
        });
    } catch (error) {
        // ORA-00001: unique constraint violated (duplicate email)
        if (error.errorNum === 1) {
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await UserModel.getUserByEmail(String(email).trim().toLowerCase());

        // Same generic message for unknown user and bad password.
        if (!user || !user.PASSWORD) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(String(password), user.PASSWORD);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        delete user.PASSWORD;

        // 2FA branch: do NOT issue a JWT yet. Send an OTP and tell the
        // frontend to collect it via /api/auth/verify-2fa instead.
        if (Number(user.TWO_FACTOR_ENABLED) === 1) {
            const otpResult = await AuthOtpModel.issueOtp(user.ID, user.EMAIL, '2FA');
            if (otpResult.cooldown) {
                return res.status(429).json({
                    success: false,
                    message: `A code was already sent recently. Try again in ${otpResult.retryAfterSeconds}s.`,
                });
            }
            return res.status(200).json({
                success: true,
                twoFactorRequired: true,
                userId: user.ID,
                message: 'A verification code has been sent to your email.',
            });
        }

        const token = signToken(user);
        return res.status(200).json({ success: true, token, data: user });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const verifyTwoFactor = async (req, res) => {
    try {
        const { userId, otp } = req.body || {};

        if (!userId || !otp) {
            return res.status(400).json({ success: false, message: 'userId and otp are required' });
        }

        const result = await AuthOtpModel.verifyOtp(Number(userId), '2FA', String(otp).trim());

        if (!result.ok) {
            const messages = {
                NO_ACTIVE_OTP: 'No active verification code. Please log in again.',
                EXPIRED: 'This code has expired. Please log in again to get a new one.',
                TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Please log in again to get a new code.',
                INCORRECT: 'Incorrect code.',
            };
            return res.status(400).json({ success: false, message: messages[result.reason] || 'Verification failed.' });
        }

        const user = await UserModel.getUserById(Number(userId));
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const withPwdClaim = { ...user, PASSWORD_CHANGED_AT: await UserModel.getPasswordChangedAt(user.ID) };
        const token = signToken(withPwdClaim);

        return res.status(200).json({ success: true, token, data: user });
    } catch (error) {
        console.error('2FA verification error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Always returns the same generic message whether or not the email
// exists — prevents an attacker from using this endpoint to discover
// which emails are registered.
const forgotPassword = async (req, res) => {
    const GENERIC_MESSAGE = 'If an account exists for that email, a reset code has been sent.';
    try {
        const { email } = req.body || {};
        if (!email || !EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        const user = await UserModel.getUserByEmail(String(email).trim().toLowerCase());

        if (user) {
            const otpResult = await AuthOtpModel.issueOtp(user.ID, user.EMAIL, 'PASSWORD_RESET');
            // Even a cooldown hit returns the generic message — no signal
            // to the caller about whether the account exists or an OTP
            // was already pending.
            void otpResult;
        }

        return res.status(200).json({ success: true, message: GENERIC_MESSAGE });
    } catch (error) {
        console.error('Forgot-password error:', error);
        // Still generic on failure, for the same reason.
        return res.status(200).json({ success: true, message: GENERIC_MESSAGE });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body || {};

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: 'email, otp and newPassword are required' });
        }

        const policyCheck = validatePassword(newPassword);
        if (!policyCheck.valid) {
            return res.status(400).json({ success: false, message: policyCheck.message });
        }

        const user = await UserModel.getUserByEmail(String(email).trim().toLowerCase());
        if (!user) {
            // Same generic-sounding failure as a bad OTP — don't reveal
            // whether the account exists.
            return res.status(400).json({ success: false, message: 'Invalid or expired code.' });
        }

        const result = await AuthOtpModel.verifyOtp(user.ID, 'PASSWORD_RESET', String(otp).trim());
        if (!result.ok) {
            const messages = {
                NO_ACTIVE_OTP: 'Invalid or expired code.',
                EXPIRED: 'This code has expired. Please request a new one.',
                TOO_MANY_ATTEMPTS: 'Too many incorrect attempts. Please request a new code.',
                INCORRECT: 'Incorrect code.',
            };
            return res.status(400).json({ success: false, message: messages[result.reason] || 'Invalid or expired code.' });
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);

        try {
            await UserModel.resetPassword(user.ID, newHash);
        } catch (dbError) {
            if (isPlsqlBusinessError(dbError)) {
                return res.status(400).json({ success: false, message: cleanPlsqlMessage(dbError) });
            }
            throw dbError;
        }

        return res.status(200).json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (error) {
        console.error('Reset-password error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Toggle for Settings — the user's own account only, always via their
// verified session (no separate password re-entry required, matching the
// rest of the Settings page's pattern for this project's scope).
const setTwoFactorEnabled = async (req, res) => {
    try {
        const { enabled } = req.body || {};
        await UserModel.setTwoFactorEnabled(req.user.id, Boolean(enabled));
        return res.status(200).json({
            success: true,
            message: enabled ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.',
        });
    } catch (error) {
        console.error('Error updating two-factor setting:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Returns the caller's own record straight from the database.
const me = async (req, res) => {
    try {
        const user = await UserModel.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error loading current user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Change password while logged in (knows the current password already —
// different flow from forgot-password, which proves identity via OTP
// instead). Reuses the same RESET_PASSWORD procedure underneath, so it
// also bumps PASSWORD_CHANGED_AT and invalidates other sessions.
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
        }

        const user = await UserModel.getUserByEmail(req.user.email);
        if (!user || !user.PASSWORD) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(String(currentPassword), user.PASSWORD);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        }

        const policyCheck = validatePassword(newPassword);
        if (!policyCheck.valid) {
            return res.status(400).json({ success: false, message: policyCheck.message });
        }

        const newHash = await bcrypt.hash(String(newPassword), 10);

        try {
            await UserModel.resetPassword(user.ID, newHash);
        } catch (dbError) {
            if (isPlsqlBusinessError(dbError)) {
                return res.status(400).json({ success: false, message: cleanPlsqlMessage(dbError) });
            }
            throw dbError;
        }

        return res.status(200).json({ success: true, message: 'Password changed. Please log in again.' });
    } catch (error) {
        console.error('Change-password error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    verifyTwoFactor,
    forgotPassword,
    resetPassword,
    changePassword,
    setTwoFactorEnabled,
    me,
};

