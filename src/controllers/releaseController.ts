import fs from "fs";
import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { cloudinaryAudioUpload, deleteFileFromCloudinary } from "@/util/cloudFileStorage.js";
import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { logActivity } from "@/util/activityLogFn.js";
import { analyticsModel } from "@/models/analytics.model.js";
import { cartModel } from "@/models/cart.model.js";
import { appleMusicSearchArtistCatelogInterface } from "@/typeInterfaces/release.interface.js";


// Get releases
export const getReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20
        const releaseType = req.query.releaseType;

        // Find only the releases where releaseType is "album"
        const singleRelases = await releaseModel.find({ releaseType, user_id: _id })
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
        const totalSingle = await releaseModel.countDocuments({ releaseType, user_id: _id });

        logActivity(req, "Get Releases", _id);
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

// Get releases by id
export const getReleaseByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const release_id = req.params.release_id;

        // Find only the releases where releaseType is "album"
        const releaseResult = await releaseModel.findById(release_id).lean();

        if (!releaseResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve releases data"
            });
        };

        logActivity(req, "Get Release by id", _id);
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: releaseResult,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Delete release by id
export const deleteReleaseByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // return res.status(404).json({ 
        //     status: false,
        //     statusCode: 404,    
        //     message: 'Deleting release records is not active at the moment' 
        // });
        
        const _id = req.body.authMiddlewareParam._id;
        const release_id = req.params.release_id;


        // Find only the releases where releaseType is "album"
        const releaseResult = await releaseModel.findById(release_id).lean();

        if (!releaseResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'No release records found.' 
            });
        };

        const filesToDelete = [];
    
        // Add coverArt file to the list
        if (releaseResult.coverArt) {
            filesToDelete.push(releaseResult.coverArt);
        }
    
        // Add songAudio files to the list
        if (releaseResult.songs && releaseResult.songs.length > 0) {
            releaseResult.songs.forEach((song) => {
                if (song.songAudio) {
                    filesToDelete.push(song.songAudio);
                }
            });
        }

        // Delete all associated files from Cloudinary
        const cloudinaryDeletionResults = await Promise.all(
            filesToDelete.map((url) => deleteFileFromCloudinary(url))
        );
        // console.log(cloudinaryDeletionResults);
    
        // Check if all Cloudinary files were deleted successfully
        const allFilesDeleted = cloudinaryDeletionResults.every((result) => result);

        const deletionResults = [];

        if (allFilesDeleted) {
            // Proceed to delete the database record
            await releaseModel.deleteOne({ _id: releaseResult._id });
            deletionResults.push({
                recordId: releaseResult._id,
                status: 'success',
                message: 'Record and associated files deleted successfully.',
            });
        } else {
            deletionResults.push({
                recordId: releaseResult._id,
                status: 'failed',
                message: 'Failed to delete one or more associated files from Cloudinary.',
            });
        }

        // Check if all records were deleted successfully
        // const allRecordsDeleted = deletionResults.every((result) => result.status === 'success');
    

        logActivity(req, "Deleted Release by id", _id);
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: deletionResults,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get record label artsit releases
export const getRL_ArtistReleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20
        const artist_id = req.query.artist_id;

        // Find only the releases where releaseType is "album"
        const rlArtistRelases = await releaseModel.find({ recordLabelArtist_id: artist_id, user_id: _id })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();

        if (!rlArtistRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable get record label artist releases."
            });
        };

        // Count total single for the user to support pagination
        const totalSingle = await releaseModel.countDocuments({ recordLabelArtist_id: artist_id, user_id: _id });

        logActivity(req, "Get record label artsit releases", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: rlArtistRelases,

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

// Get record label artsit releases
export const getRL_ArtistSongsDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const artist_id = req.query.artist_id;

        // Count total single releases
        const totalSingles = await releaseModel.countDocuments({ 
            recordLabelArtist_id: artist_id, 
            user_id: _id,
            releaseType: "single"
        });

        // Count total album releases
        const totalAlbums = await releaseModel.countDocuments({ 
            recordLabelArtist_id: artist_id, 
            user_id: _id,
            releaseType: "album"
        });


        // get all live releases by the record label artist
        const rlRelease = await releaseModel.find({ 
            recordLabelArtist_id: artist_id, 
            user_id: _id,
            status: { $in: ["Live", "Complete", "Processing"] }, // Filter by status
        }).lean();

        // Extract release IDs from the array of releaseInterface items
        const releaseIds = rlRelease.map((release) => release._id).filter(Boolean); // Ensure _id is defined

        // Fetch all analytics records matching the release IDs
        const analyticsRecords = await analyticsModel.find({
            release_id: { $in: releaseIds },
        }).lean();

        // Calculate the total revenue
        const totalRevenue = analyticsRecords.reduce((sum, record) => {
            return sum + (record.revenue || 0); // Add revenue for each record (default to 0 if undefined)
        }, 0);



        logActivity(req, "Get record label artsit song counts", _id);

        // response
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                revenue: totalRevenue,
                single: totalSingles,
                album: totalAlbums,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get record label artsit releases
export const getReleaseMusicLinksCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        const musicCode = req.params.musicCode || "";
        
        if (!musicCode) {
            // response
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Music code is required"
            });
        }

        // get the music releases 
        const release = await releaseModel.findOne({ "musicLinks.code": musicCode }).lean();

        if (!release) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Music not found"
            });
        }

        // response
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




