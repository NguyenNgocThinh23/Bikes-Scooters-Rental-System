function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: 'File size exceeds maximum limit of 5MB.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }

    if (err.message && (err.message.includes('Invalid file extension') || err.message.includes('Invalid MIME type'))) {
        return res.status(400).json({ success: false, message: err.message });
    }

    const statusCode = err.status || err.statusCode || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error occurred.'
        : err.message || 'An unexpected error occurred.';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
}

module.exports = errorHandler;
