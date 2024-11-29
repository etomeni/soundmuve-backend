import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { contactUsInterface } from '@/typeInterfaces/contact.interface.js';


const contactReplySchema = {
    user_id: { type: String, required: true },
    user_email: { type: String, required: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now() },
};


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
        },

        reply: {
            type: [contactReplySchema],
            required: false,
            default: []
        },
        status: {
            type: String,
            enum: ["Pending", "Seen", "Replied"],
            required: false,
            default: "Pending"
        },
    },
    { timestamps: true }
);
export const contactUsModel = mongoose.model("Contact", contactUsSchema);
