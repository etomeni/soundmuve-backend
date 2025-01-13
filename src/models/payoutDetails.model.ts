import mongoose, { Schema } from 'mongoose';
import { payoutDetailsInterface } from '@/typeInterfaces/payout.interface.js';


const payoutDetailSchema = new Schema<payoutDetailsInterface>(
    {
        user_id: {
            type: String,
            required: true,
        },
        user_email: {
            type: String,
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
        },

        currency: {
            currency_symbol: {
                type: String,
                required: true,
            },
            currency_name: {
                type: String,
                required: true,
            },
            currency_code: {
                type: String,
                required: true,
            },
        },

        account_number: {
            type: String,
            // required: true,
        },
        beneficiary_name: {
            type: String,
            // required: true,
        },
        bank_name: {
            type: String,
            // required: true,
        },
        beneficiary_email: {
            type: String,
            // required: true,
        },

        bank: {
            id: { type: Number },
            code: { type: String },
            name: { type: String },
        },

        routing_number: {
            type: String,
        },
        swift_code: {
            type: String,
        },
        beneficiary_address: {
            type: String,
        },
        beneficiary_country: {
            type: String,
        },
        postal_code: {
            type: String,
        },
        street_number: {
            type: String,
        },
        street_name: {
            type: String,
        },
        city: {
            type: String,
        },
        destination_branch_code: {
            type: String,
        },
    },
    { timestamps: true }
);

export const payoutDetailsModel = mongoose.model("PayoutDetail", payoutDetailSchema);
