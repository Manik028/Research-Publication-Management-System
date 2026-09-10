const FileModel = require('../models/fileModel');
const PubModel = require('../models/pubModel');

const getFiles = async (req, res) => {
    try {
        const data = req.query.publicationId
            ? await FileModel.getByPublication(Number(req.query.publicationId))
            : await FileModel.getAll();

        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error fetching files:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Registers file metadata against a publication.
 * The FileUpload component sends the ERD field names in upper case.
 */
const addFile = async (req, res) => {
    try {
        const body = req.body || {};
        const fileName = body.FILE_NAME ?? body.fileName;
        const fileType = body.FILE_TYPE ?? body.fileType;
        const fileSize = body.FILE_SIZE ?? body.fileSize;
        const publicationId = Number(body.PUBLICATION_ID ?? body.publicationId);

        if (!fileName || !publicationId || Number.isNaN(publicationId)) {
            return res.status(400).json({
                success: false,
                message: 'FILE_NAME and a valid PUBLICATION_ID are required',
            });
        }

        // FILE.PUBLICATION_ID is a NOT NULL foreign key - check it before the
        // insert so the user gets a 404 instead of an ORA-02291.
        const publication = await PubModel.getPublicationById(publicationId);
        if (!publication) {
            return res.status(404).json({ success: false, message: 'Publication not found' });
        }

        if (Number(publication.USER_ID) !== Number(req.user.id) && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You can only attach files to your own publications.',
            });
        }

        const newId = await FileModel.create({ fileName, fileType, fileSize, publicationId });
        const created = await FileModel.getById(newId);

        return res.status(201).json({ success: true, message: 'File registered', data: created });
    } catch (error) {
        console.error('Error registering file:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteFile = async (req, res) => {
    try {
        const file = await FileModel.getById(Number(req.params.id));
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        if (Number(file.OWNER_ID) !== Number(req.user.id) && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: '403 Forbidden: You can only delete files on your own publications.',
            });
        }

        await FileModel.remove(Number(req.params.id));
        return res.status(200).json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { getFiles, addFile, deleteFile };
