import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";

import { payoutDetailsModel } from "@/models/payoutDetails.model.js";
import { currencies } from "@/util/currencies.js";
import axios from "axios";
import { cloudinaryImageUpload } from "@/util/cloudFileStorage.js";
import fs from "fs";
import { recordLabelArtistModel } from "@/models/recordLabelArtist.model.js";
import { releaseModel } from "@/models/release.model.js";


export const addArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const artistName = req.body.artistName;
        const artistEmail = req.body.artistEmail;
        const artistPhoneNumber = req.body.artistPhoneNumber;
        const country = req.body.country;
        const gender = req.body.gender;
        let artistAvatar = '';

        if (
            !artistName || !artistEmail || !artistPhoneNumber 
            || !country || !gender
        ) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "all fields are required"
            });
        }

        const files: any = req.files;
        if (files.artistAvatar) {
            const artistAvatarPath = files.artistAvatar[0].path;
            // console.log(artistAvatarPath);
            artistAvatar = await cloudinaryImageUpload(artistAvatarPath);

            // Optionally delete the local files after uploading to Cloudinary
            fs.unlinkSync(artistAvatarPath);
        }

        const data2db = {
            user_id,
            user_email,

            artistName,
            artistEmail,
            artistPhoneNumber,
            country,
            gender,
            artistAvatar,
        }

        const newRecordLabelArtist = new recordLabelArtistModel(data2db);
        const newRecordLabelArtistResponds = await newRecordLabelArtist.save();

        if (!newRecordLabelArtistResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to save artist details"
            });
        }
        

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newRecordLabelArtistResponds,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;

        const artist_id = req.query.artist_id;

             
        const recordLabelArtistDetails = await recordLabelArtistModel.findById(artist_id);
        if (!recordLabelArtistDetails) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "record label artist details not found"
            });
        }


        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: recordLabelArtistDetails,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getTotalRelease_ArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // // Pagination parameters from query
        // const page = parseInt(req.query.page as string) || 1; // Default page is 1
        // const limit = parseInt(req.query.limit as string) || 20; // Default limit is 10
        // const skip = (page - 1) * limit;

        // Fetch the total number of artists for the given user_id for pagination metadata
        const totalArtists = await recordLabelArtistModel.countDocuments({ user_id: _id });
        const totalReleases = await releaseModel.countDocuments({ user_id: _id });


        // Return paginated results with metadata
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                totalArtists, totalReleases
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


export const getAllArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // // Pagination parameters from query
        // const page = parseInt(req.query.page as string) || 1; // Default page is 1
        // const limit = parseInt(req.query.limit as string) || 20; // Default limit is 10
        // const skip = (page - 1) * limit;

        // Fetch the total number of artists for pagination metadata
        // const totalArtists = await recordLabelArtistModel.countDocuments({ user_id: _id });

        // const artistsWithReleases = await recordLabelArtistModel.aggregate([
        //     {
        //         $match: { user_id: _id } // Filter by user_id
        //     },        
        //     {
        //         $lookup: {
        //             // Collection name of releases (should match in MongoDB)
        //             from: 'releases', // Collection name of releases
        //             localField: '_id',
        //             foreignField: 'recordLabelArtist_id',
        //             as: 'releases'
        //         }
        //     },
        //     {
        //         $addFields: {
        //             totalReleases: { $size: '$releases' }
        //         }
        //     },
        //     {
        //         $project: {
        //             artistName: 1,
        //             artistEmail: 1,
        //             artistPhoneNumber: 1,
        //             country: 1,
        //             gender: 1,
        //             artistAvatar: 1,
        //             totalReleases: 1
        //         }
        //     },
        //     { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
        //     // { $skip: skip }, // Skip to the current page
        //     // { $limit: limit } // Limit the number of results
        // ]);
        

        const allArtist = await recordLabelArtistModel.find({ user_id: _id })
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .exec();

        if (!allArtist) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "record label artist details not found"
            });
        };

        // Iterate over each artist and count the number of songs they have released
        const artistsWithReleases = await Promise.all(
            allArtist.map(async (artist) => {
                const songCount = await releaseModel.countDocuments({ recordLabelArtist_id: artist.id });
                
                return {
                    _id: artist._id,
                    user_id: artist.user_id,
                    user_email: artist.user_email,
                    artistName: artist.artistName,
                    artistEmail: artist.artistEmail,
                    artistPhoneNumber: artist.artistPhoneNumber,
                    country: artist.country,
                    gender: artist.gender,
                    artistAvatar: artist.artistAvatar,
                    createdAt: artist.createdAt,
                    updatedAt: artist.updatedAt,

                    totalReleases: songCount
                };
            })
        );


        // Fetch the total number of artists for the given user_id for pagination metadata
        // const totalArtists = await recordLabelArtistModel.countDocuments({ user_id: _id });
        // const totalReleases = await releaseModel.countDocuments({ user_id: _id });


        if (!artistsWithReleases) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "record label artist details not found"
            });
        };


        // Return paginated results with metadata
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: artistsWithReleases,
            // {
            //     artists: artistsWithReleases,

            //     totalPages: Math.ceil(totalArtists / limit), // Calculate total pages
            //     currentPage: page,
            //     totalRecords: totalArtists,
            // },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// Not very useful for now.
export const getPaginatedArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // Pagination parameters from query
        const page = parseInt(req.query.page as string) || 1; // Default page is 1
        const limit = parseInt(req.query.limit as string) || 20; // Default limit is 10
        const skip = (page - 1) * limit;

        // Fetch the total number of artists for pagination metadata
        const totalArtists = await recordLabelArtistModel.countDocuments();

        const artistsWithReleases = await recordLabelArtistModel.aggregate([
            {
                $match: { user_id: _id } // Filter by user_id
            },        
            {
                $lookup: {
                    // Collection name of releases (should match in MongoDB)
                    from: 'releases', // Collection name of releases
                    localField: '_id',
                    foreignField: 'recordLabelArtist_id',
                    as: 'releases'
                }
            },
            {
                $addFields: {
                    totalReleases: { $size: '$releases' }
                }
            },
            {
                $project: {
                    artistName: 1,
                    artistEmail: 1,
                    artistPhoneNumber: 1,
                    country: 1,
                    gender: 1,
                    artistAvatar: 1,
                    totalReleases: 1
                }
            },
            { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
            { $skip: skip }, // Skip to the current page
            { $limit: limit } // Limit the number of results
        ]);

        if (!artistsWithReleases) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "record label artist details not found"
            });
        };


        // Return paginated results with metadata
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                artists: artistsWithReleases,

                totalPages: Math.ceil(totalArtists / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalArtists,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const searchArtistCtrl = async (req: Request, res: Response, next: NextFunction) => {
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
            // result: newPayoutDetailsResponds,
            message: "Successful!"
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
