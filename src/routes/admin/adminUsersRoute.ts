import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getAllUsersCtrl,
    getUserByIdCtrl,
    searchUsersCtrl,
    updateUserStatusCtrl,
    getAllUsersReleasesCtrl,
    getAllArtistUnderRecordLabelCtrl,
    getReleasesOfArtistUnderRecordLabelCtrl,
    getTopUsersStatsCtrl
} from '@/controllers/admin/adminUsersController.js';


router.use(bodyParser.json());


router.get(
    "/",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('userType')
            .optional()
            // .exists().withMessage('Release type is required')
            .isIn(['All', 'artist', 'record label'])
            .withMessage('User type must be either "All", "artist" or "record label"'),
    
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getAllUsersCtrl
);


router.get(
    "/user-by-id",
    [
        query('id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user _id is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getUserByIdCtrl
);

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
    searchUsersCtrl
);

router.get(
    "/top-stats",
    [
        // query('page')
        //     .exists().withMessage('Page is required')
        //     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        // query('limit')
        //     .exists().withMessage('Limit is required')
        //     .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getTopUsersStatsCtrl
);


router.get(
    "/releases",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user _id is required.'),
    
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getAllUsersReleasesCtrl
);

router.get(
    "/rl-artist",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user _id is required.'),
    
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getAllArtistUnderRecordLabelCtrl
);

router.get(
    "/rl-artist-releases",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user _id is required.'),

        query('artist_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('artist _id is required.'),

    
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getReleasesOfArtistUnderRecordLabelCtrl
);

router.post(
    "/update-status",
    [
        body('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user_id is required.'),

        body('currentStatus')
            .isBoolean().notEmpty()
            .withMessage('The current status is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    updateUserStatusCtrl
);



export default router;
