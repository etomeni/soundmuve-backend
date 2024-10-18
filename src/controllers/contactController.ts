import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

import { contactUsModel, newsLetterModel } from "@/models/contact.model.js";
import { sendAdminUserContactUsNotification, sendUserContactMailAutoResponse } from "@/util/mail.js";


export const subscribeNewsletterCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const newSubscriber = new newsLetterModel({ email: req.body.email });
        const newSubscriberResponds = await newSubscriber.save();

        if (!newSubscriberResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "something went wrong."
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {},
            message: "Thanks for subscribing to our Newsletter."
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const contactUsCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const name = req.body.name;
        const email = req.body.email;
        const message = req.body.message;

        const newContactMsg = new contactUsModel({ name, email, message });
        const newContactMsgResponds = await newContactMsg.save();

        if (!newContactMsgResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "something went wrong."
            });
        }

        sendUserContactMailAutoResponse(email, name, message);
        // sendAdminUserContactUsNotification(email, name, message);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {},
            message: "Thank You for Contacting Us - We've Received Your Message!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
