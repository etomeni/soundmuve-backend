import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import adminAuthMiddleware from '@/middleware/adminAuth.js';

// Controllers
import { 
    getAllReleaseCtrl,
    searchReleasesCtrl
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



export default router;
