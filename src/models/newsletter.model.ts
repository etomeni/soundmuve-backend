import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { newsLetterInterface } from '@/typeInterfaces/contact.interface.js';


const newsLetterSchema = new Schema<newsLetterInterface>(
    {
        title: { type: String, required: true },
        message: { type: String, required: true },
        sentBy: {
            user_id: { type: String, required: true },
            user_email: { type: String, required: true },
            name: { type: String, required: true }
        },
        failedRecipients: [String],
        recipients: [String]
    }, 
    { timestamps: true }
);
export const newsLetterModel = mongoose.model("NewsLetter", newsLetterSchema);


const newsLetterSubscriberSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            max: 255,
        }
    }, 
    { timestamps: true }
);
export const newsLetterSubscriberModel = mongoose.model("NewsLetterSubscriber", newsLetterSubscriberSchema);
