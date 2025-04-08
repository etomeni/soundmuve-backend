import { Request, Response, NextFunction } from "express-serve-static-core";
import fs from "fs";

import { logActivity } from "@/util/activityLogFn.js";
import { blogPostModel } from "@/models/blogPosts.model.js";
// import { blogInterface } from "@/typeInterfaces/blog.interface.js";
import { blogPostCommentModel } from "@/models/blogComments.model.js";
import { cloudinaryImageUpload, deleteImageFileFromCloudinary } from "@/util/cloudFileStorage.js";
import moment from "moment";


export const admin_getPostsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find blog posts
        const blogPosts = await blogPostModel.find()
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();

        if (!blogPosts) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to get posts."
            });
        };

        // Count total single for the user to support pagination
        const totalDbRecordCount = await blogPostModel.countDocuments();

        // logActivity(req, `Get blog posts`, user_id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                posts: blogPosts,

                totalPages: Math.ceil(totalDbRecordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalDbRecordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getPostsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find blog posts
        const blogPosts = await blogPostModel.find({status: "published"})
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();

        if (!blogPosts) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to get posts."
            });
        };

        // Count total single for the user to support pagination
        const totalDbRecordCount = await blogPostModel.countDocuments({status: "published"});

        // logActivity(req, `Get blog posts`, user_id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                posts: blogPosts,

                totalPages: Math.ceil(totalDbRecordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalDbRecordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getPostBySlugCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post_slug = req.params.post_slug;

        // Find the blog post by slug and increment the views count
        const blogPost = await blogPostModel.findOneAndUpdate(
            { slug: post_slug }, // Find the post by slug
            { $inc: { views: 1 } }, // Increment the views count by 1
            { new: true } // Return the updated post
        );

        if (!blogPost) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Post not found."
            });
        };

        // logActivity(req, "Get blog posts by id", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: blogPost,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const admin_getPostByIdCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post_id = req.params.post_id;

        // Find the blog post by slug and increment the views count
        const blogPost = await blogPostModel.findById(post_id);

        if (!blogPost) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Post not found."
            });
        };

        // logActivity(req, "Get blog posts by id", _id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: blogPost,
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const searchPostsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const searchWord = req.query.searchWord as string;
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Perform a case-insensitive search on title, content, categories, and tags
        const blogPosts = await blogPostModel.find({
            $or: [
            { title: { $regex: searchWord, $options: 'i' } }, // Case-insensitive search on title
            { content: { $regex: searchWord, $options: 'i' } }, // Case-insensitive search on content
            { categories: { $regex: searchWord, $options: 'i' } }, // Case-insensitive search on categories
            { tags: { $regex: searchWord, $options: 'i' } }, // Case-insensitive search on tags
            ],
        })
        .sort({ createdAt: -1 }) // Sort by newest first
        .limit(limit) // Set the number of items per page
        .skip((page - 1) * limit) // Skip items to create pages
        .exec();
  

        if (!blogPosts) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to get posts."
            });
        };

        // Count total single for the user to support pagination
        const totalDbRecordCount = await blogPostModel.countDocuments();

        // logActivity(req, `Get blog posts`, user_id);

        // Return the matching posts
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                posts: blogPosts,

                totalPages: Math.ceil(totalDbRecordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalDbRecordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getPostCommentsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const post_id = req.query.post_id;
        const page = parseInt(req.query.page as string) || 1; // Current page number, default is 1
        const limit = parseInt(req.query.limit as string) || 20; // Number of items per page, default is 20

        // Find blog posts
        const blogPosts = await blogPostCommentModel.find({ post: post_id })
            .sort({ createdAt: -1 })  // Sort by newest first
            .limit(limit) // Set the number of items per page
            .skip((page - 1) * limit) // Skip items to create pages
            .exec();

        if (!blogPosts) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "something went wrong, post not found."
            });
        };


        // Count total single for the user to support pagination
        const totalDbRecordCount = await blogPostCommentModel.countDocuments();

        // logActivity(req, `Get blog posts`, user_id);

        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                posts: blogPosts,

                totalPages: Math.ceil(totalDbRecordCount / limit), // Calculate total pages
                currentPage: page,
                totalRecords: totalDbRecordCount,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const createPostCommentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Find the post by slug
        const post = await blogPostModel.findById(req.body.post_id);

        // If the post is not found, return a 404 error
        if (!post) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Post not found."
            });
        }

        const newComment = new blogPostCommentModel({
            content: req.body.content,
            author_name: req.body.author_name,
            author_email: req.body.author_email,
            post_id: post._id,
            status: "pending",
        });
        const newPostComment = await newComment.save();
        if (!newPostComment) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to save comment."
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newPostComment,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const editPostCommentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        // const adminEmail = req.body.authMiddlewareParam.email;

        // Update comment
        const postComment = await blogPostCommentModel.findByIdAndUpdate(
            req.body.post_id, 
            {
                content: req.body.content,
                author_name: req.body.author_name,
                author_email: req.body.author_email,
                post_id: req.body.post_id,
                // status: "pending",
            },
            { new: true }
        );

        // If the post is not found, return a 404 error
        if (!postComment) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "Post not found."
            });
        }

        logActivity(req, `Updated post comment`, admin_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: postComment,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const deletePostCommentCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        // const adminEmail = req.body.authMiddlewareParam.email;

        // Update comment
        const postComment = await blogPostCommentModel.findByIdAndDelete(req.params.post_id);

        logActivity(req, `Deleted a post comment`, admin_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: postComment,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// create blog post
export const createBlogPostCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;
        const user_full_name = req.body.authMiddlewareParam.name;

        const files: any = req.files;
        // const songAudio = files.songAudio ? files.songAudio[0].path : null;
        const tempt_image = files.tempt_image ? files.tempt_image[0].path : null;
        // if (!tempt_image) {
        //     return res.status(400).json({
        //         status: false,
        //         statusCode: 400,
        //         message: "featuredImage is required to publish a blog post."
        //     });
        // }
        
        const featuredImage = tempt_image ? await cloudinaryImageUpload(tempt_image, "images/blog") : '';
        // Optionally delete the local files after uploading to Cloudinary
        if (tempt_image) fs.unlinkSync(tempt_image);


        let available_slug = req.body.slug;
        // Check if the slug already exists
        const existingPost = await blogPostModel.findOne({ slug: available_slug }).lean();
        // If the slug is available, return success
        if (existingPost) {
            // If the slug is taken, generate and suggest alternatives
            let suggestedSlug;
            let counter = 1;
            while (true) {
                suggestedSlug = `${available_slug}-${counter}`;
                const existingSuggestedPost = await blogPostModel.findOne({ slug: suggestedSlug });
                if (!existingSuggestedPost) {
                    available_slug = suggestedSlug;
                    break;
                }
                counter++;
            }
        }


        const data2db = {
            title: req.body.title,
            slug: available_slug,
            content: req.body.content,

            featuredImage: featuredImage,
            author: user_id,
            author_email: user_email,
            author_name: user_full_name,

            categories: JSON.parse(req.body.categories) || [],
            tags: JSON.parse(req.body.tags) || [],

            metaTitle: req.body.metaTitle,
            metaDescription: req.body.metaDescription,
            keywords: JSON.parse(req.body.keywords) || [],

            allowComments: JSON.parse(req.body.allowComments) ? true : false,

            // comments: [],
            // views: req.body.views,
            status: req.body.status,
            publishedAt: req.body.publishedAt,
        };

        const newBlogPost = new blogPostModel(data2db);
        const newBlogPostResponds = await newBlogPost.save();
        if (!newBlogPostResponds) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to save blog post."
            });
        }

        logActivity(req, `Created a new blog post`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: newBlogPostResponds,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// create post slug
export const checkBlogPostSlugCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const slug = req.query.post_slug as string;

        // Check if the slug already exists
        const existingPost = await blogPostModel.findOne({ slug });
    
        // If the slug is available, return success
        if (!existingPost) {
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: {
                    available: true, 
                    slug
                },
                message: "Successful!"
            });
        }
    
        // If the slug is taken, generate and suggest alternatives
        let suggestedSlug;
        let counter = 1;
        while (true) {
            suggestedSlug = `${slug}-${counter}`;
            const existingSuggestedPost = await blogPostModel.findOne({ slug: suggestedSlug });
            if (!existingSuggestedPost) {
                break;
            }
            counter++;
        }

        // Return the suggested slug
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                available: false, 
                slug: suggestedSlug,
            },
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// edit blog post
export const editBlogPostCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        const user_email = req.body.authMiddlewareParam.email;
        const user_full_name = req.body.authMiddlewareParam.name;

        const blogPost = await blogPostModel.findById(req.params.post_id).lean();
        if (!blogPost) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Post with this ID could not be found."
            });
        }


        const files: any = req.files;
        // const songAudio = files.songAudio ? files.songAudio[0].path : null;
        const tempt_image = files.tempt_image ? files.tempt_image[0].path : null;
        let featuredImage = blogPost.featuredImage || '';
        if (tempt_image) {
            featuredImage = tempt_image ? await cloudinaryImageUpload(tempt_image, "images/blog") : '';
            // Optionally delete the local files after uploading to Cloudinary
            if (tempt_image) fs.unlinkSync(tempt_image);

            // check and delete previous image.
            if (blogPost.featuredImage) {
                // Delete associated file from Cloudinary
                // const deleteResult = deleteImageFileFromCloudinary(blogPost.featuredImage);
                const deleteResult = deleteImageFileFromCloudinary(blogPost.featuredImage);
            }
        }
        

        let available_slug = req.body.slug;
        // Check if the slug already exists
        const existingPost = await blogPostModel.findOne({ slug: available_slug }).lean();
        // If the slug is available, return success
        if (existingPost) {
            // If the slug is taken, generate and suggest alternatives
            let suggestedSlug;
            let counter = 1;
            while (true) {
                suggestedSlug = `${available_slug}-${counter}`;
                const existingSuggestedPost = await blogPostModel.findOne({ slug: suggestedSlug });
                if (!existingSuggestedPost) {
                    available_slug = suggestedSlug;
                    break;
                }
                counter++;
            }
        }

        const data2db = {
            title: req.body.title,
            slug: available_slug,
            content: req.body.content,

            featuredImage: featuredImage,
            // author: user_id,
            // author_email: user_email,

            categories: JSON.parse(req.body.categories) || [],
            tags: JSON.parse(req.body.tags) || [],

            metaTitle: req.body.metaTitle,
            metaDescription: req.body.metaDescription,
            keywords: JSON.parse(req.body.keywords) || [],

            allowComments: JSON.parse(req.body.allowComments) ? true : false,

            // comments: [],
            // views: req.body.views,
            status: req.body.status,
            publishedAt: req.body.publishedAt,

            updatedBy: {
                user_id: user_id,
                user_email: user_email,
                name: user_full_name,
                updatedAt: moment().format()
            },
        };

        const updatedBlogPost = await blogPostModel.findByIdAndUpdate(
            blogPost._id,
            { 
                $set: data2db
            }, 
            { new: true }
        );
        if (!updatedBlogPost) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "Unable to update blog post."
            });
        }

        logActivity(req, `Updated a new blog post`, user_id);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: updatedBlogPost,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// delete blog post
