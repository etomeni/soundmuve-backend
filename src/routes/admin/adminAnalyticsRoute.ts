import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getLiveResleasesCtrl,
    getLiveReleaseByIdCtrl,
    getAnalyticsByDateCtrl,
    setAnalyticsCtrl,
    searchLiveReleasesCtrl,
    resetResleasesCtrl
} from '@/controllers/admin/adminAnalyticsController.js';


router.use(bodyParser.json());


// live-releases
router.get(
    "/live-releases",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        // query('releaseType')
        //     .optional()
        //     // .exists().withMessage('Release type is required')
        //     .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
        // authMiddleware,
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getLiveResleasesCtrl
);

// release-analytics
router.get(
    "/release-analytics",
    [
        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        query('song_id')
            .isString().trim().notEmpty()
            .withMessage('song_id is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getLiveReleaseByIdCtrl
);

// dated-release-analytics
router.get(
    "/dated-release-analytics",
    [
        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        query('song_id')
            .isString().trim().notEmpty()
            .withMessage('song_id is required.'),

        query('analytics_date')
            .isString().trim().notEmpty()
            .withMessage('analytics date is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getAnalyticsByDateCtrl
);

// setAnalytics
router.post(
    "/setAnalytics",
    [
        body('admin_fullname')
            .isString().trim().notEmpty()
            .withMessage('admin user name is required.'),

        body('serviceCharge')
            .isNumeric().notEmpty()
            .withMessage('service charge is required.'),

        // body('user_id')
        //     .isString().trim().notEmpty()
        //     .withMessage('user _id is required.'),

        body('analytics_id')
            .isString().trim().optional(),

        body('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        body('song_id')
            .isString().trim().notEmpty()
            .withMessage('song_id is required.'),

        body('date')
            .isString().trim().notEmpty()
            .withMessage('analytics date is required.'),

        body('albumSold')
            .isNumeric().optional(),
            // .withMessage('album sold is required.'),

        body('noSold')
            .isNumeric().notEmpty()
            .withMessage('number of singles sold is required.'),

        body('revenue')
            .isNumeric().notEmpty()
            .withMessage('revenue is required.'),

        body('streamRevenue')
            .isNumeric().notEmpty()
            .withMessage('stream gevenue is required.'),

        body('streamPlay')
            .isNumeric().notEmpty()
            .withMessage('stream play is required.'),

        body('location')
            .isArray().notEmpty()
            .withMessage('location date is required.'),


        routeValidationResult,
        adminAuthMiddleware,
    ],
    setAnalyticsCtrl
);

// search
router.get(
    "/search",
    [
        query('search')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Search word is required.'),

        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        // query('releaseType')
        //     .optional()
        //     // .exists().withMessage('Release type is required')
        //     .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
        routeValidationResult,
        adminAuthMiddleware,
    ],
    searchLiveReleasesCtrl
);


// router.get(
//     "/reset-releases",
//     // [
//     //     query('page')
//     //         .exists().withMessage('Page is required')
//     //         .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

//     //     query('limit')
//     //         .exists().withMessage('Limit is required')
//     //         .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

//     //     // query('releaseType')
//     //     //     .optional()
//     //     //     // .exists().withMessage('Release type is required')
//     //     //     .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
//     //     // authMiddleware,
//     //     routeValidationResult,
//     //     adminAuthMiddleware,
//     // ],
//     resetResleasesCtrl
// );

export default router;
