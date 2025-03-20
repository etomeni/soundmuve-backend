import mongoose, { Schema } from 'mongoose';
import { commentInterface } from '@/typeInterfaces/blog.interface.js';


const commentSchema = new Schema<commentInterface>(
    {
        content: { type: String, required: true },
        author_name: { type: String, required: true },
        author_email: { type: String, required: true },
        post_id: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
        // Status and Scheduling Fields
        status: {
            type: String,
            enum: ["pending", "approved"], // Allowed states
            default: "pending", // Default state
        },
    },
    { timestamps: true }
);

export const blogPostCommentModel = mongoose.model("Comment", commentSchema);
