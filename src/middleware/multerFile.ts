import multer from "multer";

// Set up Multer to store files locally temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where uploaded files are temporarily stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Generate unique filenames
  },
});
// Set up Multer to handle multiple file uploads
export const upload_diskStorage = multer({ storage: storage });



// export const recordLabelLogoUpload = multer({ storage: recordLabelLogoStorage });
const inMemoryStorage = multer.memoryStorage()  // store image in memory
export const upload_memoryStorage = multer({ storage: inMemoryStorage });


