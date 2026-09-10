const express = require('express');
const router = express.Router();
const {
    getGrants,
    getFundingBodies,
    addGrant,
    deleteGrant,
} = require('../controllers/grantController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/grants
router.get('/', verifyToken, getGrants);

// GET /api/grants/funding-bodies
router.get('/funding-bodies', verifyToken, getFundingBodies);

// POST /api/grants - Admin or Manager only
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), addGrant);

// DELETE /api/grants/:id - Admin or Manager only
router.delete('/:id', verifyToken, authorizeRole('Admin', 'Manager'), deleteGrant);

module.exports = router;
