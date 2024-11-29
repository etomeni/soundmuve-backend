import { Request, Response, NextFunction } from "express-serve-static-core";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";
import { sendNewsletterMail } from "@/util/mail.js";
import { newsLetterModel, newsLetterSubscriberModel } from "@/models/newsletter.model.js";

import { logActivity } from "@/util/activityLogFn.js";
import { newsLetterInterface } from "@/typeInterfaces/contact.interface.js";
import { userModel } from "@/models/users.model.js";


// Get newsletter subscribers
export const getNewsletterSubscribersCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const subscribers = await newsLetterSubscriberModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!subscribers) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get newsletter subscribers"
            });
        };


        // Count total subscribers to support pagination
        const totalSubscribers = await newsLetterSubscriberModel.countDocuments();

        logActivity(req, "Gets Newsletter Subscribers", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: subscribers,
                totalPages: Math.ceil(totalSubscribers / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalSubscribers,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get sent newsletters
export const getSentNewslettersCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        const subscribers = await newsLetterModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();
        
        if (!subscribers) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get sent newsletters"
            });
        };


        // Count total sent newsletters to support pagination
        const totalDataCount = await newsLetterModel.countDocuments();

        logActivity(req, "Gets Sent Newsletters", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                data: subscribers,
                totalPages: Math.ceil(totalDataCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalDataCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get sent newsletters by id
export const getSentNewslettersByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;

        const newsletter_id = req.query.newsletter_id || '';

        const newsletter = await newsLetterModel.findById(newsletter_id);
        if (!newsletter) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Could not find sent newsletter."
            });
        };


        logActivity(req, `Read a Newsletter Message`, _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newsletter,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// send newsletter Ctrl
export const sendNewsletterCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const _id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;

        // Fetch all users and subscribers
        const users = await userModel.find({});
        const subscribers = await newsLetterSubscriberModel.find({});

        // Extract email addresses
        const userEmails = users.map((user) => user.email);
        const subscriberEmails = subscribers.map((subscriber) => subscriber.email);

        // Combine emails and remove duplicates
        const allEmails = [...new Set([...userEmails, ...subscriberEmails])];

        const newsLetter: newsLetterInterface = {
            title: req.body.title,
            message: req.body.message,
            recipients: allEmails,
            failedRecipients:[],
            sentBy: {
                user_id: _id,
                user_email: user_email,
                name: req.body.user_name
            }
        };

        // Send emails
        for (const email of allEmails) {
            const response = sendNewsletterMail(email, newsLetter.title, newsLetter.message);
            if (!response.status) {
                newsLetter.failedRecipients.push(email);
            }
        }


        const newNewsLetter = new newsLetterModel(newsLetter);
        const result = await newNewsLetter.save();
        if (!result) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error, try again after some time.'
            });
        }

        logActivity(req, `Sent out newsletter message`, _id);

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
