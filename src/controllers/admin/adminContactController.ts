import { Request, Response, NextFunction } from "express-serve-static-core";
import mongoose from "mongoose";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { sendUserAdminContactUsReplyMail } from "@/util/mail.js";
import { contactUsModel } from "@/models/contact.model.js";
import { logActivity } from "@/util/activityLogFn.js";
import { contactReplyInterface } from "@/typeInterfaces/contact.interface.js";

// Get contact messages
export const getContactMessagesCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find only the releases where releaseType is "album"
        const contacts = await contactUsModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!contacts) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get contact messages"
            });
        };


        // Count total coupon applications to support pagination
        const totalCoupon = await contactUsModel.countDocuments();

        logActivity(req, "Gets Contact Messages", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: contacts,
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

// Get contact message by id
export const getContactMessageByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const contact_id = req.query.contact_id || '';

        // const contactMessage = await contactUsModel.findById(contact_id);
        const contactMessage = await contactUsModel.findByIdAndUpdate(
            contact_id,
            { 
                // $set: { status: "" } 
                status: "Seen"
            }, 
            { new: true }
        );
        if (!contactMessage) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find contact message."
            });
        };


        logActivity(req, `Read a Contact Messages - ${contact_id}`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: contactMessage,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Reply contact messages
export const contactReplyCtrl = async (req: Request, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        const contact_id = req.body.contact_id;
        const replyMsg = req.body.replyMsg;
        const user_name = req.body.user_name;

        const reply: contactReplyInterface = {
            user_id: _id,
            user_email: user_email,
            name: user_name,
            message: replyMsg,
            date: new Date()
        }

        // Update the reply and status
        const updatedContact = await contactUsModel.findByIdAndUpdate(
            contact_id,
            {
                $push: { reply }, // Add the new reply to the array
                status: "Replied"
                // ...(status && { status }), // Update status if provided
            },
            { new: true } // Return the updated document
        ).session(session);

        if (!updatedContact) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find contact message."
            });
        };

        // send the user mail with the reply.
        const response = sendUserAdminContactUsReplyMail(updatedContact.email, updatedContact.name, replyMsg);

        if (!response.status) {
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to send reply."
            });
        }

        // Commit the transaction
        await session.commitTransaction();
        session.endSession();

        logActivity(req, `Replied a user contact message`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedContact,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;

        // Abort transaction in case of error
        await session.abortTransaction();
        session.endSession();

        next(error);
    }
}
