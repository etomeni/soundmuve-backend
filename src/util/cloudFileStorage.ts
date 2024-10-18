import { v2 as cloudinary } from 'cloudinary';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from "multer";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// const recordLabelLogoStorage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'recordLabelLogo',
//         allowedFormats: ['jpg', 'png', 'jpeg'],
//     },
// }); 


// export const recordLabelLogoUpload = multer({ storage: recordLabelLogoStorage });
const inMemoryStorage = multer.memoryStorage()  // store image in memory
export const recordLabelLogoUpload = multer({ storage: inMemoryStorage });

export async function cloudinaryUpload(filePath: string) {
    const result = await cloudinary.uploader.upload(
        filePath, 
        {
            folder: 'recordLabelLogo',
            allowed_formats: ['jpg', 'png', 'jpeg'],
        }
    );
     
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url(result.public_id, {
        fetch_format: 'auto',
        quality: 'auto',

        // crop: 'auto',
        // gravity: 'auto',
        // width: 500,
        // height: 500,
    });

    return optimizeUrl;
}
