// utils/fileUpload.js
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create temp uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../temp-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Process file upload and validate it
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Upload result with paths and fields
 */
async function processFileUpload(req) {
  return new Promise((resolve, reject) => {
    // Configure formidable options
    const options = {
      uploadDir,
      keepExtensions: true,
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // Default 5MB
      multiples: false // In case we want to support multiple file uploads later
    };

    // Create the form - handle different formidable versions
    let form;
    try {
      // For formidable v3+
      if (typeof formidable.parse === 'function') {
        console.log('Using formidable v3+ style');
        // Just use options, parse function will be called directly
        form = options;
      } else if (formidable.IncomingForm) {
        // For formidable v2 and earlier
        console.log('Using formidable v2 style');
        form = new formidable.IncomingForm(options);
      } else if (typeof formidable === 'function') {
        // Alternative syntax for some versions
        console.log('Using formidable function constructor style');
        form = formidable(options);
      } else {
        return reject(new Error('Unsupported formidable version'));
      }
    } catch (error) {
      console.error('Error initializing formidable:', error);
      return reject(error);
    }

    // Use the appropriate parse method based on formidable version
    const parseFunction = form.parse ? 
      (req, cb) => form.parse(req, cb) : 
      (req, cb) => formidable.parse(req, form, cb);

    // Parse the request
    parseFunction(req, (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        // Handle error codes from formidable
        if (err.code === 1009) {
          return reject(new Error('File type not allowed'));
        } else if (err.code === 1010) {
          return reject(new Error('File size exceeds the limit'));
        }
        return reject(err);
      }

      console.log('Parsed files:', files);
      console.log('Parsed fields:', fields);

      // Make sure we have an image file
      if (!files || !files.image) {
        return reject(new Error('No image file uploaded'));
      }

      // Get mode from fields
      const mode = fields.mode ? (Array.isArray(fields.mode) ? fields.mode[0] : fields.mode) : 'basic';
      if (mode !== 'basic' && mode !== 'detailed') {
        return reject(new Error('Invalid mode specified. Use "basic" or "detailed"'));
      }

      // Handle file structure based on formidable version
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      
      // Log file details for debugging
      console.log('Image file details:', {
        filepath: imageFile.filepath || imageFile.path,
        originalFilename: imageFile.originalFilename || imageFile.name,
        mimetype: imageFile.mimetype || imageFile.type
      });

      resolve({
        imagePath: imageFile.filepath || imageFile.path,
        originalFilename: imageFile.originalFilename || imageFile.name,
        mimetype: imageFile.mimetype || imageFile.type,
        mode
      });
    });
  });
}

/**
 * Clean up temporary files
 * @param {string} filePath - Path to file to delete
 */
function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Failed to delete temporary file ${filePath}:`, error);
    }
  }
}

module.exports = {
  processFileUpload,
  cleanupFile
};