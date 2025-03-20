import express from 'express';
import { body, param, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';
import { upload_diskStorage } from '@/middleware/multerFile.js';

// Controllers
import {
    getPostsCtrl, 
    admin_getPostsCtrl,
    getPostBySlugCtrl,
    admin_getPostByIdCtrl,
    createBlogPostCtrl,
    getPostCommentsCtrl,
    createPostCommentCtrl,
    deletePostCommentCtrl,
    editPostCommentCtrl,
    editBlogPostCtrl,
    deleteBlogPostCtrl,
    trashBlogPostCtrl,
    searchPostsCtrl,
    checkBlogPostSlugCtrl
} from '@/controllers/blogController.js';

router.use(bodyParser.json());


// get paginated posts
router.get(
    "/admin",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        adminAuthMiddleware
    ],    
    admin_getPostsCtrl
);

// get paginated posts
router.get(
    "/",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult
    ],    
    getPostsCtrl
);

// search posts 
router.get(
    "/search",
    [
        query('searchWord')
            .isString().trim().notEmpty().withMessage('searchWord is required')
            .isLength({ min: 3 }).withMessage('searchWord must be a minimum of 3 characters.'),

        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult
    ],    
    searchPostsCtrl
);

// /:post_slug
router.get(
    "/:post_slug",
    [
        param('post_slug')
            .isString().trim().notEmpty()
            .withMessage('post_slug is required'),

        routeValidationResult,
    ],    
    getPostBySlugCtrl,
);

