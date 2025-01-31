import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { couponDiscountModel } from "@/models/couponDiscount.model.js";
import { sendCouponApprovalNotificationMail, sendCouponRejectionNotificationMail } from "@/util/mail.js";
import { logActivity } from "@/util/activityLogFn.js";

// Function to generate a random coupon code
function generateCouponCode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let couponCode = '';
    for (let i = 0; i < length; i++) {
        couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return couponCode;
}

// Get coupon applications
export const getAllCouponCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find only the releases where releaseType is "album"
        const coupons = await couponDiscountModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!coupons) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve coupon applications"
            });
        };


        // Count total coupon applications to support pagination
        const totalCoupon = await couponDiscountModel.countDocuments();

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                coupons,

                totalPages: Math.ceil(totalCoupon / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalCoupon,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get coupon discount by id
export const getCouponByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const coupon_id = req.query.coupon_id || '';

        const couponApplication = await couponDiscountModel.findById(coupon_id);
        if (!couponApplication) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find coupon."
            });
        };

        logActivity(req, `Admin - Viewed coupon discount application`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: couponApplication,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Approve coupon discount application
export const approveCouponDiscountCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const coupon_id = req.body.coupon_id;
        const discountPercentage = req.body.discountPercentage;

        const couponApplication = await couponDiscountModel.findById(coupon_id);
        if (!couponApplication) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find coupon."
            });
        };

        const totalAmount = couponApplication.cartItems.reduce((accumulator, currentObject) => {
            return accumulator + currentObject.price;
        }, 0);
      
        const discounted_Amount = (totalAmount * discountPercentage) / 100;
        const balanceAmount = totalAmount - discounted_Amount;

        const couponCode = generateCouponCode();

        // Find the coupon and update
        const updatedCoupon = await couponDiscountModel.findByIdAndUpdate(
            coupon_id,
            { 
                $set: { 
                    status: "Approved",
                    code: couponCode,
                    discount: discountPercentage,
                    discountedAmount: discounted_Amount,
                    payableAmount: balanceAmount
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not update coupon releases."
            });
        };


        sendCouponApprovalNotificationMail(
            couponApplication.user_email, couponApplication.user_name || "",
            updatedCoupon.code || couponCode, updatedCoupon.discount || discountPercentage, 
            updatedCoupon.discountedAmount?.toString() || discounted_Amount.toString(),
            updatedCoupon.payableAmount?.toString() || balanceAmount.toString(), 
            "https://soundmuve.com/account"
        );

        logActivity(req, `Admin - Approve coupon discount application`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedCoupon,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Reject coupon discount application
export const rejectCouponDiscountCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const coupon_id = req.body.coupon_id;

        // Find the coupon and update the status
        const updatedCoupon = await couponDiscountModel.findByIdAndUpdate(
            coupon_id,
            { 
                $set: { 
                    status: "Rejected",
                    code: "",
                    discount: 0,
                    discountedAmount: 0,
                    // payableAmount: 0
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not update coupon data."
            });
        };

        sendCouponRejectionNotificationMail(
            updatedCoupon.user_email, updatedCoupon.user_name || ""
        );

        logActivity(req, `Admin - Reject coupon discount application`, _id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedCoupon,
            message: "Application for a coupon discount was successfully rejected."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}