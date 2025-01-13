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
import { payoutDetailsInterface } from "@/typeInterfaces/payout.interface.js";
import { transactionInterface } from "@/typeInterfaces/transaction.interface.js";
import { userInterface } from "@/typeInterfaces/users.interface.js";
import axios from "axios";


const FLUTTERWAVE_API_URL = 'https://api.flutterwave.com/v3/transfers';

interface withdrawalDataInterface {
    payoutDetails: payoutDetailsInterface,
    transactionDetails: transactionInterface,
    userDetails: userInterface,
    admin_id: string,
    adminEmail: string,
}

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
                    status: { $in: ["Processing", "Success", "Complete"] }, // Filter by status
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

// handle accept withdrawal requests
export const acceptWithdrawalCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        const adminEmail = req.body.authMiddlewareParam.email;

        const session = await mongoose.startSession();
        session.startTransaction();
        
        const user_id = req.body.user_id;
        const transaction_id = req.body.transaction_id;
        const payout_id = req.body.payout_id;
        const adminName = req.body.adminName;

        // get transaction current database record
        const payoutDetails = await payoutDetailsModel.findById(payout_id).lean();
        if (!payoutDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get user withdrawal record."
            });
        }

        // get transaction current database record
        const transactionDetails = await transactionModel.findById(transaction_id).lean();
        if (!transactionDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get transaction record."
            });
        }

        // get user current database record
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


        const withdrawalData: withdrawalDataInterface = {
            payoutDetails,
            transactionDetails,
            userDetails,
            admin_id,
            adminEmail
        }

        interface paymentResultInterface {
            status: boolean;
            statusCode: number;
            result: any;
            message: string;
            error?: any;
        };
        let paymentResult: paymentResultInterface = {
            status: false,
            statusCode: 0,
            result: undefined,
            message: ""
        };

        if (payoutDetails.paymentMethod == "Bank") {
            paymentResult = await handleFlutterwaveWithdrawalCtrl(withdrawalData);
        } else if (payoutDetails.paymentMethod == "PayPal") {
            paymentResult = await handlePaypalWithdrawalCtrl(withdrawalData);
        } else  {

        }


        const transactionStatus = paymentResult.status ? "Complete" : "Processing";
        // Find and update the transaction record
        const updatedTransaction = await transactionModel.findByIdAndUpdate(
            transactionDetails._id,
            {
                $set: {
                    // status: "Complete", // "Success",
                    status: "Processing",
                    metaData: {
                        status: paymentResult.result.status || '',
                        message: paymentResult.message,
                        data: paymentResult.result
                    },

                    updatedBy: {
                        user_id: admin_id,
                        user_email: adminEmail,
                        name: adminName
                    }
                },
            },
            { new: true } // Return the updated document
        ).session(session);

        if (!updatedTransaction) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update transaction status, please try again after some time.'
            });
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logActivity(req, `Updated transaction status - ${ transactionDetails._id }`, admin_id);
        
        // Response
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                transaction: updatedTransaction,
                user: userDetails,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// handle accept flutterwave withdrawal requests
