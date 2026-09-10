const AwardModel = require('../models/awardModel');

const getAwards = async (req, res) => {
    try {
        const data = req.query.mine === 'true'
            ? await AwardModel.getByUser(req.user.id)
            : await AwardModel.getAll();

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching awards:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addAward = async (req, res) => {
    try {
        const body = req.body || {};
        const awardName = body.AWARD_NAME ?? body.awardName ?? body.name;
        const category = body.CATEGORY ?? body.category;
        const awardingOrganization = body.AWARDING_ORGANIZATION ?? body.awardingOrganization ?? body.organization;

        if (!awardName) {
            return res.status(400).json({ success: false, message: 'Award name is required' });
        }

        // AWARD.USER_ID comes from the token, never from the request body.
        const newId = await AwardModel.create({
            awardName,
            category,
            awardingOrganization,
            userId: req.user.id,
        });

        const created = await AwardModel.getById(newId);
        return res.status(201).json({ success: true, message: 'Award logged', data: created });
    } catch (error) {
        console.error('Error creating award:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteAward = async (req, res) => {
    try {
        const award = await AwardModel.getById(Number(req.params.id));
        if (!award) {
            return res.status(404).json({ success: false, message: 'Award not found' });
        }

        if (Number(award.USER_ID) !== Number(req.user.id) && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You can only delete your own awards.',
            });
        }

        await AwardModel.remove(Number(req.params.id));
        return res.status(200).json({ success: true, message: 'Award deleted' });
    } catch (error) {
        console.error('Error deleting award:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getAwards, addAward, deleteAward };
