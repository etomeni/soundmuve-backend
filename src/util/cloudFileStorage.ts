import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { determineFileType } from './resources.js';
// import { CloudinaryStorage } from 'multer-storage-cloudinary';

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


export async function cloudinaryImageUpload(filePath: string, folderName = 'images') {
    const result = await cloudinary.uploader.upload(
        filePath, 
        {
            folder: folderName,
            // allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
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

export async function cloudinaryAudioUpload(filePath: any, folderName = 'releases') {
    const result = await cloudinary.uploader.upload(
        filePath, 
        {
            folder: folderName,
            // allowed_formats: ['auto'],
            resource_type: determineFileType(filePath) // mp3 files are considered as 'video' in Cloudinary
            //filePath.mimetype.startsWith('audio') ? 'video' : 'image' // mp3 files are considered as 'video' in Cloudinary
        }
    );

    return result.secure_url;
}


// Helper function to delete a file from Cloudinary
export const deleteFileFromCloudinary = async (fileUrl: string) => {
    try {
        // Extract the public ID from the URL
        const publicId = fileUrl.split('/').slice(-2).join('/').split('.')[0];
    
        // Determine the resource type (image or video)
        const resourceType = fileUrl.includes('/image/') ? 'image' : 'video';
    
        // Delete the file using the public ID
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    
        return result.result === 'ok';
    } catch (error) {
        console.error(`Error deleting file from Cloudinary: ${fileUrl}`, error);
        return false;
    }
};