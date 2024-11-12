import fs from "fs";
import axios from "axios";
import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { releaseModel } from "@/models/release.model.js";
import { cloudinaryAudioUpload } from "@/util/cloudFileStorage.js";
import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";


// Get releases
export const getAllReleaseCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const releaseType = req.query.releaseType || '';

        let singleRelases;
        let totalSingle;

        if (releaseType) {
            // Find only the releases where releaseType is "album"
            singleRelases = await releaseModel.find({ releaseType })
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalSingle = await releaseModel.countDocuments({ releaseType });
            
        } else {
            // Find only the releases where releaseType is "album"
            singleRelases = await releaseModel.find()
                .sort({ createdAt: -1 })  // Sort by createdAt in descending order
                .limit(limit) // Set the number of items per page
                .skip((page - 1) * limit) // Skip items to create pages
                .exec();
            
            // Count total single for the user to support pagination
            totalSingle = await releaseModel.countDocuments();
        }


        if (!singleRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve single releases"
            });
        };


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: singleRelases,

                totalPages: Math.ceil(totalSingle / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalSingle,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get release by id
export const getReleaseByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const release_id = req.query.id || '';

        const release = await releaseModel.findById(release_id)
        if (!release) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve release"
            });
        };

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: release,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// search releases
export const searchReleasesCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
        const singleRelases = await releaseModel.find({ title: { $regex: `^${req.query.search}`, $options: 'i' } })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!singleRelases) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve single releases"
            });
        };


        // Count total single for the user to support pagination
        const totalSingle = await releaseModel.countDocuments({ title: { $regex: `^${req.query.search}`, $options: 'i' } });

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                relases: singleRelases,

                totalPages: Math.ceil(totalSingle / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalSingle,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// update release status 
export const updateReleaseStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const release_id = req.body.release_id || '';
        const status = req.body.status || '';
        const linkTreeUrl = req.body.linkTreeUrl || '';

        // Find the release and update the specific song
        const updatedRelease = await releaseModel.findOneAndUpdate(
            { _id: release_id },
            { 
                $set: { 
                    status: status,
                    liveUrl: linkTreeUrl
                } // $ references the matched song
            },
            { new: true, runValidators: true }
        );

        if (!updatedRelease) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to resolve release"
            });
        };

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedRelease,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}