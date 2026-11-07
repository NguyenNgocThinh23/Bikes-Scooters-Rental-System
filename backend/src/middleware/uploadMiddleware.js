const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.resolve(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
        cb(null, uniqueName);
    }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension. Only JPG, PNG, and PDF files are permitted.'), false);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid MIME type. Only JPG, PNG, and PDF documents are allowed.'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter
});

/**
 * Validates file magic bytes to verify content matches the claimed format
 */
function validateMagicBytes(filePath) {
    try {
        const buffer = Buffer.alloc(8);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 8, 0);
        fs.closeSync(fd);

        // JPEG: FF D8 FF
        const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        // PDF: 25 50 44 46 (%PDF)
        const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

        return isJpeg || isPng || isPdf;
    } catch (err) {
        console.error('Error verifying magic bytes:', err);
        return false;
    }
}

module.exports = {
    upload,
    uploadDir,
    validateMagicBytes
};
