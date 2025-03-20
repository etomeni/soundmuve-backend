import mongoose, { Schema } from 'mongoose';
import { blogInterface } from '@/typeInterfaces/blog.interface.js';


const postSchema = new Schema<blogInterface>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true }, // SEO-friendly URL
        content: { type: String, required: true },
        featuredImage: { type: String }, // URL to the featured image
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        author_email: { type: String, required: true }, 
        author_name: { type: String, required: true }, 

        categories: [{ type: String }], // Array of categories/tags
        tags: [{ type: String }], // Additional tags for flexibility
        metaTitle: { type: String }, // SEO meta title
        metaDescription: { type: String }, // SEO meta description
        keywords: [{ type: String }], // SEO keywords
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        views: { type: Number, default: 0 }, // Track post views

        allowComments: { type: Boolean, default: false },

        updatedBy: {
            user_id: { type: String },
            user_email: { type: String },
            name: { type: String },
            updatedAt: { type: String }
        },

        // Status and Scheduling Fields
        status: {
            type: String,
            enum: ["draft", "scheduled", "published", "trashed"], // Allowed states
            default: "draft", // Default state
        },
        publishedAt: { type: Date }, // Scheduled publish date
        trashedAt: { type: Date }, // When the post was trashed
    },
    { timestamps: true }
);

export const blogPostModel = mongoose.model("Post", postSchema);
