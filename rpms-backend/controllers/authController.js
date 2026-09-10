const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const UserModel = require('../models/userModel');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

        if (String(PASSWORD).length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
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

        const token = jwt.sign(
            { id: user.ID, role: user.ROLE, email: user.EMAIL },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        delete user.PASSWORD;

        return res.status(200).json({ success: true, token, data: user });
    } catch (error) {
        console.error('Login error:', error);
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

module.exports = { register, login, me };
