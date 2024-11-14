import mongoose, { Schema } from 'mongoose';
import { couponInterface } from '@/typeInterfaces/cart.interface.js';
// import validator from 'validator';


// cart item Interface Schema
const cartItemSchema = {
    _id: { type: String, required: true },
    release_id: { type: String, required: true },
    user_email: { type: String, required: true },
    user_id: { type: String, required: true },
    artistName: { type: String, required: true },
    coverArt: { type: String, required: true },
    price: { type: Number, required: true },
    releaseType: { type: String, required: true },
    title: { type: String, required: true },
};


const couponDiscountSchema = new Schema<couponInterface>(
    {
        cartItems: {
            type: [cartItemSchema], // mongoose.Schema.Types.Mixed,
            required: true,
        },
        user_email: {
            type: String,
            required: true,
        },
        user_name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        youtubeLink: {
            type: String,
            required: true,
            // max: 255,
        },
        instagramFacebookLink: {
            type: String,
            required: true,
        },
        xLink: {
            type: String,
            required: true,
        },
        code: { 
            type: String, 
            // required: true, 
            unique: true 
        }, // Promo code string
        discount: { 
            type: Number, 
            // required: true, 
            min: 0, max: 100 
        }, // Discount percentage
        discountedAmount: { 
            type: Number, 
            // required: true, 
        },
        payableAmount: { 
            type: Number, 
            // required: true, 
        },
        usedDate: { 
            type: String, 
            // required: true, 
        },
        status: {
            type: String, 
        }
    },
    { timestamps: true }
);
export const couponDiscountModel = mongoose.model("CouponDiscount", couponDiscountSchema);