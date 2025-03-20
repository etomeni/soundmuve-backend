import mongoose, { Schema } from 'mongoose';
import { userTokenInterface } from '@/typeInterfaces/users.interface.js';


const userTokenSchema = new Schema<userTokenInterface>(
    {
        user_role: { 
            type: String, 
            required: true,
        },
        user_email: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 30 * 86400 // 30 days
        }
    },
    { timestamps: true }
);

export const userTokenModel = mongoose.model("UserToken", userTokenSchema);
