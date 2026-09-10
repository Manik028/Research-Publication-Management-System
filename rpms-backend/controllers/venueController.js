const VenueModel = require('../models/venueModel');

const VALID_TYPES = ['Conference', 'Journal'];

const VenueController = {
    getVenues: async (req, res) => {
        try {
            const venues = await VenueModel.getAllVenues();
            return res.status(200).json({ success: true, data: venues });
        } catch (err) {
            console.error('Error fetching venues:', err);
            return res.status(500).json({ success: false, message: 'Server error while fetching venues.' });
        }
    },

    createVenue: async (req, res) => {
        try {
            const { name, type, submissionDeadline, status } = req.body || {};

            if (!name || !type) {
                return res.status(400).json({ success: false, message: 'Name and Type are required fields.' });
            }

            // The VENUE table has CHECK (TYPE IN ('Conference','Journal')).
            if (!VALID_TYPES.includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: `Type must be one of: ${VALID_TYPES.join(', ')}`,
                });
            }

            if (submissionDeadline && !/^\d{4}-\d{2}-\d{2}$/.test(submissionDeadline)) {
                return res.status(400).json({
                    success: false,
                    message: 'submissionDeadline must be in YYYY-MM-DD format.',
                });
            }

            const newId = await VenueModel.createVenue({ name, type, submissionDeadline, status });
            const created = await VenueModel.getVenueById(newId);

            return res.status(201).json({ success: true, message: 'Venue created successfully.', data: created });
        } catch (err) {
            console.error('Error creating venue:', err);
            return res.status(500).json({ success: false, message: 'Server error while creating venue.' });
        }
    },
};

module.exports = VenueController;
