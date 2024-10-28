import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';

const couponDiscountSchema = new Schema(
    {
        cartItems: {
            type: Array, // mongoose.Schema.Types.Mixed,
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
        status: {
            type: String, 
        }
    },
    { timestamps: true }
);
export const couponDiscountModel = mongoose.model("CouponDiscount", couponDiscountSchema);