import { Request, Response, NextFunction } from "express-serve-static-core";
import mongoose from "mongoose";

import { releaseModel } from "@/models/release.model.js";
import { userModel } from '@/models/users.model.js';

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { logActivity } from "@/util/activityLogFn.js";
import { songInterface } from "@/typeInterfaces/release.interface.js";
import { analyticsModel } from "@/models/analytics.model.js";
import { analyticsInterface } from "@/typeInterfaces/analytics.interface.js";
import { transactionModel } from "@/models/transaction.model.js";



// Get all live releases
export const getLiveResleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find only the releases where status is "Live"
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


                // get the date the analytics for the release was last updated
                const analyticsData = await analyticsModel.findOne({
                    release_id: release._id,
                    user_id: release.user_id,
                    // song_id: song_id,
                })
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .lean();
        

                return {
                    user: userData,
                    release: release,
                    lastUpdated: analyticsData?.updatedAt || null,
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

// search live releases by title
export const searchLiveReleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 25; // Number of items per page, default is 20



        // Build the search query
        const searchQuery = {
            $and: [
                { status: "Live" }, // Filter by status
                {
                    $or: [
                        { title: { $regex: `^${req.query.search}`, $options: 'i' } },
                        { "songs.songTitle": { $regex: `^${req.query.search}`, $options: 'i' } },
                    ],
                }
            ]
        }
                
        // Perform a case-insensitive search by title
        // Find only the releases where status is "Live"
        const releasesResult = await releaseModel.find(searchQuery)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .lean();

        
        // Combine data from the User and Release collections
        const fullRelases = await Promise.all(
            releasesResult.map(async (release) => {
                const userData = await userModel.findById(release.user_id).lean();

                // get the date the analytics for the release was last updated
                const analyticsData = await analyticsModel.findOne({
                    release_id: release._id,
                    user_id: release.user_id,
                    // song_id: song_id,
                })
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .lean();
        

                return {
                    user: userData,
                    release: release,
                    lastUpdated: analyticsData?.updatedAt || null,
                };
            })
        );


        // Count total data for the user to support pagination
        const totalData = await releaseModel.countDocuments(searchQuery);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                // data: usersResult,
                data: fullRelases,

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

// Get a single live releases by _id
export const getLiveReleaseByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const release_id = req.query.release_id || '';
        const song_id = req.query.song_id || '';

        const releases = await releaseModel.findById(release_id).lean();
        if (!releases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find release data."
            });
        };

        const userData = await userModel.findById(releases.user_id).lean();
        const analyticsData = await analyticsModel.find({
            release_id: releases._id,
            song_id: song_id,
            user_id: releases.user_id,
        }).sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();


        const calculateTotalAnalytics = (data: analyticsInterface[]) => {
            return data.reduce(
                (totals, item) => {
                    totals.revenue += item.revenue;
                    totals.streamRevenue += item.streamRevenue;
                    totals.streamPlay += item.streamPlay;
                    totals.noSold += item.noSold;
                    totals.albumSold += item.albumSold;
                    return totals;
                },
                { revenue: 0, streamRevenue: 0, streamPlay: 0, noSold: 0, albumSold: 0 }
            );
        } 

        const getLastAnalyticsRecord = () => {
            if (analyticsData && analyticsData.length) {
                return {
                    analyticsData: analyticsData[0],
                    lastUpdated: analyticsData[0].createdAt
                };
                // return analyticsData[0];
            }
            return null;
        }

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                user: userData,
                release: releases,

                // analytics: analyticsData,
                totalAnalytics: calculateTotalAnalytics(analyticsData),
                lastAnalytics:  getLastAnalyticsRecord()?.analyticsData,

                lastUpdated: getLastAnalyticsRecord()?.lastUpdated
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get a single analytics date by month and _id
export const getAnalyticsByDateCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const release_id = req.query.release_id || '';
        const song_id = req.query.song_id || '';
        const analytics_date = req.query.analytics_date || '';

        const analyticsData = await analyticsModel.findOne({
            release_id: release_id,
            song_id: song_id,
            date: analytics_date,
        }).lean();

        if (!analyticsData) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "No analytics record for this date."
            });
        }

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: analyticsData,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get a single analytics date by month and _id
export const setAnalyticsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const admin_id = req.body.authMiddlewareParam._id;
        const admin_user_email = req.body.authMiddlewareParam.email;
        const admin_fullname = req.body.admin_fullname || '';

        const analytics_id = req.body.analytics_id;

        const release_id = req.body.release_id;
        const newRevenue = Number(req.body.revenue);


        const releaseDetails = await releaseModel.findById(release_id).lean();
        if (!releaseDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "No release found for with this id."
            });
        }

        const userDetails = await userModel.findById(releaseDetails.user_id).lean();
        if (!userDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "User of the analytics could not be found."
            });
        }
        

        const newAnalyticsData = {
            user_email: userDetails.email,
            user_id: userDetails._id,

            release_id: req.body.release_id,
            song_id: req.body.song_id,
            date: req.body.date,
            albumSold: req.body.albumSold || 0,
            noSold: req.body.noSold,
            revenue: newRevenue,
            streamRevenue: req.body.streamRevenue,
            streamPlay: req.body.streamPlay,
            location: req.body.location,

            updatedBy: {
                user_id: admin_id,
                user_email: admin_user_email,
                name: admin_fullname
            },

            status: "Complete"
        };
        

        let analyticsResult;
        let transactionResult;
        
        if (analytics_id) {
            const analyticsDetails = await analyticsModel.findById(analytics_id).lean();
            if (!analyticsDetails) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    status: false,
                    statusCode: 400,
                    message: "No analytics data found for with this id."
                });
            }


            // Find and update the analytics
            const updatedAnalytics = await analyticsModel.findByIdAndUpdate(
                analytics_id,
                {
                    $set: newAnalyticsData,
                },
                { new: true } // Return the updated document
            );
            if (!updatedAnalytics) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    status: false,
                    statusCode: 400,
                    message: "No analytics data found for with this id."
                });
            }
            analyticsResult = updatedAnalytics;


            // Find and update the transaction
            const updatedTransaction = await transactionModel.findOneAndUpdate(
                { "credit.analytics_id": analytics_id },
                {
                    $set: {
                        amount: newRevenue,
                        // updatedBy: updatedBy,

                        updatedBy: {
                            user_id: admin_id,
                            user_email: admin_user_email,
                            name: admin_fullname
                        },
                    },
                },
                { new: true } // Return the updated document
            );

            if (!updatedTransaction) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    status: false,
                    statusCode: 400,
                    message: "Transaction with the given analytics_id not found"
                });
            }
            transactionResult = updatedTransaction;


            /*
                let balance = bal;
                let oldAmount = oa;
                let newAmount = na;

                const newBalance = bal - oa + na;
            */

            const newBalance = Number(userDetails.balance) - Number(analyticsDetails.revenue) + newRevenue;

            // Find and update the user balance
            const updatedUser = await userModel.findByIdAndUpdate(
                userDetails._id,
                {
                    $set: {
                        balance: newBalance,
                    },
                },
                { new: true } // Return the updated document
            );
            if (!updatedUser) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'Unable to update user balance, please try again after some time.'
                });
            }
            
        } else {
            const newAnalytics = new analyticsModel(newAnalyticsData);
            // const result = await newAnalytics.save({ session });
            analyticsResult = await newAnalytics.save({ session });
    
            if (!analyticsResult) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'server error, try again after some time.'
                });
            }

            

            const newTransactionData = {
                user_email: userDetails.email,
                user_id: userDetails._id,

                transactionType: "Credit",

                description: `Revenue from your ${releaseDetails.releaseType} release - ${releaseDetails.title}`,
                amount: newRevenue,

                credit: {
                    analytics_id: analyticsResult._id,
                    release_id: req.body.release_id,
                    // song_id: req.body.song_id
                },

                // withdrawal: {},

                updatedBy: {
                    user_id: admin_id,
                    user_email: admin_user_email,
                    name: admin_fullname
                },

                status: "Success"
            };
            
            const newTransaction = new transactionModel(newTransactionData);
            transactionResult = await newTransaction.save({ session });
    
            if (!transactionResult) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'server error, try again after some time.'
                });
            }

            const newBalance = Number(userDetails.balance) + newRevenue;

            // Find and update the user balance
            const updatedUser = await userModel.findByIdAndUpdate(
                userDetails._id,
                {
                    $set: {
                        balance: newBalance,
                    },
                },
                { new: true } // Return the updated document
            );
            if (!updatedUser) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'Unable to update user balance, please try again after some time.'
                });
            }
        }



        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logActivity(req, `Updated analytics record for - ${ releaseDetails.title }`, admin_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                transaction: transactionResult,
                analytics: analyticsResult
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
        

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: "successful"
        });

        // Find only the releases where releaseType is "album"
        const releases = await releaseModel.find().lean();
        const releaseCount = await releaseModel.countDocuments();
        // console.log(releaseCount);
        
        
        // Combine data from the User and Release collections
        const fullRelases = await Promise.all(
            releases.map(async (release) => {
                let songsArray: songInterface[] = [];

                // if (release.albumSongs?.length) {
                //     songsArray = release.albumSongs;
                // } else if (release.singleSong) {
                //     songsArray.push(release.singleSong);
                // } else {
                //     console.log("hello error");
                //     console.log(release);
                // }


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

