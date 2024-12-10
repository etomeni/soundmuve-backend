import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { userModel } from '@/models/users.model.js';

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { logActivity } from "@/util/activityLogFn.js";
import { recordLabelArtistModel } from "@/models/recordLabelArtist.model.js";


// Get all users
export const getAllUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const any_userType: any = req.query.userType || '';
        const userType: "All" | "artist" | "record label" = any_userType;

        let usersResult;
        let totalRecord;

        if (userType && userType != "All" ) {
            // Find only the releases where userType is "album"
            usersResult = await userModel.find({ userType })
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalRecord = await userModel.countDocuments({ userType });
            
        } else {
            // Find only the releases where releaseType is "album"
            usersResult = await userModel.find()
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalRecord = await userModel.countDocuments();
        }


        if (!usersResult) {
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
                data: usersResult,

                totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalRecord,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get user details by id
export const getUserByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const user_id = req.query.id || '';

        const users = await userModel.findById(user_id)
        if (!users) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve users"
            });
        };

        const rlArtistCount = await recordLabelArtistModel.countDocuments({ user_id });
        const releasesCount = await releaseModel.countDocuments({ user_id });


        logActivity(req, `Admin - Viewed a user details`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                user: users,
                rlArtistCount,
                releasesCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get user details by id
export const getTopUsersStatsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;


        // Get top 5 users with highest balance
        const topBalances = await userModel.find({})
        .sort({ balance: -1 })
        .limit(5)
        .lean(); // Convert documents to plain JavaScript objects

        // Combine data from the User and Release collections
        const topBalancesWithReleaseCount = await Promise.all(
            topBalances.map(async (user) => {
                const releaseCount = await releaseModel.countDocuments({ user_id: user._id });

                return {
                    ...user,
                    releaseCount,
                };
            })
        );


        // Get top 5 users with the highest number of releases
        const topReleases = await releaseModel.aggregate([
            {
                $group: {
                    _id: "$user_id",
                    releaseCount: { $sum: 1 },
                },
            },
            { $sort: { releaseCount: -1 } },
            { $limit: 5 },
        ]);

        // Combine data from the User and Release collections
        const usersWithReleases = await Promise.all(
            topReleases.map(async (release) => {
                const user = await userModel.findById(release._id).lean();
                if (user) {
                    return {
                        ...user,
                        releaseCount: release.releaseCount,
                    };
                }
                return null;
            })
        );
    

        logActivity(req, `Admin - Gets top stats.`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                topBalances: topBalancesWithReleaseCount,
                topReleases: usersWithReleases.filter(Boolean),
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// search users by name
export const searchUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 25; // Number of items per page, default is 20

        // Perform a case-insensitive search by first name or last name
        const usersResult = await userModel.find({
            $or: [
                { firstName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { lastName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { artistName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { recordLabelName: { $regex: `^${req.query.search}`, $options: 'i' } },
            ],
        })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .exec();
        
        if (!usersResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve single releases"
            });
        };


        // Count total data for the user to support pagination
        const totalData = await userModel.countDocuments({ 
            $or: [
                { firstName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { lastName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { artistName: { $regex: `^${req.query.search}`, $options: 'i' } },
                { recordLabelName: { $regex: `^${req.query.search}`, $options: 'i' } },
            ]
        });

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: usersResult,

                totalPages: Math.ceil(totalData / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalData,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// Get all users releases
export const getAllUsersReleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const user_id: any = req.query.user_id;

        // Find releases for the specified user_id
        const usersResult = await releaseModel.find({ user_id })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        // Count total record to support pagination
        const totalRecord = await releaseModel.countDocuments({ user_id });

        if (!usersResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve releases"
            });
        };


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: usersResult,

                totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalRecord,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get all artist under a record label
export const getAllArtistUnderRecordLabelCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const user_id: any = req.query.user_id;

        // Find releases for the specified user_id
        const usersResult = await recordLabelArtistModel.find({ user_id })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        // Count total record to support pagination
        const totalRecord = await recordLabelArtistModel.countDocuments({ user_id });

        if (!usersResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get record label artist data"
            });
        };


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: usersResult,

                totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalRecord,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get releases of artist under a record label 
export const getReleasesOfArtistUnderRecordLabelCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const user_id: any = req.query.user_id;
        const recordLabelArtist_id: any = req.query.artist_id;

        // Find releases for the specified user_id
        const usersResult = await releaseModel.find({ user_id, recordLabelArtist_id })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        // Count total record to support pagination
        const totalRecord = await releaseModel.countDocuments({ user_id, recordLabelArtist_id });

        if (!usersResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get record label artist data"
            });
        };


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: usersResult,

                totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalRecord,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// update user status 
export const updateUserStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const user_id = req.body.user_id || '';
        const currentStatus = req.body.currentStatus || '';

        // Find the user and update the status
        const updatedUser = await userModel.findByIdAndUpdate(
            user_id,
            { 
                status: !currentStatus,
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve update"
            });
        };

        logActivity(req, `Admin - updated user status`, _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedUser,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}