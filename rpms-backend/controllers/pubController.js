const PubModel = require('../models/pubModel');
const { isPlsqlBusinessError, cleanPlsqlMessage } = require('../utils/plsqlErrors');

const getPublications = async (req, res) => {
    try {
        const { mine, q, status, venueType, areaId, dateFrom, dateTo } = req.query;

        // ?mine=true limits the list to the caller's own publications.
        if (mine === 'true' && req.user) {
            const pubs = await PubModel.getPublicationsByUser(req.user.id);
            return res.status(200).json({ success: true, data: pubs });
        }

        // Any filter present -> real server-side search (bind-variable
        // safe, see PubModel.search). No filters -> the plain full list,
        // unchanged from before.
        const hasFilters = q || status || venueType || areaId || dateFrom || dateTo;
        const pubs = hasFilters
            ? await PubModel.search({
                q: q || null,
                status: status || null,
                venueType: venueType || null,
                areaId: areaId ? Number(areaId) : null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null,
            })
            : await PubModel.getAllPublications();

        return res.status(200).json({ success: true, data: pubs });
    } catch (error) {
        console.error('Error fetching publications:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getPublication = async (req, res) => {
    try {
        const pubId = Number(req.params.id);
        const pub = await PubModel.getFullDetail(pubId);
        if (!pub) {
            return res.status(404).json({ success: false, message: 'Publication not found' });
        }

        // Review status is only meaningful to an author of this paper or
        // an Admin/Manager — everyone else (including anonymous public
        // visitors) sees the publication without it.
        const isAuthor = req.user && pub.AUTHORS.some((a) => Number(a.USER_ID) === Number(req.user.id));
        const isPrivileged = req.user && (req.user.role === 'Admin' || req.user.role === 'Manager');

        if (isAuthor || isPrivileged) {
            pub.REVIEWS = await PubModel.getReviewSummary(pubId);
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

// Editorial decision (Admin / Manager only). The database itself refuses
// this unless the publication is currently 'Under Review' or 'Resubmitted'
// (APPROVE_PUBLICATION / REJECT_PUBLICATION, database/procedures_functions.sql).
const approvePublication = async (req, res) => {
    try {
        const pubId = Number(req.params.id);
        await PubModel.approvePublication(pubId);
        const updated = await PubModel.getPublicationById(pubId);
        return res.status(200).json({ success: true, message: 'Publication approved', data: updated });
    } catch (error) {
        if (isPlsqlBusinessError(error)) {
            return res.status(400).json({ success: false, message: cleanPlsqlMessage(error) });
        }
        console.error('Error approving publication:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const rejectPublication = async (req, res) => {
    try {
        const pubId = Number(req.params.id);
        await PubModel.rejectPublication(pubId);
        const updated = await PubModel.getPublicationById(pubId);
        return res.status(200).json({ success: true, message: 'Publication rejected', data: updated });
    } catch (error) {
        if (isPlsqlBusinessError(error)) {
            return res.status(400).json({ success: false, message: cleanPlsqlMessage(error) });
        }
        console.error('Error rejecting publication:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getPublications, getPublication, addPublication, deletePublication, approvePublication, rejectPublication };