// SINGLE RELEASES
export const createSingleReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        
        const releaseData = {
            user_id: _id,
            email: req.body.authMiddlewareParam.email,

            releaseType: "single",
            title: req.body.title,
            mainArtist: req.body.mainArtist,
            language: req.body.language,
            primaryGenre: req.body.primaryGenre,
            secondaryGenre: req.body.secondaryGenre,
            releaseDate: req.body.releaseDate,
            spotifyReleaseTime: req.body.spotifyReleaseTime,
            spotifyReleaseTimezone: req.body.spotifyReleaseTimezone,
            labelName: req.body.labelName,
            recordingLocation: req.body.recordingLocation,
            soldCountries: req.body.soldCountries,
            upc_ean: req.body.upc_ean,

            status: "Incomplete",

            ...(req.body.recordLabelArtist_id && { recordLabelArtist_id: req.body.recordLabelArtist_id }),
        };


        const release_id = req.body.release_id;
        if (release_id) {
            // Find release record by ID and check if it is editable
            const releaseDetail = await releaseModel.findById(release_id).lean();
            if (releaseDetail && releaseDetail.status != "Incomplete" && releaseDetail.status != "Unpaid") {
                return res.status(401).json({
                    status: false,
                    statusCode: 401,
                    message: "You can't edit this release again, please contact support for further assistance." 
                });
            }

            // Find the record by ID and update it
            const updatedRelease = await releaseModel.findByIdAndUpdate(
                release_id,                    // The ID of the record to update
                { $set: releaseData },   // The new data to set
                { new: true, runValidators: true } // Options: Return the updated record and run validation
            );

            // If the record is not found, return a message
            if (!updatedRelease) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "release _id not found."
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: updatedRelease,
                message: "successful"
            });
        }

        
        const newRelease = new releaseModel(releaseData);
        const newReleaseResponds = await newRelease.save();
        if (!newReleaseResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "something went wrong."
            });
        }

        logActivity(req, "Create single release", _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newReleaseResponds,
            message: "release data saved"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const updateCreateSingleReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        if (
            !req.body.release_id || !req.body.stores 
            || !req.body.socialPlatforms || !req.body.songDetails
        ) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "all fields are required."
            });
        }

        const release_id = req.body.release_id;
        const stores = JSON.parse(req.body.stores);
        const socialPlatforms = JSON.parse(req.body.socialPlatforms);
        const songDetails = JSON.parse(req.body.songDetails);

        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id).lean();
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // check if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }
        

        const files: any = req.files;
        const songAudio = files.songAudio ? files.songAudio[0].path : null;
        const coverArt = files.coverArt ? files.coverArt[0].path : null;
        
        // if (!songAudio) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: "song audio file is required."
        //     });
        // }

        // const resultSongAudio = await cloudinaryAudioUpload(songAudio);
        const resultSongAudio = songAudio ? await cloudinaryAudioUpload(songAudio) : releaseData.songs[0].songAudio;
        const resultCoverArt = coverArt ? await cloudinaryAudioUpload(coverArt) : releaseData.coverArt;

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    // release_id: req.body.release_id,
                    stores,
                    socialPlatforms,
                    // preSave: req.body.preSave.toLowerCase() == "true" ? true : false,
                    songs: [
                        {
                            ...songDetails,
                            songAudio: resultSongAudio,
                        },
                    ],
                    coverArt: resultCoverArt,
                    // status: "Unpaid"
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }


        // Optionally delete the local files after uploading to Cloudinary
        if (songAudio) fs.unlinkSync(songAudio);
        if (coverArt) fs.unlinkSync(coverArt);

        logActivity(req, "Create single release 2", '');

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

