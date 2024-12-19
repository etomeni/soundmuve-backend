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
    resetResleasesCtrl
} from '@/controllers/admin/adminAnalyticsController.js';


router.use(bodyParser.json());


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

router.get(
    "/reset-releases",
    // [
    //     query('page')
    //         .exists().withMessage('Page is required')
    //         .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    //     query('limit')
    //         .exists().withMessage('Limit is required')
    //         .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

    //     // query('releaseType')
    //     //     .optional()
    //     //     // .exists().withMessage('Release type is required')
    //     //     .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
    //     // authMiddleware,
    //     routeValidationResult,
    //     adminAuthMiddleware,
    // ],
    resetResleasesCtrl
);

export default router;
