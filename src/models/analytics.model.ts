import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';
import { analyticsInterface } from '@/typeInterfaces/analytics.interface.js';


const locationAnalyticsSchema = {
    country: { type: String, required: true },

    albumSold: { type: Number, required: true },
    noSold: { type: Number, required: true },
    streamRevenue: { type: Number, required: true },
    streamPlay: { type: Number, required: true },
    revenue: { type: Number, required: true },
};



const analyticsSchema = new Schema<analyticsInterface>(
    {
        user_email: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },

        release_id: {
            type: String,
            required: true,
        },
        song_id: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            required: true,
        },

        albumSold: {
            type: Number,
            // required: true,
        },
        noSold: {
            type: Number,
            required: true,
        },
        revenue: {
            type: Number,
            required: true,
        },
        streamRevenue: {
            type: Number,
            required: true,
        },
        streamPlay: {
            type: Number,
            required: true,
        },

        location: [locationAnalyticsSchema],

        updatedBy: {
            user_id: { type: String, required: true },
            user_email: { type: String, required: true },
            name: { type: String, required: true }
        },
    
        status: { 
            type: String, 
            enum: ["Pending", "Processing", "Success", "Complete", "Failed"], 
            required: true 
        },

    },
    { timestamps: true }
);
export const analyticsModel = mongoose.model("Analytic", analyticsSchema);