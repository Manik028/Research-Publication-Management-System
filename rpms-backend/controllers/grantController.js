const GrantModel = require('../models/grantModel');
const ProjectModel = require('../models/projectModel');

const getGrants = async (req, res) => {
    try {
        const data = await GrantModel.getAll();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching grants:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getFundingBodies = async (req, res) => {
    try {
        const data = await GrantModel.getFundingBodies();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching funding bodies:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * The Grants page posts { amount, fundingBody, projectId }.
 * GRANT_FUNDING needs a BODY_ID, so the funding body is looked up (or created)
 * by name first.
 */
const addGrant = async (req, res) => {
    try {
        const body = req.body || {};
        const amount = Number(body.amount ?? body.AMOUNT);
        const projectId = Number(body.projectId ?? body.PROJECT_ID);
        const fundingBody = body.fundingBody ?? body.FUNDING_BODY;
        const organizationType = body.organizationType ?? body.ORGANIZATION_TYPE ?? null;

        if (!Number.isFinite(amount) || amount <= 0) {
            // Matches CHECK (AMOUNT > 0) on GRANT_FUNDING.
            return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
        }

        if (!Number.isFinite(projectId)) {
            return res.status(400).json({ success: false, message: 'A valid projectId is required' });
        }

        if (!fundingBody || !String(fundingBody).trim()) {
            return res.status(400).json({ success: false, message: 'Funding body is required' });
        }

        const project = await ProjectModel.getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ success: false, message: `Project #${projectId} does not exist` });
        }

        const bodyId = await GrantModel.findOrCreateFundingBody(
            String(fundingBody).trim(),
            organizationType
        );

        const newId = await GrantModel.create({ amount, projectId, bodyId });
        const created = await GrantModel.getById(newId);

        return res.status(201).json({ success: true, message: 'Grant logged successfully', data: created });
    } catch (error) {
        console.error('Error creating grant:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteGrant = async (req, res) => {
    try {
        const rows = await GrantModel.remove(Number(req.params.id));
        if (!rows) {
            return res.status(404).json({ success: false, message: 'Grant not found' });
        }
        return res.status(200).json({ success: true, message: 'Grant deleted' });
    } catch (error) {
        console.error('Error deleting grant:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getGrants, getFundingBodies, addGrant, deleteGrant };
