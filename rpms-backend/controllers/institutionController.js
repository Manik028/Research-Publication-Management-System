const InstitutionModel = require('../models/institutionModel');

const getInstitutions = async (req, res) => {
    try {
        const data = await InstitutionModel.getAll();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching institutions:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addInstitution = async (req, res) => {
    try {
        const body = req.body || {};
        const name = body.NAME ?? body.name;
        const country = body.COUNTRY ?? body.country;
        const website = body.WEBSITE ?? body.website;

        if (!name || !country) {
            return res.status(400).json({ success: false, message: 'Name and country are required' });
        }

        const newId = await InstitutionModel.create({ name, country, website });
        const created = await InstitutionModel.getById(newId);

        return res.status(201).json({ success: true, message: 'Institution created', data: created });
    } catch (error) {
        console.error('Error creating institution:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteInstitution = async (req, res) => {
    try {
        const rows = await InstitutionModel.remove(Number(req.params.id));
        if (!rows) {
            return res.status(404).json({ success: false, message: 'Institution not found' });
        }
        return res.status(200).json({ success: true, message: 'Institution deleted' });
    } catch (error) {
        console.error('Error deleting institution:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getInstitutions, addInstitution, deleteInstitution };
