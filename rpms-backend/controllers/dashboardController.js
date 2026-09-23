const DashboardModel = require('../models/dashboardModel');

const DashboardController = {
    getSummary: async (req, res) => {
        try {
            const summary = await DashboardModel.getSummary();
            return res.status(200).json({ success: true, data: summary });
        } catch (err) {
            console.error('Error fetching dashboard summary:', err);
            return res.status(500).json({ success: false, message: 'Server error while fetching dashboard summary.' });
        }
    },
};

module.exports = DashboardController;
