import { Request, Response, NextFunction } from "express-serve-static-core";

// models
import { userModel } from '@/models/users.model.js';
import { activityLogModel } from "@/models/activityLog.model.js";
import { logActivity } from "@/util/activityLogFn.js";
import { transactionModel } from "@/models/transaction.model.js";
import { releaseModel } from "@/models/release.model.js";
import { analyticsModel } from "@/models/analytics.model.js";

// utilities




export const getActivityLogCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const user_id = req.query.user_id;
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find only the user where user_id is "_id"
        const activityLogRes = await activityLogModel.find({ user_id: user_id || _id })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .exec();
            
        if (!activityLogRes) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "No activity found for this user."
            });
        }

        // Count total record to support pagination
        const totalRecord = await activityLogModel.countDocuments({ user_id: user_id || _id });

        logActivity(req, "Gets User Activity Log", _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: activityLogRes,
                totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalRecord,
            },
            message: 'successful',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// Get dashboard total Analysis Ctrl
export const getDashboardTopTotalAnalysisCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const totalUsersCount = await userModel.countDocuments();
        const totalArtistUsersCount = await userModel.countDocuments({
            userType: "artist"
        });
        const totalRlUsersCount = await userModel.countDocuments({
            userType: "record label"
        });


        // Use MongoDB's aggregation to calculate the total balance
        const totalBalanceResult = await userModel.aggregate([
            {
                $group: {
                    _id: null, // Group all documents together
                    totalBalance: { $sum: "$balance" }, // Sum up the 'balance' field
                },
            },
        ]);
        // If no users are found, return zero
        const totalUsersBalance = totalBalanceResult.length > 0 ? totalBalanceResult[0].totalBalance : 0;


        // Use MongoDB's aggregation pipeline to calculate the total amount
        const TotalCreditResult = await transactionModel.aggregate([
            {
                $match: {
                    transactionType: "Credit",
                    status: { $in: ["Success", "Complete"] }, // Filter by status
                },
            },
            {
                $group: {
                    _id: null, // Group all documents together
                    totalAmount: { $sum: "$amount" }, // Sum up the 'amount' field
                },
            },
        ]);
        // If no transactions match, return zero
        const totalTransactionAmount = TotalCreditResult.length > 0 ? TotalCreditResult[0].totalAmount : 0;


        const totalReleaseCount = await releaseModel.countDocuments();
        const totalLiveReleaseCount = await releaseModel.countDocuments({
            status: "Live"
        });


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                users: {
                    totalUsers: totalUsersCount,
                    totalArtist: totalArtistUsersCount,
                    totalRl: totalRlUsersCount,
                },
                revenue: {
                    totalUsersBalance,
                    totalTransactionAmount,
                },
                projects: {
                    totalLiveReleases: totalLiveReleaseCount,
                    totalReleases: totalReleaseCount
                }
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get Best performing projects
export const getBestPerformingProjectsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        // Use MongoDB aggregation to calculate and sort revenues
        const BPPresult = await analyticsModel.aggregate([
            {
                $match: {
                    status: { $in: ["Success", "Complete"] }, // Filter by status
                },
            },
            {
                $group: {
                    _id: "$release_id", // Group by release_id
                    totalRevenue: { $sum: "$revenue" }, // Sum up the revenue field
                },
            },
            {
                $sort: { totalRevenue: -1 }, // Sort by totalRevenue in descending order
            },
            {
                $limit: 10, // Limit to top 10 results
            },
        ]);

        // console.log(BPPresult);
        // console.log(BPPresult.length);

        // Combine data from the analytics and Release collections
        const bestPerformingProjects = await Promise.all(
            BPPresult.map(async (project) => {
                const releaseData = await releaseModel.findById(project._id).lean();
                // const userData = await userModel.findById(releaseData?.user_id).lean();

                return {
                    ...releaseData,
                    totalRevenue: project.totalRevenue,
                };
            })
        );

        
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: bestPerformingProjects,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}