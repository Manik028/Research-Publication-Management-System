const ResearchAreaModel = require('../models/researchAreaModel');

const getResearchAreas = async (req, res) => {
    try {
        const data = await ResearchAreaModel.getAll();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching research areas:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addResearchArea = async (req, res) => {
    try {
        const body = req.body || {};
        const areaName = body.AREA_NAME ?? body.areaName ?? body.name;
        const description = body.DESCRIPTION ?? body.description;

        if (!areaName) {
            return res.status(400).json({ success: false, message: 'Area name is required' });
        }

        const newId = await ResearchAreaModel.create({ areaName, description });
        const created = await ResearchAreaModel.getById(newId);

        return res.status(201).json({ success: true, message: 'Research area created', data: created });
    } catch (error) {
        if (error.errorNum === 1) {
            return res.status(409).json({ success: false, message: 'That research area already exists' });
        }
        console.error('Error creating research area:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteResearchArea = async (req, res) => {
    try {
        const rows = await ResearchAreaModel.remove(Number(req.params.id));
        if (!rows) {
            return res.status(404).json({ success: false, message: 'Research area not found' });
        }
        return res.status(200).json({ success: true, message: 'Research area deleted' });
    } catch (error) {
        console.error('Error deleting research area:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getResearchAreas, addResearchArea, deleteResearchArea };
