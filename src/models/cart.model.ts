import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { cartItemInterface } from '@/typeInterfaces/cart.interface.js';


const cartSchema = new Schema<cartItemInterface>(
    {
        release_id: {
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
        title: {
            type: String,
            required: true,
            max: 255,
        },
        artistName: {
            type: String,
            required: true,
        },
        coverArt: {
            type: String,
            // required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        releaseType: { 
            type: String, 
            enum: ['single', 'album'], 
            required: true 
        },

    },
    { timestamps: true }
);
export const cartModel = mongoose.model("Cart", cartSchema);