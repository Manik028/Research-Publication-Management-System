const express = require('express');
const router = express.Router();
const VenueController = require('../controllers/venueController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// GET /api/venues - public (Conferences & Journals pages are public)
router.get('/', VenueController.getVenues);

// POST /api/venues - Admin or Manager only
router.post('/', verifyToken, authorizeRole('Admin', 'Manager'), VenueController.createVenue);

module.exports = router;
