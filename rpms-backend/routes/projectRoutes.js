const express = require('express');
const router = express.Router();
const {
    getProjects,
    addProject,
    deleteProject,
    getMembers,
    addMember,
    removeMember,
} = require('../controllers/projectController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/projects
router.get('/', verifyToken, getProjects);

// POST /api/projects
router.post('/', verifyToken, addProject);

// DELETE /api/projects/:id
router.delete('/:id', verifyToken, deleteProject);

// GET /api/projects/:id/members
router.get('/:id/members', verifyToken, getMembers);

// POST /api/projects/:id/members - Admin/Manager, calls ADD_PROJECT_MEMBER
router.post('/:id/members', verifyToken, authorizeRole('Admin', 'Manager'), addMember);

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', verifyToken, authorizeRole('Admin', 'Manager'), removeMember);

module.exports = router;
