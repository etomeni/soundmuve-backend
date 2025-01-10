import { Request, Response, NextFunction } from "express-serve-static-core";
import mongoose from "mongoose";

import axios from "axios";
// import { releaseModel } from "@/models/release.model.js";
import { userModel } from '@/models/users.model.js';
import { transactionModel } from "@/models/transaction.model.js";
// import { analyticsModel } from "@/models/analytics.model.js";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";

// import { songInterface } from "@/typeInterfaces/release.interface.js";
// import { analyticsInterface } from "@/typeInterfaces/analytics.interface.js";
// import { payoutDetailsInterface } from "@/typeInterfaces/payout.interface.js";
import { withdrawExchangeInterface } from "@/typeInterfaces/transaction.interface.js";
// import { logActivity } from "@/util/activityLogFn.js";



// Get get flutterwave exchange rate
export const getExchangeRateCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;

        const { amount, currency } = req.query;

        const url_flutterwave = `https://api.flutterwave.com/v3/transfers/rates?amount=${amount}&destination_currency=${currency}&source_currency=USD`;
        const response = (await axios.get(url_flutterwave, {
            headers: {
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json',
            }
        })).data;


        if (!response.data) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                result: [],
                message: "something went wrong"
            });
        }

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: response.data,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get all transactions for a specified date range
export const getTransactionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;
        
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const startDate = req.query.startDate;
        const endDate = req.query.endDate;


        // Convert dates to ISO format
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        // Add end of the day for the end date
        end.setUTCHours(23, 59, 59, 999);
 
        const filter = {
            user_id,
            // user_email,
            createdAt: {
                $gte: start,
                $lte: end,
            },
        };

        // Find all transaction record with pagination
        const transactionResults = await transactionModel.find(filter)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .lean();

        if (!transactionResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get transactions."
            });
        }
        
        // Get total count for pagination
        const recordCount = await transactionModel.countDocuments(filter);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: transactionResults,

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



// Get get flutterwave exchange rate
export const initiateWithdrawalCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const narration = req.body.narration;
        const currency = req.body.currency;
        const amount = Number(req.body.amount);
        const exchangeRate: withdrawExchangeInterface = req.body.exchangeRate;
        const paymentDetails = req.body.paymentDetails;


        const userDetails = await userModel.findById(user_id).lean();
        if (!userDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get user record."
            });
        }

        if (Number(userDetails.balance) < amount) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "insufficient balance."
            });
        }
        

        const newTransactionData = {
            user_email: user_email,
            user_id: user_id,

            transactionType: "Withdrawal",

            description: `Withdrawal - ${narration}`,
            amount: amount,

            withdrawal: {
                ...paymentDetails,

                exchangeRate,
                narration,
                currency,
            },

            updatedBy: {
                user_id: '',
                user_email: '',
                name: ''
            },

            status: "Pending"
        };
        
        const newTransaction = new transactionModel(newTransactionData);
        const transactionResult = await newTransaction.save({ session });

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


        const newBalance = Number(userDetails.balance) - amount;

        // Find and update the user balance
        const updatedUser = await userModel.findByIdAndUpdate(
            userDetails._id,
            {
                $set: {
                    balance: newBalance,
                },
            },
            { new: true } // Return the updated document
        ).session(session);

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


        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        // logActivity(req, `Updated analytics record for - ${ releaseDetails.title }`, admin_id);
        

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: transactionResult,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

