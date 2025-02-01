import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { cloudinaryAudioUpload } from "@/util/cloudFileStorage.js";
import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { logActivity } from "@/util/activityLogFn.js";


// Get releases
export const getAllReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const releaseType = req.query.releaseType || '';

        let singleRelases;
        let totalSingle;

        if (releaseType) {
            // Find only the releases where releaseType is "album"
            singleRelases = await releaseModel.find({ releaseType })
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalSingle = await releaseModel.countDocuments({ releaseType });
            
        } else {
            // Find only the releases where releaseType is "album"
            singleRelases = await releaseModel.find()
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalSingle = await releaseModel.countDocuments();
        }


        if (!singleRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve single releases"
            });
        };


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: singleRelases,

                totalPages: Math.ceil(totalSingle / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalSingle,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get release by id
export const getReleaseByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        const _id = req.body.authMiddlewareParam._id;

        const release_id = req.query.id || '';

        const release = await releaseModel.findById(release_id)
        if (!release) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve release"
            });
        };

        logActivity(req, `Admin - Viewed a release details`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: release,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// search releases
export const searchReleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20


        // Find only the releases where releaseType is "album"
        const singleRelases = await releaseModel.find({ title: { $regex: `^${req.query.search}`, $options: 'i' } })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!singleRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve single releases"
            });
        };


        // Count total single for the user to support pagination
        const totalSingle = await releaseModel.countDocuments({ title: { $regex: `^${req.query.search}`, $options: 'i' } });

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: singleRelases,

                totalPages: Math.ceil(totalSingle / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalSingle,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// update release status 
export const updateReleaseStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        // const _id = req.body.authMiddlewareParam._id;

        const release_id = req.body.release_id || '';
        const status = req.body.status || '';
        const linkTreeUrl = req.body.linkTreeUrl || '';
        const upcEanCode = req.body.upcEanCode || '';

        // Find the release and update the specific song
        const updatedRelease = await releaseModel.findOneAndUpdate(
            { _id: release_id },
            { 
                $set: { 
                    status: status,
                    // liveUrl: linkTreeUrl,
                    ...(linkTreeUrl && {liveUrl: linkTreeUrl}),
                    ...(upcEanCode && {upc_ean: upcEanCode})
                } // $ references the matched song
            },
            { new: true, runValidators: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve release"
            });
        };

        logActivity(req, `Admin - updated release status`, updatedRelease._id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRelease,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// update release UPC/EAN and ISRC 
export const updateReleaseUPC_EAN_ISRC_Ctrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;

        const release_id = req.body.release_id || '';
        const song_id = req.body.song_id || '';
        const upcEanCode = req.body.upcEanCode || '';
        const isrcNumber = req.body.isrcNumber || '';

        // Find the release by ID and update the specific song's fields
        const updatedRelease = await releaseModel.findOneAndUpdate(
            { _id: release_id, "songs._id": song_id }, // Match release and song
            {
                $set: {
                    "songs.$.isrcNumber": isrcNumber, // Update the ISRC number of the matched song
                    upc_ean: upcEanCode,                 // Update the UPC/EAN code for the release
                },
            },
            { new: true, runValidators: true } // Return the updated document
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release"
            });
        };

        logActivity(req, `Admin - updated release UPC/EAN and ISRC number`, admin_id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRelease,
            message: "Updated successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// update release UPC/EAN and ISRC 
export const updateReleaseMusicLinksCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;

        const release_id = req.body.release_id || '';
        const dspLinks: {name: string; url: string; }[] = req.body.dspLinks;
        const urlCode = req.body.musicCode || '';

        const musicCode = urlCode ? urlCode : generateCode();


        // Find the release by ID and update the specific song's fields
        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            {
                $set: {
                    musicLinks: {
                        code: musicCode,
                        url: `https://soundmuve.com/music/${musicCode}`,
                        dspLinks: dspLinks
                    },    // Update the music links for the release
                },
            },
            { new: true, runValidators: true } // Return the updated document
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release"
            });
        };

        logActivity(req, `Admin - updated the music links for the release`, admin_id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRelease,
            message: "Updated the music links for the release successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// Function to generate a random code
function generateCode(length = 6) {
    // Base62 characters (digits + lowercase + uppercase letters)
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    let shortCode = '';
    for (let i = 0; i < length; i++) {
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return shortCode;
}