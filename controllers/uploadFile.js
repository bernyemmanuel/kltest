import multer from 'multer';

const storage = multer.diskStorage({
    destination(req, file, callback) {
        callback(null, './uploads');
    },
    filename(req, file, callback) {
        callback(
            null,
            `${Date.now()}${Math.floor(Math.random() * (1000000 - 10000)) +
                10000}${path.extname(file.originalname)}`
        );
    }
});

exports.uploadFile = (req, res) => {
    const upload = multer({
        storage,
        fileFilter(req1, file, callback) {
            const ext = path.extname(file.originalname);
            if (
                ext !== '.png' &&
                ext !== '.jpg' &&
                ext !== '.gif' &&
                ext !== '.jpeg'
            ) {
                return callback(null, false);
            }
            callback(null, true);
            return null;
        }
    }).single('image');
    upload(req, res, () => {
        if (req.file) {
            sendResponse(res, null, { image_name: req.file.filename });
        } else {
            sendResponse(res, 'invalid_image_format');
        }
    });
};