const handleFlutterwaveWithdrawalCtrl = async (withdrawalData: withdrawalDataInterface) => {
    try {
        // get transaction current database record
        const payoutDetails = withdrawalData.payoutDetails;

        // get transaction current database record
        const transactionDetails = withdrawalData.transactionDetails;

        // Prepare Flutterwave request data based on currency
        let transferData = {};
        const xAmount = transactionDetails.withdrawal?.exchangeRate.destination.amount;
        const exchangeRate = Number(transactionDetails.withdrawal?.exchangeRate.rate || 0);
        const calAmount = transactionDetails.amount / exchangeRate;

        // console.log("exchangeRate: ", transactionDetails.withdrawal?.exchangeRate);
        // console.log("xAmount: ", xAmount);
        // console.log("calAmount: ", calAmount);

        // console.log(payoutDetails);
        

        switch (payoutDetails.currency.currency_code ) {
            case 'USD':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'USD',
                    beneficiary_name: payoutDetails.beneficiary_name,
                    account_number: payoutDetails.account_number,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            routing_number: payoutDetails.routing_number || '',
                            swift_code: payoutDetails.swift_code || '',
                            bank_name: payoutDetails.bank_name || '',
                            beneficiary_name: payoutDetails.beneficiary_name,
                            beneficiary_address: payoutDetails.beneficiary_address || '',
                            beneficiary_country: payoutDetails.beneficiary_country || '',
                            callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,
                        }
                    ]
                };
                break;
            case 'EUR':
                transferData = {
                    amount: xAmount || calAmount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'EUR',
                    beneficiary_name: payoutDetails.beneficiary_name,
                    account_number: payoutDetails.account_number,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            routing_number: payoutDetails.routing_number || '',
                            swift_code: payoutDetails.swift_code || '',
                            beneficiary_email: payoutDetails.beneficiary_email || '',
                            bank_name: payoutDetails.bank_name || '',
                            beneficiary_name: payoutDetails.beneficiary_name,
                            beneficiary_country: payoutDetails.beneficiary_country || '',
                            postal_code: payoutDetails.postal_code || '',
                            street_number: payoutDetails.street_number || '',
                            street_name: payoutDetails.street_name || '',
                            city: payoutDetails.city || ''
                        }
                    ]
                };
                break;

            case 'GBP':
                transferData = {
                    amount: xAmount || calAmount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'GBP',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            routing_number: payoutDetails.routing_number || '',
                            swift_code: payoutDetails.swift_code || '',
                            beneficiary_email: payoutDetails.beneficiary_email || '',
                            bank_name: payoutDetails.bank_name || '',
                            beneficiary_name: payoutDetails.beneficiary_name,
                            beneficiary_country: payoutDetails.beneficiary_country || '',
                            postal_code: payoutDetails.postal_code || '',
                            street_number: payoutDetails.street_number || '',
                            street_name: payoutDetails.street_name || '',
                            city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'XOF':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'XOF',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'XAF':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'XAF',
                    beneficiary_name: payoutDetails.beneficiary_name,
                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'GNF':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'GNF',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'RWF':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'RWF',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'TZS':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'TZS',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'UGX':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'UGX',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'GHS':
                transferData = {
                    amount: transactionDetails.amount,
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    currency: 'GHS',
                    beneficiary_name: payoutDetails.beneficiary_name,

                    reference: transactionDetails._id, // optional
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,

                    meta: [
                        {
                            account_number: payoutDetails.account_number,
                            beneficiary_name: payoutDetails.beneficiary_name,
                            bank_name: payoutDetails.bank_name || '',
                            destination_branch_code: payoutDetails.destination_branch_code || '',

                            // routing_number: payoutDetails.routing_number || '',
                            // swift_code: payoutDetails.swift_code || '',
                            // beneficiary_country: payoutDetails.beneficiary_country || '',
                            // postal_code: payoutDetails.postal_code || '',
                            // street_number: payoutDetails.street_number || '',
                            // street_name: payoutDetails.street_name || '',
                            // city: payoutDetails.city || ''
                        }
                    ]
                };
                break;
            case 'NGN':
                transferData = {
                    account_bank: payoutDetails.bank?.code || payoutDetails.bank_name,
                    account_number: payoutDetails.account_number,
                    // amount: transactionDetails.amount,
                    amount: xAmount || calAmount,
                    currency: 'NGN',
                    beneficiary_name: payoutDetails.beneficiary_name, // optional
                    reference: transactionDetails._id, // optional
                    narration: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    callback_url: `https://api.soundmuve.com/api/v1/transactions/flutterwave-webhook/${transactionDetails._id}`,
                };
                break;
            // Handle other currencies as needed
            default:
                return ({
                    status: false,
                    statusCode: 500,
                    result: {},
                    message: 'Unsupported currency.'
                });
        }

        // Log transfer data for debugging
        // console.log('Transfer Data being sent to Flutterwave:', JSON.stringify(transferData, null, 2));
        console.log('Transfer Data being sent to Flutterwave:', transferData);

        // Call Flutterwave API to initiate the payout using node-fetch
        const response = (await axios.post(FLUTTERWAVE_API_URL, 
            transferData,
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                    // Accept: 'application/json',
                }
            }
        )).data;
        // console.log('Flutterwave API Response:', JSON.stringify(response, null, 2)); // Debug log
        console.log('Flutterwave API Response:', response); // Debug log

        if (response.status == 'success') {
            // successful response
            return ({
                status: true,
                statusCode: 201,
                result: response,
                message: "Transaction approved and payout initiated."
            });

        } else {
            console.error('Failed to initiate payout:', response.message); // Debug log

            return ({
                status: false,
                statusCode: 500,
                result: response,
                message: "Failed to initiate payout."
            });
        }
        
    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;
        console.error('Flutterwave API Error:', err);

        return ({
            status: false,
            statusCode: 500,
            result: err,
            message: err.message || "Error communicating with payment gateway.",
            error: err
        });
    }
}

