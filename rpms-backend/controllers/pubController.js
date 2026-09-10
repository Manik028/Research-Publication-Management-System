const PubModel = require('../models/pubModel');

const getPublications = async (req, res) => {
    try {
        // ?mine=true limits the list to the caller's own publications.
        const pubs = req.query.mine === 'true' && req.user
            ? await PubModel.getPublicationsByUser(req.user.id)
            : await PubModel.getAllPublications();

        return res.status(200).json({ success: true, data: pubs });
    } catch (error) {
        console.error('Error fetching publications:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getPublication = async (req, res) => {
    try {
        const pub = await PubModel.getPublicationById(Number(req.params.id));
        if (!pub) {
            return res.status(404).json({ success: false, message: 'Publication not found' });
        }
        return res.status(200).json({ success: true, data: pub });
    } catch (error) {
        console.error('Error fetching publication:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addPublication = async (req, res) => {
    try {
        const { title, abstract, doi, venueId } = req.body || {};
        const userId = req.user.id;

        if (!title || !abstract) {
            return res.status(400).json({ success: false, message: 'Title and abstract are required' });
        }

        const newId = await PubModel.createPublication(
            String(title).trim(),
            String(abstract).trim(),
            doi ? String(doi).trim() : null,
            userId,
            venueId || null
        );

        // Return the full joined row so the UI can append it without refetching.
        const created = await PubModel.getPublicationById(newId);

        return res.status(201).json({
            success: true,
            message: 'Publication created successfully',
            data: created,
        });
    } catch (error) {
        if (error.errorNum === 1) {
            return res.status(409).json({ success: false, message: 'A publication with this DOI already exists' });
        }
        console.error('Error creating publication:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deletePublication = async (req, res) => {
    try {
        const pubId = Number(req.params.id);
        const userId = Number(req.user.id);

        const pub = await PubModel.getPublicationById(pubId);
        if (!pub) {
            return res.status(404).json({ success: false, message: 'Publication not found' });
        }

        // Object-level ownership check; Admins may remove anything.
        if (Number(pub.USER_ID) !== userId && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: "403 Forbidden: You do not have permission to delete someone else's publication.",
            });
        }

        await PubModel.deletePublication(pubId);
        return res.status(200).json({ success: true, message: 'Publication deleted successfully' });
    } catch (error) {
        console.error('Error deleting publication:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getPublications, getPublication, addPublication, deletePublication };
