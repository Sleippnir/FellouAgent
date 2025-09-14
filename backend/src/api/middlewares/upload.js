const multer = require('multer');

// Configure multer for file uploads.
// We are using memoryStorage to temporarily hold the file in memory
// before forwarding it to the Python service.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    // Limit file size to 10MB
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
