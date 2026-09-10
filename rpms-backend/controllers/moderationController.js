const ModerationModel = require('../models/moderationModel');

const getQueue = async (req, res) => {
    try {
        // The Admin UI shows the pending queue by default.
        const data = await ModerationModel.getAll(req.query.status || 'Pending');
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching moderation queue:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const flagItem = async (req, res) => {
    try {
        const body = req.body || {};
        const itemType = body.ITEM_TYPE ?? body.itemType;
        const referenceId = Number(body.REFERENCE_ID ?? body.referenceId);
        const flagReason = body.FLAG_REASON ?? body.flagReason;

        if (!itemType || !Number.isFinite(referenceId) || !flagReason) {
            return res.status(400).json({
                success: false,
                message: 'ITEM_TYPE, REFERENCE_ID and FLAG_REASON are required',
            });
        }

        const newId = await ModerationModel.create({ itemType, referenceId, flagReason });
        const created = await ModerationModel.getById(newId);

        return res.status(201).json({ success: true, message: 'Item flagged for moderation', data: created });
    } catch (error) {
        console.error('Error flagging item:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const resolveItem = async (req, res) => {
    try {
        const body = req.body || {};
        const status = body.STATUS ?? body.status ?? 'Resolved';
        const actionTaken = body.ACTION_TAKEN ?? body.actionTaken;

        const item = await ModerationModel.getById(Number(req.params.id));
        if (!item) {
            return res.status(404).json({ success: false, message: 'Moderation item not found' });
        }

        await ModerationModel.resolve(Number(req.params.id), { status, actionTaken });
        const updated = await ModerationModel.getById(Number(req.params.id));

        return res.status(200).json({ success: true, message: 'Moderation item updated', data: updated });
    } catch (error) {
        console.error('Error resolving moderation item:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getQueue, flagItem, resolveItem };
