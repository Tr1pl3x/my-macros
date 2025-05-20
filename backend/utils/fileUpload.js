// utils/fileUpload.js
const { formidable } = require('formidable');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

// Create temp uploads directory - use OS temp directory for serverless environments
const uploadDir = process.env.NODE_ENV === 'production' 
  ? os.tmpdir() 
  : path.join(__dirname, '../temp-uploads');

// Only create directory if not using system temp dir
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Process file upload and validate it
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Upload result with paths and fields
 */
async function processFileUpload(req) {
  return new Promise((resolve, reject) => {
    try {
      // Configure formidable options
      const options = {
        uploadDir,
        keepExtensions: true,
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024, // Default 5MB
        multiples: false // In case we want to support multiple file uploads later
      };

      // Create the form - handle different formidable versions
      let form;
      
      // For formidable v3+
      if (typeof formidable === 'function') {
        console.log('Using formidable function style');
        form = formidable(options);
      } else if (formidable.IncomingForm) {
        // For formidable v2 and earlier
        console.log('Using formidable IncomingForm style');
        form = new formidable.IncomingForm(options);
      } else {
        return reject(new Error('Unsupported formidable version'));
      }

      // Parse the request
      form.parse(req, (err, fields, files) => {
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

        console.log('Parsed files:', JSON.stringify(files || {}));
        console.log('Parsed fields:', JSON.stringify(fields || {}));

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
    } catch (error) {
      console.error('Error in processFileUpload:', error);
      reject(error);
    }
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