import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
// import authMiddleware from '@/middleware/auth.js';
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getAllReleaseCtrl,
    getReleaseByIdCtrl,
    searchReleasesCtrl,
    updateReleaseStatusCtrl,
    updateReleaseUPC_EAN_ISRC_Ctrl
} from '@/controllers/admin/adminReleaseController.js';


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

        query('releaseType')
            .optional()
            // .exists().withMessage('Release type is required')
            .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
        // authMiddleware,
        adminAuthMiddleware,
    ],
    getAllReleaseCtrl
);

router.get(
    "/release-by-id",
    [
        query('id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Release _id is required.'),

        // authMiddleware,
        adminAuthMiddleware,
    ],
    getReleaseByIdCtrl
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
    
        // authMiddleware,
        adminAuthMiddleware,
    ],
    searchReleasesCtrl
);

router.post(
    "/update-status",
    [
        body('release_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Release _id is required.'),

        body('status')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Status is required.'),

        // body('linkTreeUrl')
        //     .exists().withMessage('Page is required')
        //     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        // authMiddleware,
        adminAuthMiddleware,
    ],
    updateReleaseStatusCtrl
);

router.post(
    "/update-UPC_EAN_ISRC",
    [
        body('release_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Release _id is required.'),

        body('song_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('song_id is required.'),

        body('upcEanCode')
            .isString().trim().isLength({ min: 3 })
            .withMessage('UPC/EAN code is required.'),

        body('isrcNumber')
            .isString().trim().isLength({ min: 3 })
            .withMessage('ISRC number is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    updateReleaseUPC_EAN_ISRC_Ctrl
);



export default router;
