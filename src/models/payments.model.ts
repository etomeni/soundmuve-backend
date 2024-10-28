import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';

const PaymentSchema = new Schema(
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
        paidAmount: {
            type: String,
            required: true,
            // max: 255,
        },
        paymentIntent: {
            type: String,
            // required: true,
        },
        paymentIntentClientSecret: {
            type: String,
            // required: true,
        },
        paymentStatus: {
            type: String,
            // required: true,
        }
    },
    { timestamps: true }
);
export const PaymentModel = mongoose.model("Payment", PaymentSchema);