// Update release status
export const updateReleaseStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const release_id = req.params.release_id;
        const release_status = req.query.status;

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    status: release_status
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }
        
        logActivity(req, "updated release status", _id);

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

// Update release date
export const updateReleaseDateCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const release_id = req.params.release_id;
        const release_date = req.query.releaseDate;

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    releaseDate: release_date,
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }
        
        logActivity(req, "updated release date", _id);

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

// Update release preOrder
export const updateReleasePreOrderCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const release_id = req.params.release_id;

        const status = req.body.status;
        const preOrderChannel = req.body.preOrderChannel;
        const preOrderStartDate = req.body.preOrderStartDate;
        const preOrderTrackPreview = req.body.preOrderTrackPreview;
        // const trackPrice = req.body.trackPrice;
        // const preOrderPrice = req.body.preOrderPrice;

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    preOrder: {
                        status,
                        preOrderChannel,
                        preOrderStartDate,
                        ...(preOrderTrackPreview && { preOrderTrackPreview: preOrderTrackPreview }),
                        // preOrderTrackPreview,
                        // trackPrice,
                        // preOrderPrice,
                    },
                    status: "Unpaid"
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }
        
        logActivity(req, "updated release pre order", _id);

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




// ALBUM RELEASES
export const getAlbumReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20
    
        // Find only the releases where releaseType is "album"
        const albumRelases = await releaseModel
            .find({ releaseType: 'album', user_id: _id })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();

        if (!albumRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve album releases"
            });
        };


        // Count total albums for the user to support pagination
        const totalAlbums = await releaseModel.countDocuments({ releaseType: 'album', user_id: _id });

        logActivity(req, "Get album releases", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: albumRelases,

                totalPages: Math.ceil(totalAlbums / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalAlbums,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const createAlbumRelease1Ctrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const releaseData = {
            user_id: req.body.authMiddlewareParam._id,
            email: req.body.authMiddlewareParam.email,

            releaseType: "album",
            title: req.body.title,
            mainArtist: req.body.mainArtist,
            language: req.body.language,
            primaryGenre: req.body.primaryGenre,
            secondaryGenre: req.body.secondaryGenre,
            releaseDate: req.body.releaseDate,
            spotifyReleaseTime: req.body.spotifyReleaseTime,
            spotifyReleaseTimezone: req.body.spotifyReleaseTimezone,

            // labelName: req.body.labelName,
            // recordingLocation: req.body.recordingLocation,
            // soldCountries: req.body.soldCountries,
            // upc_ean: req.body.upc_ean,

            status: "Incomplete",

            ...(req.body.recordLabelArtist_id && { recordLabelArtist_id: req.body.recordLabelArtist_id }),
        };

        const release_id = req.body.release_id;
        if (release_id) {
            // Find release record by ID and check if it is editable
            const releaseDetail = await releaseModel.findById(release_id).lean();
            if (releaseDetail && releaseDetail.status != "Incomplete" && releaseDetail.status != "Unpaid") {
                return res.status(401).json({
                    status: false,
                    statusCode: 401,
                    message: "You can't edit this release again, please contact support for further assistance." 
                });
            }
            
            
            // Find the record by ID and update it
            const updatedRelease = await releaseModel.findByIdAndUpdate(
                release_id,                    // The ID of the record to update
                { $set: releaseData },   // The new data to set
                { new: true, runValidators: true } // Options: Return the updated record and run validation
            );

            // If the record is not found, return a message
            if (!updatedRelease) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "release _id not found."
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: updatedRelease,
                message: "successful"
            });
        }

        
        const newRelease = new releaseModel(releaseData);
        const newReleaseResponds = await newRelease.save();
        if (!newReleaseResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "something went wrong."
            });
        }

        logActivity(req, "Create album release 1", _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newReleaseResponds,
            message: "release data saved"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const createAlbumRelease2Ctrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const release_id = req.body.release_id;
              
        const formData = {
            labelName: req.body.labelName || '', // optional
            recordingLocation: req.body.recordingLocation || '', // optional 
            soldCountries: req.body.soldCountries,
            upc_ean: req.body.UPC_EANcode || '' // optional
        };


        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // checks if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }
        

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    // release_id: req.body.release_id,
                    ...formData,
                    // status: "Unpaid"
                } 
            }, 
            { new: true, runValidators: true } // Options: Return the updated record and run validation
        );
        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }

        logActivity(req, "Create album release 2", _id);

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

