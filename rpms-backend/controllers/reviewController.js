const ReviewModel = require('../models/reviewModel');
const { isPlsqlBusinessError, cleanPlsqlMessage } = require('../utils/plsqlErrors');

const getMyReviews = async (req, res) => {
    try {
        // Admins can see every assignment; everyone else sees only their own.
        const reviews = req.user.role === 'Admin' && req.query.all === 'true'
            ? await ReviewModel.getAllReviews()
            : await ReviewModel.getReviewsByReviewer(req.user.id);

        return res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const submitReview = async (req, res) => {
    try {
        const reviewId = Number(req.params.id);
        const reviewerId = Number(req.user.id);
        const { score, originality, recommendation, authorComments, editorComments } = req.body || {};

        const review = await ReviewModel.getReviewById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review assignment not found' });
        }

        if (Number(review.REVIEWER_ID) !== reviewerId) {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You can only submit scores for your own assigned reviews.',
            });
        }

        if (review.STATUS === 'Completed') {
            return res.status(400).json({ success: false, message: 'This review has already been completed.' });
        }

        // Validate against the CHECK constraints on the REVIEW table.
        // Missing/non-numeric values used to slip through, because
        // `undefined < 1` is false and would have hit the DB constraint instead.
        const numericScore = Number(score);
        const numericOriginality = Number(originality);

        if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 10) {
            return res.status(400).json({ success: false, message: 'Score must be a number between 1 and 10.' });
        }

        if (!Number.isFinite(numericOriginality) || numericOriginality < 0 || numericOriginality > 100) {
            return res.status(400).json({ success: false, message: 'Originality must be a number between 0 and 100.' });
        }

        if (!authorComments || !String(authorComments).trim()) {
            return res.status(400).json({ success: false, message: 'Comments for the author are required.' });
        }

        await ReviewModel.submitReview(
            reviewId,
            reviewerId,
            numericScore,
            numericOriginality,
            recommendation || null,
            String(authorComments).trim(),
            editorComments ? String(editorComments).trim() : null
        );

        const updated = await ReviewModel.getReviewById(reviewId);

        return res.status(200).json({
            success: true,
            message: 'Review submitted successfully',
            data: updated,
        });
    } catch (error) {
        if (isPlsqlBusinessError(error)) {
            return res.status(400).json({ success: false, message: cleanPlsqlMessage(error) });
        }
        console.error('Error submitting review:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Assigning a reviewer is an editorial action (Admin / Manager only).
const assignReview = async (req, res) => {
    try {
        const { publicationId, reviewerId, deadline } = req.body || {};

        if (!publicationId || !reviewerId || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'publicationId, reviewerId and deadline (YYYY-MM-DD) are required',
            });
        }

        await ReviewModel.createReview(Number(publicationId), Number(reviewerId), deadline);
        return res.status(201).json({ success: true, message: 'Review assigned successfully' });
    } catch (error) {
        // ASSIGN_REVIEWER (database/transactions.sql) is what actually
        // catches: publication/reviewer not existing, the reviewer being
        // one of the paper's own authors (-20003), a past deadline
        // (-20004), a duplicate assignment (-20005), and the 3-reviewer
        // cap (-20006). All of those now surface as a clean 400 instead
        // of a raw 500, and none of them could be bypassed even by a
        // request that skips the frontend entirely.
        if (isPlsqlBusinessError(error)) {
            return res.status(400).json({ success: false, message: cleanPlsqlMessage(error) });
        }
        console.error('Error assigning review:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getMyReviews, submitReview, assignReview };
