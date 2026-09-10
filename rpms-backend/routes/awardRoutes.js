const express = require('express');
const router = express.Router();
const { getAwards, addAward, deleteAward } = require('../controllers/awardController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/awards         - every award
// GET /api/awards?mine=true - the caller's own awards
router.get('/', verifyToken, getAwards);

// POST /api/awards - logged against the caller
router.post('/', verifyToken, addAward);

// DELETE /api/awards/:id
router.delete('/:id', verifyToken, deleteAward);

module.exports = router;
