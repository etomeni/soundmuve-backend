import { Request, Response, NextFunction } from "express-serve-static-core";

// models
import { userModel } from '../../models/users.model.js';
import { activityLogModel } from "@/models/activityLog.model.js";
import { logActivity } from "@/util/activityLogFn.js";

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