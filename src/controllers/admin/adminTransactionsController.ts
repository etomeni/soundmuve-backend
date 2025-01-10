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
import { payoutDetailsModel } from "@/models/payoutDetails.model.js";



// Get all transaction
export const getTransactionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find all transaction record
        const transactionResults = await transactionModel.find()
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .lean();
        
        // Combine data from the User and transaction collections
        const transactions = await Promise.all(
            transactionResults.map(async (transaction) => {
                const userData = await userModel.findById(transaction.user_id).lean();

                return {
                    ...transaction,

                    userType: userData?.userType || '',
                    balance: userData?.balance || '',
                    email: userData?.email || '',
                    firstName: userData?.firstName || '',
                    lastName: userData?.lastName || '',
                    artistName: userData?.artistName || '',
                    recordLabelName: userData?.recordLabelName || '',
                };
            })
        );

        const recordCount = await transactionModel.countDocuments();

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: transactions,

                totalPages: Math.ceil(recordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: recordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get a transaction by _id
export const getTransactionsByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const transaction_id = req.query.transaction_id || '';

        const transactionResult = await transactionModel.findById(transaction_id).lean();
        if (!transactionResult) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get transaction record."
            });
        };

        const userData = await userModel.findById(transactionResult.user_id).lean();


        let releaseData;
        let analyticsData;
        if (transactionResult.transactionType == "Credit" && transactionResult.credit) {
            releaseData = await releaseModel.findById(transactionResult.credit.release_id).lean();
            analyticsData = await analyticsModel.findById(transactionResult.credit.analytics_id).lean();
        }


        let payoutData;
        if (transactionResult.transactionType == "Withdrawal" && transactionResult.withdrawal) {
            payoutData = await payoutDetailsModel.findById(transactionResult.withdrawal.payout_id).lean();
        }


        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                transaction: transactionResult,
                user: userData,

                release: releaseData,
                analytics: analyticsData,
                
                payout: payoutData,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get all transaction Withdrawal request
export const getWithdrawalRequestCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20


        // Query to filter data
        const filterQuery = {
            transactionType: "Withdrawal",
            status: { $in: ["Pending", "Processing"] },
        };
        
        // Find all transaction record
        const transactionResults = await transactionModel.find(filterQuery)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .lean();

        // Combine data from the User and transaction collections
        const transactions = await Promise.all(
            transactionResults.map(async (transaction) => {
                const userData = await userModel.findById(transaction.user_id).lean();

                return {
                    ...transaction,

                    userType: userData?.userType || '',
                    balance: userData?.balance || '',
                    email: userData?.email || '',
                    firstName: userData?.firstName || '',
                    lastName: userData?.lastName || '',
                    artistName: userData?.artistName || '',
                    recordLabelName: userData?.recordLabelName || '',
                };
            })
        );

        const recordCount = await transactionModel.countDocuments(filterQuery);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: transactions,

                totalPages: Math.ceil(recordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: recordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get top total transaction Analysis Ctrl
export const getTopTotalTransactionAnalysisCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const totalUsersBalanceResult = await userModel.aggregate([
            {
                $group: {
                    _id: null, // Group all documents together
                    totalBalance: { $sum: "$balance" }, // Sum up the 'balance' field
                },
            },
        ]);
        // If no users are found, return zero
        const totalUsersBalance = totalUsersBalanceResult.length > 0 ? totalUsersBalanceResult[0].totalBalance : 0;


        // Use MongoDB's aggregation pipeline to calculate the total amount
        const totalBalanceResult = await transactionModel.aggregate([
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
        const totalBalance = totalBalanceResult.length > 0 ? totalBalanceResult[0].totalAmount : 0;


        // Use MongoDB's aggregation pipeline to calculate the total amount
        const TotalPaidoutResult = await transactionModel.aggregate([
            {
                $match: {
                    transactionType: "Withdrawal",
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
        const totalPaidoutAmount = TotalPaidoutResult.length > 0 ? TotalPaidoutResult[0].totalAmount : 0;


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                totalUsers: {
                    totalUsers: totalUsersCount,
                    totalArtist: totalArtistUsersCount,
                    totalRl: totalRlUsersCount,
                },
                totalUsersBalance,
                totalBalance,
                totalPaidoutAmount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
