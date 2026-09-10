const express = require('express');
const router = express.Router();
const { getRoles } = require('../controllers/userController');

// GET /api/roles - used to populate the Register page role selector
router.get('/', getRoles);

module.exports = router;