export const createAlbumRelease3Ctrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const release_id = req.body.release_id;
              
        const formData = {
            stores: req.body.stores,
            socialPlatforms: req.body.socialPlatforms,
        };

        // console.log(formData);

        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // checks if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }


        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    // release_id: req.body.release_id,
                    ...formData,
                    // status: "Unpaid"
                } 
            }, 
            { new: true, runValidators: true } // Options: Return the updated record and run validation
        );
        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }

        logActivity(req, "Create album release 3", _id);

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


// Add a song to the albumSongs array
export const createAlbumRelease4Ctrl = async (req: Request, res: Response, next: NextFunction) => {
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

        if (
            !req.body.release_id || !req.body.songTitle || !req.body.songWriters ||
            !req.body.songArtists_Creatives || !req.body.copyrightOwnership ||
            !req.body.explicitLyrics || !req.body.tikTokClipStartTime
        ) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "all fields are required."
            });
        }

        const release_id = req.body.release_id;
        const formData = {
            songAudio: '',
            songTitle: req.body.songTitle,
            songWriters: JSON.parse(req.body.songWriters),
            songArtists_Creatives: JSON.parse(req.body.songArtists_Creatives),
            copyrightOwnership: JSON.parse(req.body.copyrightOwnership),
            explicitLyrics: req.body.explicitLyrics,
            isrcNumber: req.body.isrcNumber || '',
            lyricsLanguage: req.body.lyricsLanguage || '',
            lyrics: req.body.lyrics || '',
            tikTokClipStartTime: JSON.parse(req.body.tikTokClipStartTime),
        };

        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // checks if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }


        const files: any = req.files;
        const songAudio = files.songAudio ? files.songAudio[0].path : null;
        
        if (!songAudio) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "song audio file is required."
            });
        }

        const resultSongAudio = await cloudinaryAudioUpload(songAudio);
        // Optionally delete the local files after uploading to Cloudinary
        fs.unlinkSync(songAudio);

        formData.songAudio = resultSongAudio;

        // Push the new song to albumSongs array
        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { $push: { songs: formData } },
            { new: true, runValidators: true } // Options: Return the updated record and run validation
        );
                
        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }

        logActivity(req, "Create album release 4 - add Song", releaseData.user_id);

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

// Edit a song in the albumSongs array
export const createAlbumRelease4EditAlbumSongsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        if (
            !req.body.release_id || !req.body.song_id || !req.body.songTitle || 
            !req.body.songWriters ||
            !req.body.songArtists_Creatives || !req.body.copyrightOwnership ||
            !req.body.explicitLyrics || !req.body.tikTokClipStartTime
        ) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "all fields are required."
            });
        }


        const release_id = req.body.release_id;
        const song_id = req.body.song_id;

        const formData = {
            songAudio: req.body.songAudio_url || '',
            songTitle: req.body.songTitle,
            songWriters: JSON.parse(req.body.songWriters),
            songArtists_Creatives: JSON.parse(req.body.songArtists_Creatives),
            copyrightOwnership: JSON.parse(req.body.copyrightOwnership),
            explicitLyrics: req.body.explicitLyrics,
            isrcNumber: req.body.isrcNumber || '',
            lyricsLanguage: req.body.lyricsLanguage || '',
            lyrics: req.body.lyrics || '',
            tikTokClipStartTime: JSON.parse(req.body.tikTokClipStartTime),
        };
        // console.log(formData);
        
        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // checks if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }


        const files: any = req.files;
        const songAudio = files.songAudio ? files.songAudio[0].path : null;
        
        if (songAudio) {
            formData.songAudio = await cloudinaryAudioUpload(songAudio);
            // Optionally delete the local files after uploading to Cloudinary
            fs.unlinkSync(songAudio);
        }


        // Find the release and update the specific song
        const updatedRelease = await releaseModel.findOneAndUpdate(
            { _id: release_id, 'songs._id': song_id },
            { 
                $set: { 'songs.$': formData } // $ references the matched song
            },
            { new: true, runValidators: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Release or song not found"
            });
        }

        logActivity(req, "Create album release 4 - edit Song", releaseData.user_id);

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

