import multer from 'multer'

// Configure the storage engine for multer to temporarily store uploaded files on disk
const storage = multer.diskStorage({
  // This sets the destination folder where files will be stored temporarily
  destination: function(req, file, cb) {
    cb(null, './public/temp'); // Save to public/temp directory
  },
  // This sets the name of the saved file (here: using the original filename)
  filename: function(req, file, cb) {
    cb(null, file.originalname); // Keep the uploaded file's original name
  }
})

export const upload = multer({ 
  storage 
});

// Role of the middleware is to add the fields or key-value pairs in request (req) object

// Note: 
// The role of this multer middleware is to intercept file uploads,
// parse them from multipart/form-data, and attach them to req.files (or req.file)
// so you can access them in your route handlers.