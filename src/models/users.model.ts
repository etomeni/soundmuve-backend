import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import { userInterface } from '@/typeInterfaces/users.interface.js';


const userSchema = new Schema<userInterface>(
    {
        role: { 
            type: String, 
            enum: ['user', 'admin'], 
            default: 'user' 
        }, // Added role field
        
        userType: {
            type: String,
            enum: ['artist', 'record label'], 
            // required: true,
        },
        balance: {
            type: Number,
            required: true,
        },

        email: {
            type: String,
            required: [true, "Please enter the user email adddress."],
            max: 255,

            unique: true,
            lowercase: true,
            validate: {
              validator: (v: string) => validator.isEmail(v),
              message: ({ value }) => `${value} is not a valid email`,
            },
        },
        firstName: {
            type: String,
            required: true,
            max: 255,
        },
        lastName: {
            type: String,
            required: true,
            max: 255,
        },
        phoneNumber: {
            type: String,
            // required: [true, "Please enter the user Phone number."],
            // unique: true,
        },
        country: {
            type: String,
            // required: [true, "Please enter the user country."]
        },
        gender: {
            type: String,
            // enum: ['Male', 'Female', 'Others'], 
        },
        artistName: {
            type: String,
        },
        recordLabelName: {
            type: String,
        },
        recordLabelLogo: {
            type: String,
        },

        kyc: {
            securityQuestions: [
                {
                    question: { type: String },
                    answer: { type: String },
                },
            ],
            isKycSubmitted: {
                type: Boolean,
                default: false,
            },
            phoneNumber: { type: String },
        },

        password: {
            type: String,
            required: [true, "User password required."]
        },
        location: {
            ip: String,
            usedIps: [String],
            city: String,
            country: String,
            isp: String,
            lat: Number,
            lon: Number,
        },
        status: {
            type: Boolean,
            required: true,
            default: true
        }
    },
    { timestamps: true }
);

export const userModel = mongoose.model("User", userSchema);