// Delete a song from the albumSongs array
export const createAlbumRelease4DeleteAlbumSongsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const release_id = req.params.releaseId;
        const song_id = req.params.songId;

        if (!release_id || !song_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                // result: updatedRelease,
                message: "release _id and sond _id is required"
            });
        }


        // Find only the releases where releaseType is "album"
        const releaseResult = await releaseModel.findById(release_id).lean();
        if (!releaseResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'No release records found.' 
            });
        };

        if (releaseResult.status != "Incomplete" && releaseResult.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't delete this release, please contact support for further assistance." 
            });
        }


        const filesToDelete: string[] = [];
    
        // Add songAudio files to the list
        if (releaseResult.songs && releaseResult.songs.length > 0) {
            releaseResult.songs.forEach((song) => {
                if (song._id == song_id && song.songAudio) {
                    filesToDelete.push(song.songAudio);
                }
            });
        }

        // Delete all associated files from Cloudinary
        const cloudinaryDeletionResults = await Promise.all(
            filesToDelete.map((url) => deleteFileFromCloudinary(url))
        );
        // console.log(cloudinaryDeletionResults);
    
        // Check if all Cloudinary files were deleted successfully
        const allFilesDeleted = cloudinaryDeletionResults.every((result) => result);

        const deletionResults = [];

        let updatedRelease: any = undefined;
        if (allFilesDeleted) {
            // Find the release and pull (remove) the song from the array
            updatedRelease = await releaseModel.findByIdAndUpdate(
                release_id,
                { $pull: { songs: { _id: song_id } } }, // Removes the song with the specific ID
                { new: true }
            );

            const deletedCartItem = await cartModel.deleteMany({ release_id });
    
            deletionResults.push({
                recordId: releaseResult._id,
                status: 'success',
                message: 'Record and associated files deleted successfully.',
            });

            if (!updatedRelease) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "Release or song not found"
                });
            }
        } else {
            deletionResults.push({
                recordId: releaseResult._id,
                status: 'failed',
                message: 'Failed to delete one or more associated files from Cloudinary.',
            });
        }


        // // Find the release and pull (remove) the song from the array
        // const updatedRelease = await releaseModel.findByIdAndUpdate(
        //     release_id,
        //     { $pull: { songs: { _id: song_id } } }, // Removes the song with the specific ID
        //     { new: true }
        // );

        // if (!updatedRelease) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: "Release or song not found"
        //     });
        // }

        logActivity(req, "Create album release 4 - delete Song", updatedRelease.user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRelease,
            deletionResults,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


export const createAlbumRelease5Ctrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const release_id = req.body.release_id || '';

        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        // checks if release is editable
        if (releaseData.status != "Incomplete" && releaseData.status != "Unpaid") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "You can't edit this release again, please contact support for further assistance." 
            });
        }

        
        const files: any = req.files;
        const coverArt = files.coverArt ? files.coverArt[0].path : null;
        
        const resultCoverArt = coverArt ? await cloudinaryAudioUpload(coverArt) : '';
        // Optionally delete the local files after uploading to Cloudinary
        fs.unlinkSync(coverArt);

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    coverArt: resultCoverArt,
                    // status: "Unpaid"
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }
        
        logActivity(req, "Create album release 5 - art work cover", updatedRelease.user_id);

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

export const saveAlbumReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const release_id = req.params.release_id || '';
        const preSave = req.body.preSave;

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    preSave: preSave,
                    status: "Unpaid"
                } 
            }, 
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }
        
        logActivity(req, "Save album release - pre-save", updatedRelease.user_id);

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


