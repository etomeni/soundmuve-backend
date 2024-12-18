import { Request, Response, NextFunction } from "express-serve-static-core";

import { promotionModel } from "@/models/promotions.model.js";

import { logActivity } from "@/util/activityLogFn.js";



// Get active promotional ads
export const getActivePromotionsAdsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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


        logActivity(req, "Gets Active Promotional Banner", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: promotions,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}