// handle accept PayPal withdrawal requests
const handlePaypalWithdrawalCtrl = async (withdrawalData: withdrawalDataInterface) => {
    try {
        // get transaction current database record
        const payoutDetails = withdrawalData.payoutDetails;

        // get transaction current database record
        const transactionDetails = withdrawalData.transactionDetails;

        // get user current database record
        const userDetails = withdrawalData.userDetails;

        // Get Access Token
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
        const paypalTokenUrl: any = process.env.PAYPAL_OAUTH_URL;
        const tokenResponse = (await axios.post(paypalTokenUrl, 
            'grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    // 'Content-Type': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )).data;
        // console.log('PayPal API Response:', JSON.stringify(tokenResponse, null, 2)); // Debug log
        console.log(tokenResponse);
        

        // Create Payout
        const payoutData = {
            sender_batch_header: {
                sender_batch_id: `batch_${Date.now()}`,
                email_subject: "You have a payout!",
                email_message: "You have received a payout! Thanks for using our service!"
            },
            items: [
                {
                    recipient_type: "EMAIL",
                    amount: {
                        value: transactionDetails.amount,
                        currency: payoutDetails.currency.currency_code
                    },
                    note: transactionDetails.withdrawal?.narration || transactionDetails.description,
                    sender_item_id: `item_${Date.now()}`,
                    receiver: userDetails.email
                }
            ]
        };

        const paypalPayoutUrl: any = process.env.PAYPAL_PAYOUTS_URL; 

        const payoutResponse = (await axios.post(paypalPayoutUrl, 
            payoutData,
            {
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    'Content-Type': 'application/json',
                }
            }
        )).data;

        // successful response
        return ({
            status: true,
            statusCode: 201,
            result: payoutResponse,
            message: "Payout successful."
        });
        
    } catch (error: any) {
        const err = error.response && error.response.data ? error.response.data : error;
        console.error('Error sending paypal payments:', err);

        return ({
            status: false,
            statusCode: 500,
            result: err,
            message: err.message || "Error communicating with payment gateway.",
            error: err
        });
    }
}


// handle rejected transactions and manually paid withdrawal requests
export const updateStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        const adminEmail = req.body.authMiddlewareParam.email;

        const session = await mongoose.startSession();
        session.startTransaction();
        
        const user_id = req.body.user_id;
        const transaction_id = req.body.transaction_id;
        const adminName = req.body.adminName;
        const actionType: "reject" | "manually paid" = req.body.actionType;

        // get transaction current database record
        const transactionDetails = await transactionModel.findById(transaction_id).lean();
        if (!transactionDetails) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get transaction record."
            });
        }

        // get user current database record
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


        let updatedUser;
        let updatedTransaction;
        if (actionType == "reject") {
            // Find and update the transaction record
            updatedTransaction = await transactionModel.findByIdAndUpdate(
                transactionDetails._id,
                {
                    $set: {
                        status: "Failed",
                        metaData: {
                            status: "Rejected",
                        },

                        updatedBy: {
                            user_id: admin_id,
                            user_email: adminEmail,
                            name: adminName
                        }
                    },
                },
                { new: true } // Return the updated document
            ).session(session);
    
            if (!updatedTransaction) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'Unable to update transaction status, please try again after some time.'
                });
            }



            // update the user record
            const newBalance = Number(userDetails.balance) + Number(transactionDetails.amount);
            // Find and update the user balance
            updatedUser = await userModel.findByIdAndUpdate(
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
            
        } else if (actionType == "manually paid") {
            // Find and update the transaction record
            updatedTransaction = await transactionModel.findByIdAndUpdate(
                transactionDetails._id,
                {
                    $set: {
                        status: "Complete", // "Success",

                        // metaData: {
                        //     status: "Success",
                        //     message: "Manually paid"
                        // },

                        updatedBy: {
                            user_id: admin_id,
                            user_email: adminEmail,
                            name: adminName
                        }
                    },
                },
                { new: true } // Return the updated document
            ).session(session);
    
            if (!updatedTransaction) {
                // Abort transaction in case of error
                await session.abortTransaction();
                session.endSession();
                
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'Unable to update transaction status, please try again after some time.'
                });
            }

        }


        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logActivity(req, `Updated transaction status - ${ transactionDetails._id }`, admin_id);
        
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                user: updatedUser || userDetails,
                transaction: updatedTransaction,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// handle  Flutterwave transfer Webhook
export const handleFlutterwaveWebhookCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transaction_id = req.params.transaction_id;

        console.log("flutterwave webhook");
        console.log(req.body);
        

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: {
            //     transaction: updatedTransaction,
            // },
            message: "successful"
        });


        // get transaction current database record
        const transactionDetails = await transactionModel.findById(transaction_id).lean();
        if (!transactionDetails) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get transaction record."
            });
        }

        // Find and update the transaction record
        const updatedTransaction = await transactionModel.findByIdAndUpdate(
            transaction_id,
            {
                $set: {
                    // status: transactionStatus,
                    metaData: {
                        data: req.body
                    },
                },
            },
            { new: true } // Return the updated document
        );

        if (!updatedTransaction) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update transaction status, please try again after some time.'
            });
        }


        // logActivity(req, `Updated transaction status - ${ transactionDetails._id }`, admin_id);
        
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: {
            //     transaction: updatedTransaction,
            // },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// verify PayPal Payment
export const verifyPayPalPaymentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;

        const transaction_id = req.body.transaction_id;
        const payout_batch_id = req.body.payout_batch_id;
        // const payout_item_id = req.body.payout_item_id;


        // get transaction current database record
        const transactionDetails = await transactionModel.findById(transaction_id).lean();
        if (!transactionDetails) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Unable to get transaction record."
            });
        }

        // Get Access Token
        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
        const paypalTokenUrl: any = process.env.PAYPAL_OAUTH_URL;
        const tokenResponse = (await axios.post(paypalTokenUrl, 
            'grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                    // 'Content-Type': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        )).data;
        // console.log('PayPal API Response:', JSON.stringify(tokenResponse, null, 2)); // Debug log
        // console.log(tokenResponse);


        const paypalPayoutUrl: any = process.env.PAYPAL_BASE_URL; 

        const payoutResponse = (await axios.get(`${paypalPayoutUrl}/payments/payouts/${payout_batch_id}`, 
            {
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                    'Content-Type': 'application/json',
                }
            }
        )).data;

        
        const batch_header_status = payoutResponse.batch_header.batch_status == "SUCCESS" ? true : false;
        const items_status =  payoutResponse.items.length && payoutResponse.items[0].transaction_status == "SUCCESS" ? true : false;

        const transactionStatus = batch_header_status && items_status ? "Success" : "Processing";

        // Find and update the transaction record
        const updatedTransaction = await transactionModel.findByIdAndUpdate(
            transaction_id,
            {
                $set: {
                    status: transactionStatus,
                    metaData: {
                        data: payoutResponse
                    },
                },
            },
            { new: true } // Return the updated document
        );

        if (!updatedTransaction) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update transaction status, please try again after some time.'
            });
        }


        logActivity(req, `Verified Paypal transaction status - ${ transaction_id }`, admin_id);
        
        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                transaction: updatedTransaction,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
