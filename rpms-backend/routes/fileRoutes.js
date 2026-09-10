const express = require('express');
const router = express.Router();
const { getFiles, addFile, deleteFile } = require('../controllers/fileController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/files            - all file metadata
// GET /api/files?publicationId=1
router.get('/', verifyToken, getFiles);

// POST /api/files - register file metadata (used by the FileUpload component)
router.post('/', verifyToken, addFile);

// DELETE /api/files/:id
router.delete('/:id', verifyToken, deleteFile);

module.exports = router;
