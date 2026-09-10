const express = require('express');
const router = express.Router();
const { getProjects, addProject, deleteProject } = require('../controllers/projectController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/projects
router.get('/', verifyToken, getProjects);

// POST /api/projects
router.post('/', verifyToken, addProject);

// DELETE /api/projects/:id
router.delete('/:id', verifyToken, deleteProject);

module.exports = router;
