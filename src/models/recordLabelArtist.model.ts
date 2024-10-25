import mongoose, { Schema } from 'mongoose';
import { recordLabelArtistInterface } from '@/typeInterfaces/recordLabelArtist.interface.js';


const recordLabelArtistSchema = new Schema<recordLabelArtistInterface>(
    {
        user_id: {
            type: String,
            required: true,
        },
        user_email: {
            type: String,
            required: true,
        },

        artistName: {
            type: String,
            required: true,
        },

        artistEmail: {
            type: String,
            // required: true,
        },

        artistPhoneNumber: {
            type: String,
            // required: true,
        },

        country: {
            type: String,
            // required: true,
        },

        gender: {
            type: String,
            // required: true,
        },

        artistAvatar: {
            type: String,
            // required: true,
        }

    },
    { timestamps: true }
);

export const recordLabelArtistModel = mongoose.model("RecordLabelArtist", recordLabelArtistSchema);
