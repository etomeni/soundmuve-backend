import { Request, Response, NextFunction } from "express-serve-static-core";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { promotionModel } from "@/models/promotions.model.js";

import { logActivity } from "@/util/activityLogFn.js";
import { promotionInterface } from "@/typeInterfaces/promotions.interface.js";
import { cloudinaryImageUpload, deleteImageFileFromCloudinary } from "@/util/cloudFileStorage.js";


// Get All promotions
export const getPromotionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const promotions = await promotionModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!promotions) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get promotional banners"
            });
        };

        // Count total record to support pagination
        const totalRecord = await promotionModel.countDocuments();

        logActivity(req, "Gets All Promotional Banner", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: promotions,
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

// Get active promotions
export const getActivePromotionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        // const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        // const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const promotions = await promotionModel.find({status: true})
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            // .limit(limit) // Set the number of items per page
            // .skip((page - 1) * limit) // Skip items to create pages
            // .exec();
        
        if (!promotions) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get promotional banners"
            });
        };

        // Count total record to support pagination
        // const totalRecord = await promotionModel.countDocuments({status: true});

        logActivity(req, "Gets Active Promotional Banner", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: promotions,
            // result: {
            //     data: promotions,
            //     totalPages: Math.ceil(totalRecord / limit), // Calculate total pages
            //     currentPage: page,
            //     totalRecords: totalRecord,
            // },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// upload a new promotional banner Ctrl
export const uploadPromotionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const promotionalImage = await cloudinaryImageUpload(req.body.image, "images/promotions");

        if (!promotionalImage) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Image upload failed.'
            });
        }

        const promotiondata: promotionInterface = {
            title: req.body.title,
            image: promotionalImage,
            userType: req.body.userType,
            status: true,
            createdBy: {
                user_id: _id,
                user_email: user_email,
                name: req.body.user_name
            }
        };

        const newPromotion = new promotionModel(promotiondata);
        const result = await newPromotion.save();
        if (!result) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error, try again after some time.'
            });
        }

        logActivity(req, `Uploaded a new promotional banner`, _id);

        // Response 
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: result,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// update promotional banner Ctrl
export const updatePromotionsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;

        const promotional_id = req.body.promotional_id;
        const action: "status" | "delete" = req.body.action;
        const actionValue: boolean = req.body.actionValue;

        const promotion = await promotionModel.findById(promotional_id);
        if (!promotion) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Promotion not found"
            });
        }

        if (action == "status") {
            // update the release status
            const updatedPromotion = await promotion.updateOne(
                { 
                    status: actionValue,
                }, 
                { new: true, runValidators: true } // Return the updated document & validate before saving
            );

            if (!updatedPromotion) {
                return res.status(400).json({
                    status: false,
                    statusCode: 400,
                    message: "Failed to update promotion."
                });
            }

            logActivity(req, `Updated a promotional banner status`, _id);

            // Response 
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: null,
                message: "successful"
            });

        } else if (action == "delete") {
            // Delete associated file from Cloudinary
            const deleteResult = await deleteImageFileFromCloudinary(promotion.image);
            if (!deleteResult) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "Failed to delete promotion."
                });
            }

            const deletedPromotion = await promotion.deleteOne();
            if (!deletedPromotion) {
                // Response 
                return res.status(400).json({
                    status: false,
                    statusCode: 400,
                    message: "Failed to delete promotion."
                });
            }

            logActivity(req, `Deleted a promotional banner`, _id);

            // Response 
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: null,
                message: "successful"
            });
        }

        logActivity(req, `Admin - update promotional banner`, _id);

        // Response 
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: null,
            message: "successful"
        });

    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
