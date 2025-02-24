import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";

import { promotionModel } from "@/models/promotions.model.js";

import { logActivity } from "@/util/activityLogFn.js";
import { userModel } from "@/models/users.model.js";
import { cloudinaryImageUpload, deleteFileFromCloudinary } from "@/util/cloudFileStorage.js";
import fs from "fs";
import { sendEmailVerificationCode } from "@/util/mail.js";
import { verifyEmailToken } from "@/util/resources.js";
import { cartModel } from "@/models/cart.model.js";
import { analyticsModel } from "@/models/analytics.model.js";
import { transactionModel } from "@/models/transaction.model.js";
import { releaseModel } from "@/models/release.model.js";


// interface userUpdateCodeInterface {
//     email: string,
//     code: string
// }
// let updateCode: userUpdateCodeInterface[] = [];

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

// edit artist profile
export const editArtistProfileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_id = req.params.user_id || "";

        if (!user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "user _id is required."
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            user_id, 
            { 
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber,
                country: req.body.country,
                gender: req.body.gender,
                artistName: req.body.artistName,
            },
            {
                new: true,
                runValidators: true,
                // returnOriginal: false,
            }
        );

        if (!updatedUser) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update profile.',
            });
        }

        logActivity(req, "Updated Profile", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedUser,
            message: "Profile updated successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// edit record label profile
export const editRlProfileCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_id = req.params.user_id || "";

        if (!user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "user _id is required."
            });
        }

        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const phoneNumber = req.body.phoneNumber;
        const country = req.body.country;
        const recordLabelName = req.body.recordLabelName;
        // const recordLabelLogo = req.body.recordLabelLogo;

        // if (
        //     !firstName || !lastName || !phoneNumber || !country ||
        //     !recordLabelName // || !recordLabelLogo
        // ) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: "all fields are required."
        //     });
        // }


        let recordLabelLogoImgUrl = '';

        const files: any = req.files;
        if (files.recordLabelLogo) {
            const recordLabelLogoPath = files.recordLabelLogo[0].path;
            // console.log(recordLabelLogoPath);
            recordLabelLogoImgUrl = await cloudinaryImageUpload(recordLabelLogoPath);

            // Optionally delete the local files after uploading to Cloudinary
            fs.unlinkSync(recordLabelLogoPath);
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            user_id, 
            {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phoneNumber,
                country: country,
                recordLabelName: recordLabelName,
                ...(recordLabelLogoImgUrl && {recordLabelLogo: recordLabelLogoImgUrl}),
            },
            {
                new: true,
                runValidators: true,
                // returnOriginal: false,
            }
        );

        if (!updatedUser) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update profile.',
            });
        }

        logActivity(req, "Updated Profile", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedUser,
            message: "Profile updated successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// verify and send email update code to new email address
export const sendEmailUpdateOtpCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_id = req.params.user_id || "";

        if (!user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "user _id is required."
            });
        }

        const currentUser = await userModel.findById(user_id).lean();
        if (!currentUser) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: 'current user id does not exist.',
            });
        }

        const email = req.body.email;
        const sentPassword = req.body.password;

        // check if password is correct
        const isPassEqual = await bcryptjs.compare(sentPassword, currentUser.password);
        if (!isPassEqual) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect password!"
            });
        }

        // check if the new email is already in use
        const newEmailUser = await userModel.findOne({email}).lean();
        if (newEmailUser) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'Email address already exist.',
            });
        }


        const mailResponse = sendEmailVerificationCode(
            email,
            `${currentUser.firstName} ${currentUser.lastName}`,
            "Email Update Request"
        );

        if (!mailResponse.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailResponse.message,
                error: mailResponse.error
            });
        }

        // setUpdateCode({
        //     code: mailResponse.code || '',
        //     email: email,
        // });


        logActivity(req, "Requested opt to update email", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                token: mailResponse.jwt_token,
                code: mailResponse.code,
            },
            message: 'Email update code has been sent to your new email address, kindly check your mail inbox or spam folder for verification code.',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// resend email update code to new email address
export const resendEmailUpdateOtpCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_id = req.params.user_id || "";

        if (!user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "user _id is required."
            });
        }

        const currentUser = await userModel.findById(user_id).lean();
        if (!currentUser) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: 'current user id does not exist.',
            });
        }

        const email = req.body.email;

        // check if the new email is already in use
        const newEmailUser = await userModel.findOne({email}).lean();
        if (newEmailUser) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'Email address already exist.',
            });
        }


        const mailResponse = sendEmailVerificationCode(
            email,
            `${currentUser.firstName} ${currentUser.lastName}`,
            "Email Update Request"
        );

        if (!mailResponse.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailResponse.message,
                error: mailResponse.error
            });
        }

        // setUpdateCode({
        //     code: mailResponse.code || '',
        //     email: email,
        // });

        logActivity(req, "Requested opt to update email", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                token: mailResponse.jwt_token,
                code: mailResponse.code,
            },
            message: 'Email update code has been sent to your new email address, kindly check your mail inbox or spam folder for verification code.',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// verify email update code
export const verifyEmailUpdateCodeCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_id = req.params.user_id || "";

        if (!user_id) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "user _id is required."
            });
        }

        const code = req.body.code;
        const newEmail = req.body.email;
        const token = req.body.token;
        
        const verifyRes =  verifyEmailToken(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong verification code!',
            });
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            user_id, 
            { email: newEmail },
            {
                new: true,
                runValidators: true,
                // returnOriginal: false,
            }
        );

        if (!updatedUser) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'unable to update email address.',
            });
        }


        logActivity(req, "Updated email address", _id);

        // Response
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedUser,
            message: "Email address updated successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}

// delete data from db
export const deleteCodeCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const _id = req.body.authMiddlewareParam._id;
        // const user_id = req.params.user_id || "";
        // console.log("hello");
        

        // Delete all documents in the Cart collection
        // const result = await cartModel.deleteMany({});
        // const result = await cartModel.find().lean();
        // console.log(result);
        
        // let deletedResult: any = [];
        // if (result) {
        //     result.forEach(async (item) => {
        //         const result = await cartModel.findByIdAndDelete(item._id);
        //         deletedResult.push(result);
        //     })
        // }

        // const result = await analyticsModel.deleteMany({});

        // Delete all documents where transactionType is "Credit"
        // const result = await transactionModel.deleteMany({ transactionType: 'Credit' });

        // Update all documents in the User collection, setting balance to 0
        // const result = await userModel.updateMany({}, { balance: 0 });



        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: result,
            message: "successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}


// delete multiple data from db
export const deleteReleasesAndFilesCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(404).json({ 
            status: false,
            statusCode: 404,    
            message: 'Deleting release records is not active at the moment' 
        });
        
        const excludedIds = ['67996a836cee2829c7c4b04c', '67b852af1577835f685a1445']; // IDs to exclude from deletion
        // Delete all documents except those with the specified IDs
        // const result = await releaseModel.deleteMany({ _id: { $nin: excludedIds } });

        const records = await releaseModel.find({ _id: { $nin: excludedIds } });
        if (!records) {
            return res.status(404).json({ 
                status: false,
                statusCode: 404,    
                message: 'No records found to delete.' 
            });
        }

        const deletionResults = [];

        // Loop through each record and delete associated Cloudinary files
        for (const record of records) {
            const filesToDelete = [];
        
            // Add coverArt file to the list
            if (record.coverArt) {
                filesToDelete.push(record.coverArt);
            }
        
            // Add songAudio files to the list
            if (record.songs && record.songs.length > 0) {
                record.songs.forEach((song) => {
                    if (song.songAudio) {
                        filesToDelete.push(song.songAudio);
                    }
                });
            }
    
            // Delete all associated files from Cloudinary
            const cloudinaryDeletionResults = await Promise.all(
                filesToDelete.map((url) => deleteFileFromCloudinary(url))
            );
            console.log(cloudinaryDeletionResults);
            
        
            // Check if all Cloudinary files were deleted successfully
            const allFilesDeleted = cloudinaryDeletionResults.every((result) => result);
        
            if (allFilesDeleted) {
                // Proceed to delete the database record
                await releaseModel.deleteOne({ _id: record._id });
                    deletionResults.push({
                    recordId: record._id,
                    status: 'success',
                    message: 'Record and associated files deleted successfully.',
                });
            } else {
                deletionResults.push({
                    recordId: record._id,
                    status: 'failed',
                    message: 'Failed to delete one or more associated files from Cloudinary.',
                });
            }
        }
        console.log("deletionResults");
        console.log(deletionResults);
        
        // Check if all records were deleted successfully
        const allRecordsDeleted = deletionResults.every((result) => result.status === 'success');
    

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                allRecordsDeleted,
                deletionResults
            },
            message: "successfully."
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}




// function setUpdateCode(updateData: userUpdateCodeInterface) {
//     // Check if an item with the same email already exists
//     const index = updateCode.findIndex(item => item.email === updateData.email);

//     if (index !== -1) {
//         // If it exists, replace it with the new item
//         updateCode[index] = updateData;
//     } else {
//         // If it doesn't exist, add the new item to the array
//         updateCode.push(updateData);
//     }
// }

// function removeUpdateCode(email: string) {
//     // Find the index of the code with the specified email
//     const index = updateCode.findIndex(code => code.email === email);
  
//     // If the code is found, remove it from the array
//     if (index !== -1) updateCode.splice(index, 1);
// }

// function getUpdateCodeByEmail(email: string) {
//     // Find the code object with the specified email
//     const code = updateCode.find(code => code.email == email);
  
//     // Return the code object or null if not found
//     return code || null;
// }
