import multer from 'multer'

// This will basically create the temporary folder to store the image before uploading it to cloudinary
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './public/temp');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
  }
})

export const upload = multer({ 
  storage 
});

// Role of the middleware is to add the fields or key-value pairs in request object