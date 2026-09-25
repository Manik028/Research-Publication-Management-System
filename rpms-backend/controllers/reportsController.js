const ReportsModel = require('../models/reportsModel');

function makeHandler(fetcher) {
    return async (req, res) => {
        try {
            const data = await fetcher();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error generating report:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
}

module.exports = {
    getResearcherStatistics: makeHandler(ReportsModel.researcherStatistics),
    getProjectFunding: makeHandler(ReportsModel.projectFunding),
    getInstitutionStatistics: makeHandler(ReportsModel.institutionStatistics),
    getResearchAreaStatistics: makeHandler(ReportsModel.researchAreaStatistics),
    getReviewStatistics: makeHandler(ReportsModel.reviewStatistics),
    getPublicationDetails: makeHandler(ReportsModel.publicationDetails),
    getDashboardSummary: makeHandler(ReportsModel.dashboardSummary),
};
