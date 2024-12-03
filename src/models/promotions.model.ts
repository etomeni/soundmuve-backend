import { promotionInterface } from '@/typeInterfaces/promotions.interface.js';
import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';


const promotionSchema = new Schema<promotionInterface>(
    {
        title: { type: String, required: false },
        image: { type: String, required: true },
        userType: { type: String, enum: ['All', 'artist', 'record label'],  required: true },
        status: { type: Boolean, required: true, default: true },
        createdBy: {
            user_id: { type: String, required: true },
            user_email: { type: String, required: true },
            name: { type: String, required: true }
        }
    }, 
    { timestamps: true }
);
export const promotionModel = mongoose.model("Promotion", promotionSchema);
