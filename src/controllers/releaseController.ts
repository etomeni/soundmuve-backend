import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { cloudinaryAudioUpload } from "@/util/cloudFileStorage.js";
import fs from "fs";
import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import axios from "axios";


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
                    message: "release _id went wrongnot found."
                });
            }

            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: updatedRelease,
                message: "release data saved"
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
                    status: "Complete"
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
            message: "release data saved"
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
