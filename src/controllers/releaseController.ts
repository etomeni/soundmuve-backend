import fs from "fs";
import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { cloudinaryAudioUpload } from "@/util/cloudFileStorage.js";
import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";


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
        const singleRelases = await releaseModel.find({ recordLabelArtist_id: artist_id, user_id: _id })
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
        const totalSingle = await releaseModel.countDocuments({ recordLabelArtist_id: artist_id, user_id: _id });

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

// Get record label artsit releases
export const getRL_ArtistSongsDataCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const artist_id = req.query.artist_id;

        // Count total single for the user to support pagination
        const totalSingles = await releaseModel.countDocuments({ 
            recordLabelArtist_id: artist_id, 
            user_id: _id,
            releaseType: "single"
        });

        const totalAlbums = await releaseModel.countDocuments({ 
            recordLabelArtist_id: artist_id, 
            user_id: _id,
            releaseType: "album"
        });

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                revenue: 0,
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
        
        const releaseData = {
            user_id: req.body.authMiddlewareParam._id,
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
            || !req.body.socialPlatforms || !req.body.singleSong
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
        const singleSong = JSON.parse(req.body.singleSong);

        // check if the user exist in the database
        const releaseData = await releaseModel.findById(release_id);
        if (!releaseData) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No release with id found, please create a new release."
            });
        }

        const files: any = req.files;
        const songAudio = files.songAudio ? files.songAudio[0].path : null;
        const coverArt = files.coverArt ? files.coverArt[0].path : null;
        
        if (!songAudio) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "song audio file is required."
            });
        }

        const resultSongAudio = await cloudinaryAudioUpload(songAudio);
        const resultCoverArt = coverArt ? await cloudinaryAudioUpload(coverArt) : '';

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    // release_id: req.body.release_id,
                    stores,
                    socialPlatforms,
                    singleSong: {
                        ...singleSong,
                        songAudio: resultSongAudio,
                    },
                    coverArt: resultCoverArt,
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


        // Optionally delete the local files after uploading to Cloudinary
        fs.unlinkSync(songAudio);
        fs.unlinkSync(coverArt);
        
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
            isrcNumber: req.body.ISRC_Number || '',
            lyricsLanguage: req.body.lyricsLanguage || '',
            lyrics: req.body.songLyrics || '',
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
            { $push: { albumSongs: formData } },
            { new: true, runValidators: true } // Options: Return the updated record and run validation
        );
                
        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to update release."
            });
        }

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
            isrcNumber: req.body.ISRC_Number || '',
            lyricsLanguage: req.body.lyricsLanguage || '',
            lyrics: req.body.songLyrics || '',
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

        const files: any = req.files;
        const songAudio = files.songAudio ? files.songAudio[0].path : null;
        
        if (songAudio) {
            formData.songAudio = await cloudinaryAudioUpload(songAudio);
            // Optionally delete the local files after uploading to Cloudinary
            fs.unlinkSync(songAudio);
        }


        // Find the release and update the specific song
        const updatedRelease = await releaseModel.findOneAndUpdate(
            { _id: release_id, 'albumSongs._id': song_id },
            { 
                $set: { 'albumSongs.$': formData } // $ references the matched song
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

        // const { releaseId, songId } = req.params;

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

        // Find the release and pull (remove) the song from the array
        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { $pull: { albumSongs: { _id: song_id } } }, // Removes the song with the specific ID
            { new: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Release or song not found"
            });
        }

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

        const files: any = req.files;
        const coverArt = files.coverArt ? files.coverArt[0].path : null;
        

        const resultCoverArt = coverArt ? await cloudinaryAudioUpload(coverArt) : '';

        const updatedRelease = await releaseModel.findByIdAndUpdate(
            release_id,
            { 
                $set: { 
                    coverArt: resultCoverArt,
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

        // Optionally delete the local files after uploading to Cloudinary
        fs.unlinkSync(coverArt);
        
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
