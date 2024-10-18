import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { contactUsInterface } from '@/typeInterfaces/contact.interface.js';


const contactUsSchema = new Schema<contactUsInterface>(
    {
        name: {
            type: String,
            required: true,
            max: 255,
        },
        email: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);
export const contactUsModel = mongoose.model("Contact", contactUsSchema);


const newsLetterSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            max: 255,
        }
    }, 
    { timestamps: true }
);
export const newsLetterModel = mongoose.model("NewsLetter", newsLetterSchema);