// /admin/:post_id
router.get(
    "/admin/:post_id",
    [
        param('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    admin_getPostByIdCtrl,
);

// /post/comments
router.get(
    "/post/comments",
    [
        query('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
    ],    
    getPostCommentsCtrl
);

// /post/comments
router.post(
    "/post/comment",
    [
        body('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        body('content')
            .isString().trim().notEmpty()
            .withMessage('content is required'),

        body('author_name')
            .isString().trim().notEmpty()
            .withMessage('author_name is required'),

        body('author_email')
            .isString().trim().notEmpty()
            .withMessage('author_name is required'),

        routeValidationResult,
    ],    
    createPostCommentCtrl
);

// /post/comments
router.patch(
    "/post/comment",
    [
        body('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        body('content')
            .isString().trim().notEmpty()
            .withMessage('content is required'),

        body('author_name')
            .isString().trim().notEmpty()
            .withMessage('author_name is required'),

        body('author_email')
            .isString().trim().notEmpty()
            .withMessage('author_name is required'),

        routeValidationResult,
        adminAuthMiddleware
    ],    
    editPostCommentCtrl
);

// /post/comments
router.delete(
    "/post/comment/:post_id",
    [
        param('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        routeValidationResult,
        adminAuthMiddleware
    ],    
    deletePostCommentCtrl
);

// /create-new-post
router.post(
    "/create-new-post",
    [
        // Featured image validation (optional)
        upload_diskStorage.fields([{ name: 'tempt_image', maxCount: 1 }]),

        // Title validation
        body('title')
            .trim()
            .notEmpty().withMessage('Title is required')
            .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
      
        // Slug validation
        body('slug')
            .trim()
            .notEmpty().withMessage('Slug is required')
            .isLength({ max: 200 }).withMessage('Slug must be less than 200 characters')
            .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
      
        // Content validation
        body('content')
            .trim()
            .notEmpty().withMessage('Content is required'),
      
        // // Featured image validation (optional)
        // body('featuredImage')
        //     .optional()
        //     // .isURL().withMessage('Featured image must be a valid URL'),
        //     .withMessage('Featured image must be a valid URL'),
      
        // Author validation (must be a valid MongoDB ObjectId)
        // body('author')
        //     .notEmpty().withMessage('Author is required')
        //     .isMongoId().withMessage('Author must be a valid MongoDB ID'),
      
        // Categories validation (optional, must be an array of strings)
        body('categories')
            .optional().trim(),
            // .isArray().withMessage('Categories must be an array')
            // .custom((value) => {
            //     if (value.some((category: any) => typeof category !== 'string')) {
            //         throw new Error('Categories must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Tags validation (optional, must be an array of strings)
        body('tags')
            .optional().trim(),
            // .isArray().withMessage('Tags must be an array')
            // .custom((value) => {
            //     if (value.some((tag: any) => typeof tag !== 'string')) {
            //         throw new Error('Tags must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Allow Comments validation (optional)
        body('allowComments')
            .optional().trim(),
      
      
        // Meta title validation (optional)
        body('metaTitle')
            .optional().trim()
            .isLength({ max: 200 }).withMessage('Meta title must be less than 200 characters'),
      
        // Meta description validation (optional)
        body('metaDescription')
            .optional().trim()
            .isLength({ max: 300 }).withMessage('Meta description must be less than 300 characters'),
      
        // Keywords validation (optional, must be an array of strings)
        body('keywords')
            .optional().trim(),
            // .isArray().withMessage('Keywords must be an array')
            // .custom((value) => {
            //     if (value.some((keyword: any) => typeof keyword !== 'string')) {
            //         throw new Error('Keywords must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Views validation (optional, must be a non-negative integer)
        // body('views')
        //     .optional()
        //     .isInt({ min: 0 }).withMessage('Views must be a non-negative integer'),
            
        // Status validation (must be one of the allowed values)
        body('status')
            .optional()
            .isIn(['draft', 'scheduled', 'published', 'trashed']).withMessage('Invalid status'),
      
        // PublishedAt validation (optional, must be a valid date)
        body('publishedAt')
            .optional()
            .isISO8601().withMessage('PublishedAt must be a valid date'),

        // body('trashedAt')
        //     .optional()
        //     .isISO8601().withMessage('trashedAt must be a valid date'),
          
        routeValidationResult,
        adminAuthMiddleware,
        // authMiddleware,
    ],
    createBlogPostCtrl
);

// /edit-new-post
router.patch(
    "/update-post/:post_id",
    [
        // Featured image validation (optional)
        upload_diskStorage.fields([{ name: 'tempt_image', maxCount: 1 }]),

        param('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        // Title validation
        body('title')
            .isString().trim()
            .notEmpty().withMessage('Title is required')
            .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
      
        // Slug validation
        body('slug')
            .trim()
            .notEmpty().withMessage('Slug is required')
            .isLength({ max: 200 }).withMessage('Slug must be less than 200 characters')
            .matches(/^[a-z0-9-]+$/).withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
      
        // Content validation
        body('content')
            .trim()
            .notEmpty().withMessage('Content is required'),
      
        // // Featured image validation (optional)
        // body('featuredImage')
        //     .optional()
        //     // .isURL().withMessage('Featured image must be a valid URL'),
        //     .withMessage('Featured image must be a valid URL'),
      
        // Author validation (must be a valid MongoDB ObjectId)
        // body('author')
        //     .notEmpty().withMessage('Author is required')
        //     .isMongoId().withMessage('Author must be a valid MongoDB ID'),
      
        // Categories validation (optional, must be an array of strings)
        body('categories')
            .optional().trim(),
            // .isArray().withMessage('Categories must be an array')
            // .custom((value) => {
            //     if (value.some((category: any) => typeof category !== 'string')) {
            //         throw new Error('Categories must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Tags validation (optional, must be an array of strings)
        body('tags')
            .optional().trim(),
            // .isArray().withMessage('Tags must be an array')
            // .custom((value) => {
            //     if (value.some((tag: any) => typeof tag !== 'string')) {
            //         throw new Error('Tags must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Allow Comments validation (optional)
        body('allowComments')
            .optional().trim(),
      
      
        // Meta title validation (optional)
        body('metaTitle')
            .optional().trim()
            .isLength({ max: 200 }).withMessage('Meta title must be less than 200 characters'),
      
        // Meta description validation (optional)
        body('metaDescription')
            .optional().trim()
            .isLength({ max: 300 }).withMessage('Meta description must be less than 300 characters'),
      
        // Keywords validation (optional, must be an array of strings)
        body('keywords')
            .optional().trim(),
            // .isArray().withMessage('Keywords must be an array')
            // .custom((value) => {
            //     if (value.some((keyword: any) => typeof keyword !== 'string')) {
            //         throw new Error('Keywords must be an array of strings');
            //     }
            //     return true;
            // }),
      
        // Views validation (optional, must be a non-negative integer)
        // body('views')
        //     .optional()
        //     .isInt({ min: 0 }).withMessage('Views must be a non-negative integer'),
            
        // Status validation (must be one of the allowed values)
        body('status')
            .optional()
            .isIn(['draft', 'scheduled', 'published', 'trashed']).withMessage('Invalid status'),
      
        // PublishedAt validation (optional, must be a valid date)
        body('publishedAt')
            .optional()
            .isISO8601().withMessage('PublishedAt must be a valid date'),

        // body('trashedAt')
        //     .optional()
        //     .isISO8601().withMessage('trashedAt must be a valid date'),
          
        routeValidationResult,
        adminAuthMiddleware,
        // authMiddleware,
    ],
    editBlogPostCtrl
);

// /post/:post_id
router.delete(
    "/post/:post_id",
    [
        param('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        routeValidationResult,
        adminAuthMiddleware
    ],    
    deleteBlogPostCtrl
);

// /post/trash/:post_id
router.patch(
    "/post/trash/:post_id",
    [
        param('post_id')
            .isString().trim().notEmpty()
            .withMessage('post_id is required'),

        routeValidationResult,
        adminAuthMiddleware
    ],    
    trashBlogPostCtrl
);

// /post/check-slug/:post_id
router.get(
    "/post/check-slug",
    [
        query('post_slug')
            .isString().trim().notEmpty()
            .withMessage('post_slug is required'),

        routeValidationResult,
    ],    
    checkBlogPostSlugCtrl
);

export default router;
