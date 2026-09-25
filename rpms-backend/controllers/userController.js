const UserModel = require('../models/userModel');

const getUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await UserModel.getUserById(Number(req.params.id));
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Self-service profile update (Admins may update anyone).
 * Only the fields present in the request body are written, so a page that
 * submits a subset (Settings sends name + email only) cannot blank the rest.
 */
const updateUser = async (req, res) => {
    try {
        const targetId = Number(req.params.id);

        if (Number.isNaN(targetId)) {
            return res.status(400).json({ success: false, message: 'Invalid user id' });
        }

        if (Number(req.user.id) !== targetId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You can only update your own profile.',
            });
        }

        const body = req.body || {};
        const fullName = body.FULL_NAME ?? body.fullName;
        const email = body.EMAIL ?? body.email;
        const department = body.DEPARTMENT ?? body.department;
        const orcid = body.ORCID ?? body.orcid;

        if (fullName !== undefined && !String(fullName).trim()) {
            return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
        }
        if (email !== undefined && !String(email).trim()) {
            return res.status(400).json({ success: false, message: 'Email cannot be empty' });
        }

        const rowsAffected = await UserModel.updateUser(targetId, {
            fullName: fullName === undefined ? undefined : String(fullName).trim(),
            email: email === undefined ? undefined : String(email).trim().toLowerCase(),
            department: department === undefined ? undefined : (department || null),
            orcid: orcid === undefined ? undefined : (orcid || null),
        });

        if (!rowsAffected) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const updated = await UserModel.getUserById(targetId);
        return res.status(200).json({ success: true, message: 'User updated successfully', data: updated });
    } catch (error) {
        if (error.errorNum === 1) {
            return res.status(409).json({ success: false, message: 'Email already in use' });
        }
        console.error('Error updating user:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getRoles = async (req, res) => {
    try {
        const roles = await UserModel.getAllRoles();
        return res.status(200).json({ success: true, data: roles });
    } catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Real implementation of "Find Collaborators" (previously a placeholder
// alert). Both filters are optional query params: ?areaId=&institutionId=
const findCollaborators = async (req, res) => {
    try {
        const areaId = req.query.areaId ? Number(req.query.areaId) : null;
        const institutionId = req.query.institutionId ? Number(req.query.institutionId) : null;

        const data = await UserModel.findCollaborators({ areaId, institutionId });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error searching collaborators:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getUsers, getUserById, updateUser, getRoles, findCollaborators };
