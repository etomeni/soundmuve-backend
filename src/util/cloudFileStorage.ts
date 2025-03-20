import { v2 as cloudinary } from 'cloudinary';
// import multer from 'multer';
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

export const deleteImageFileFromCloudinary = async (url: string) => {
    try {
        // Remove query parameters (everything after '?')
        const cleanUrl = url.split('?')[0];

        // Extract the part after '/upload/' or '/upload/v1/' if version is included
        const uploadIndex = cleanUrl.indexOf('/upload/');
        if (uploadIndex === -1) {
            return false;
            // throw new Error('Invalid Cloudinary URL: Missing /upload/ path');
        }

        // Get everything after '/upload/'
        let publicPath = cleanUrl.substring(uploadIndex + 8); // 8 is length of '/upload/'

        // Remove transformation strings like f_auto,q_auto/
        // They are comma-separated and end at the next slash
        if (publicPath.includes('/')) {
            const parts = publicPath.split('/');
            // Check if first part contains transformations (e.g., f_auto,q_auto)
            if (parts[0].includes(',')) {
                parts.shift(); // Remove the transformations
                publicPath = parts.join('/');
            }
        }

        // Remove versioning (e.g., v1/)
        publicPath = publicPath.replace(/^v\d+\//, '');

        // Remove file extension if present (e.g., .jpg, .webp, etc.)
        const lastSegment = publicPath.split('/').pop();
        const filenameWithoutExt = lastSegment?.split('.')[0] || '';

        // Reconstruct public ID
        const pathSegments = publicPath.split('/');
        pathSegments[pathSegments.length - 1] = filenameWithoutExt;
        const publicId = pathSegments.join('/');


        // Delete the file using the public ID
        const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true, // optional, invalidates cached CDN copies
        });

        return result.result === 'ok';
        // return publicId;
    } catch (err) {
        return false;
        // throw new Error('Failed to extract public ID from URL');
    }
};