export const deleteBlogPostCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        // const adminEmail = req.body.authMiddlewareParam.email;

        const blogPost = await blogPostModel.findById(req.params.post_id);
        if (!blogPost) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Post with this ID could not be found."
            });
        }

        // check and delete featured image.
        if (blogPost.featuredImage) {
            // Delete associated file from Cloudinary
            const deleteResult = await deleteImageFileFromCloudinary(blogPost.featuredImage);

            if (!deleteResult) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: "Failed to delete blog post."
                });
            }
        }

        // delete post
        const deletedPromotion = await blogPostModel.findByIdAndDelete(blogPost._id);
        
        if (!deletedPromotion) {
            // Response 
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: "Failed to delete blog post."
            });
        }
        // delete all the comments associated with the post.
        const postComment = await blogPostCommentModel.deleteMany({ post_id: req.params.post_id });

        logActivity(req, `Deleted a blog post, and all its comments.`, admin_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: postComment,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// trash blog post (i.e moving to trash)
export const trashBlogPostCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const admin_id = req.body.authMiddlewareParam._id;
        // const adminEmail = req.body.authMiddlewareParam.email;

        // Update comment
        const blogPost = await blogPostModel.findByIdAndUpdate(
            req.params.post_id,
            {
                status: "trashed",
                // trashedAt: new Date().toISOString().slice(0, 19) + 'Z'
                trashedAt: moment().format()
            },
            { new: true }
        );

        logActivity(req, `Move a blog post to trash.`, admin_id);
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // result: postComment,
            message: "Successful!"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
