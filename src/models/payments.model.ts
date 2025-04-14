import mongoose, { Schema } from 'mongoose';
import { paymentInterface } from '@/typeInterfaces/transaction.interface.js';
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
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentTransactionId: {
            type: String,
            required: true,
        },
        paymentTransactionReference: {
            type: String,
            required: true,
        },
        paymentCurrency: {
            type: String,
            required: true,
            default: "USD"
        },
        exchangeRate: {
            type: String,
            required: true,
        },

        paidAmount: {
            type: String,
            required: true,
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
            required: true,
        },

        
    },
    { timestamps: true }
);
export const PaymentModel = mongoose.model("Payment", PaymentSchema);