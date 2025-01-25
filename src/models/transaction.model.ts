import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { transactionInterface } from '@/typeInterfaces/transaction.interface.js';


const transactionSchema = new Schema<transactionInterface>(
    {
        user_email: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },

        transactionType: {
            type: String, 
            enum: ["Withdrawal", "Credit", "Debit", "Payment"],
            required: true 
        },
        description: {
            type: String, 
            required: true 
        },
        amount: {
            type: Number, 
            required: true 
        },

        credit: {
            analytics_id: {type: String},
            release_id: {type: String},
            // revenue: string;
        },
            
        withdrawal: {
            payout_id: {type: String},

            exchangeRate: {
                rate: {type: Number},
                source: {
                    currency: {type: String},
                    amount: {type: Number},
                },
                destination: {
                    currency: {type: String},
                    amount: {type: Number},
                }
            },

            narration: {type: String},

            paymentMethod: {type: String},
            currency: {type: String},
            accountNumber: {type: String},
            beneficiaryName: {type: String},
            bankName: {type: String},
            beneficiaryEmail: {type: String},
        },

        payment: {
            cartItems: { type: Array },
            paidAmount: { type: Number },
            totalAmount: { type: Number },
            paymentIntent: { type: String },
            paymentIntentClientSecret: { type: String },
            paymentStatus: { type: String },
            currency: { type: String, default: "USD" },
        },

        metaData: {
            status: { type: String },
            message: { type: String },
            data: { type: Object },
        },

        status: { 
            type: String, 
            enum: ["Pending", "Processing", "Success", "Complete", "Failed"], 
            required: true 
        },

        updatedBy: {
            user_id: { type: String },
            user_email: { type: String },
            name: { type: String }
        },
    },
    { timestamps: true }
);
export const transactionModel = mongoose.model("Transaction", transactionSchema);