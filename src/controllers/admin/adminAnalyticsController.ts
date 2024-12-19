import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { userModel } from '@/models/users.model.js';

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { logActivity } from "@/util/activityLogFn.js";
import { recordLabelArtistModel } from "@/models/recordLabelArtist.model.js";
import { songInterface } from "@/typeInterfaces/release.interface.js";



// Get all live releases
export const getLiveResleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find only the releases where releaseType is "album"
        const releases = await releaseModel.find({ 
            status: "Live",
        })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .lean();
        
        // Combine data from the User and Release collections
        const fullRelases = await Promise.all(
            releases.map(async (release) => {
                const userData = await userModel.findById(release.user_id).lean();

                // TODO:::
                // get the date the analytics for the release was last updated

                return {
                    user: userData,
                    release: release,
                    lastUpdated: null,
                };
            })
        );

        const releaseCount = await releaseModel.countDocuments({ status: "Live" });

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: fullRelases,

                totalPages: Math.ceil(releaseCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: releaseCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get all live releases
export const resetResleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        // Find only the releases where releaseType is "album"
        const releases = await releaseModel.find().lean();
        const releaseCount = await releaseModel.countDocuments();
        console.log(releaseCount);
        
        
        // Combine data from the User and Release collections
        const fullRelases = await Promise.all(
            releases.map(async (release) => {
                let songsArray: songInterface[] = [];

                if (release.albumSongs?.length) {
                    songsArray = release.albumSongs;
                } else if (release.singleSong) {
                    songsArray.push(release.singleSong);
                } else {
                    console.log("hello error");
                    console.log(release);
                }


                const releaseData = await releaseModel.findByIdAndUpdate(
                    release._id,
                    {
                        $set: {
                            songs: songsArray
                        }
                    },
                    { new: true, runValidators: true } // Options: Return the updated record and run validation
                ).lean();


                return {
                    ...releaseData
                };
            })
        );


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: fullRelases,
            count: releaseCount,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