// search for Spotify Artists
export const searchSpotifyArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const artistName: string = `${ req.query.artistName || '' }`;
        let spotifyAccessToken = req.body.spotify.access_token;
        if (!spotifyAccessToken) spotifyAccessToken = await _getSpotifyAccessTokenFunc();

        const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`;
        const response = (await axios.get(searchUrl, {
            headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`,
            },
        })).data;

        // Extract artist data
        const artists = response.artists.items;

        // Create an array to hold artist details with the latest album and profile picture
        const artistDetails = await Promise.all(artists.map(async (item: any) => {
            const artistId = item.id;
            const profilePicture = item.images[0] ? item.images[0].url : null;

            // Fetch albums for the artist
            const albumsUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=1&sort=release_date`;
            const albumsResponse = await axios.get(albumsUrl, {
                headers: {
                    'Authorization': `Bearer ${spotifyAccessToken}`,
                },
            });

            // Get the latest album
            const latestAlbum = albumsResponse.data.items.length > 0 ? albumsResponse.data.items[0] : null;

            return {
                name: item.name,
                id: artistId,
                profilePicture,
                latestAlbum: latestAlbum ? {
                    name: latestAlbum.name,
                    releaseDate: latestAlbum.release_date,
                    externalUrl: latestAlbum.external_urls.spotify,
                } : null,
            };
        }));

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: artistDetails,
            message: "success"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Endpoint to search for artists on Apple Music
export const searchAppleMusicArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const artistName: string = `${ req.query.artistName || '' }`;

        // Your Apple Music developer token
        const APPLE_MUSIC_TOKEN = req.body.appleMusic.access_token;
        // const APPLE_MUSIC_TOKEN = process.env.APPLE_MUSIC_TOKEN;

        const searchUrl = `https://api.music.apple.com/v1/catalog/us/search`;
        const response = (await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${APPLE_MUSIC_TOKEN}`,
            },
            params: {
                term: artistName,
                types: 'artists', // Only search for artists
                limit: 20, // Limit the number of results
            },
        })).data;
        // console.log(response);
        
        const artists = response.results.artists?.data || [];

        // Fetch detailed information for each artist
        const detailedArtists = await Promise.all(
            artists.map(async (artist: any) => {
                return await getArtistDetails(artist, APPLE_MUSIC_TOKEN);
            })
        );

        // Filter out any null results (failed requests)
        const artistDetails = detailedArtists.filter((artist) => artist !== null);

        // reponse
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: artistDetails,
            message: "success"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Function to fetch artist details and last release
const getArtistDetails = async (artistResult: appleMusicSearchArtistCatelogInterface, APPLE_MUSIC_TOKEN: string) => {
    try {
        // Fetch artist details
        const artistResponse = (await axios.get(`https://api.music.apple.com/v1/catalog/us/artists/${artistResult.id}`, {
            headers: {
                Authorization: `Bearer ${APPLE_MUSIC_TOKEN}`,
            },
        })).data;

        const artist = artistResponse.data[0];

        // Fetch the artist's albums (to get the latest release)
        const albumsResponse = (await axios.get(`https://api.music.apple.com/v1/catalog/us/artists/${artistResult.id}/albums`, {
            headers: {
                Authorization: `Bearer ${APPLE_MUSIC_TOKEN}`,
            },
            params: {
                limit: 1, // Fetch the latest release
                sort: 'releaseDate', // Sort by release date
            },
        })).data;

        const latestAlbum: any = albumsResponse.data[0];

        return {
            id: artist.id,
            name: artist.attributes.name,
            url: artist.attributes.url,
            genreNames: artist.attributes.genreNames,
            profilePicture: artist.attributes.artwork?.url?.replace('{w}x{h}', '500x500'), // Get a 500x500 image
            latestAlbum: latestAlbum ? 
                {
                    name: latestAlbum.attributes.name,
                    releaseDate: latestAlbum.attributes.releaseDate,
                    artwork: latestAlbum.attributes.artwork?.url?.replace('{w}x{h}', '500x500'),
                    externalUrl: latestAlbum.attributes.url,
                }
            : null, // Handle case where no releases are available
        };

    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;
        console.log(artistResult.id, err);
        // console.error(`Error fetching details for artist ${artistId}:`, err.message);

        return {
            id: artistResult.id,
            name: artistResult.attributes.name,
            url: artistResult.attributes.url,
            genreNames: artistResult.attributes.genreNames,
            profilePicture: artistResult.attributes.artwork?.url?.replace('{w}x{h}', '500x500'), // Get a 500x500 image
            latestAlbum: undefined
        };

        // return null;
    }
};
