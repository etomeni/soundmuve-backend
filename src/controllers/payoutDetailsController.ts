import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { sendUserContactMailAutoResponse } from "@/util/mail.js";
import { payoutDetailsModel } from "@/models/payoutDetails.model.js";
import { payoutDetailsInterface } from "@/typeInterfaces/payout.interface.js";
import { currencies } from "@/util/currencies.js";
import axios from "axios";
import { logActivity } from "@/util/activityLogFn.js";


export const setupPayoutDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const data2db = {
            user_email: req.body.authMiddlewareParam.email,
            user_id: req.body.authMiddlewareParam._id,
            paymentMethod: req.body.paymentMethod,
            currency: req.body.currency,
            
            ...req.body
        }

        const newPayoutDetails = new payoutDetailsModel(data2db);
        const newPayoutDetailsResponds = await newPayoutDetails.save();

        if (!newPayoutDetailsResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to save payout details."
            });
        }

        // TODO:::: send mail to the user notifying him/her that a new payment
        // payout details has been added to their account, display the details of the
        // new payment details info.

        logActivity(req, `Setup payout details`, _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newPayoutDetailsResponds,
            message: "Successful! payout details saved"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const editPayoutDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const data2db = {
            user_email: req.body.authMiddlewareParam.email,
            user_id: req.body.authMiddlewareParam._id,
            paymentMethod: req.body.paymentMethod,
            currency: req.body.currency,
            
            ...req.body
        }

        const payoutDetails = await payoutDetailsModel.findByIdAndUpdate(
            req.body.payout_id, data2db, 
            { new: true }
        );

        if (!payoutDetails) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Payout details not found"
            });
        }

        // TODO:::: send mail to the user notifying him/her that a new payment
        // payout details has been added to their account, display the details of the
        // new payment details info.

        logActivity(req, `Edited payout details`, _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: payoutDetails,
            message: "Successful! payout details saved"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getAllPayoutDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // Find payout details for the given user
        const payoutDetails = await payoutDetailsModel.find({ user_id: _id }).exec()
        if (!payoutDetails) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get payout details."
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: payoutDetails,
            message: "Successful! payout details saved"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Delete payout details by ID
export const deletePayoutDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const payoutDetails = await payoutDetailsModel.findByIdAndDelete(req.params.payout_id || '');
        if (!payoutDetails) {
          return res.status(404).json({
              status: false,
              statusCode: 404,
              message: "Payout details not found"
          });
        }
    
        // TODO:::: send mail to the user notifying him/her that a new payment
        // payout details has been added to their account, display the details of the
        // new payment details info.

        logActivity(req, `Deleted payout details`, _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: payoutDetails,
            message: "Successful! payout details removed"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// get all supported currencies
export const getCurrenciesCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: currencies,
            message: "Successful! payout details removed"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// get list of banks by country code
export const getBanksListByCountryCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const country = req.params.country || "NG";

        const response = (await axios.get(`https://api.flutterwave.com/v3/banks/${country}`, {
            headers: {
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        })).data;

        if (!response.data.length) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                result: [],
                message: "something went wrong"
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: response.data,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// get list of banks by country code
export const getNgBanksAccountNameCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const account_number = req.body.account_number;
        const account_bank = req.body.account_bank;

        const response = (await axios.post(`https://api.flutterwave.com/v3/accounts/resolve`, 
            { account_number, account_bank }, 
            {
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )).data;

        // console.log(response);

        if (!response) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                // result: [],
                message: "something went wrong"
            });
        }
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: response,
            message: "Successful!"
        });
    } catch (error: any) {
        console.log(error.response.data);
        
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
