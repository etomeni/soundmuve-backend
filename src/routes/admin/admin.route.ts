import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';


// Controllers
import { 
    getUserByEmailCtrl,
    addNewAdminCtrl,
    getAllAdminUsersCtrl,
    blockRemoveAdminCtrl,
} from '@/controllers/admin/adminAuthController.js';
import { 
    getActivityLogCtrl,
    getDashboardTopTotalAnalysisCtrl,
    getBestPerformingProjectsCtrl
} from '@/controllers/admin/adminGeneralController.js';


router.use(bodyParser.json());


// router.get(
//     "/",
//     [
//         query('page')
//             .exists().withMessage('Page is required')
//             .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

//         query('limit')
//             .exists().withMessage('Limit is required')
//             .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

//         query('releaseType')
//             .optional()
//             // .exists().withMessage('Release type is required')
//             .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    
//         // authMiddleware,
//         adminAuthMiddleware,
//     ],
//     getAllReleaseCtrl
// );

router.get(
    "/get-user-by-email",
    [
        query('email')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Email address is required.'),

        // authMiddleware,
        adminAuthMiddleware,
    ],
    getUserByEmailCtrl
);

router.get(
    "/get-all-admin",
    [
        adminAuthMiddleware,
    ],
    getAllAdminUsersCtrl
);


router.post(
    "/add-new-admin",
    [
        body('firstName')
            .isString().trim().isLength({ min: 3 })
            .withMessage('First name is required.'),

        body('lastName')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Last Name is required.'),

        body('email')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Email address is required.'),

        // body('password')
        //     .isString().trim().isLength({ min: 3 })
        //     .withMessage('Password is required.'),

        body('newRole')
            .isString().trim().isLength({ min: 3 })
            .withMessage('new role is required.'),

        adminAuthMiddleware,
    ],
    addNewAdminCtrl
);


router.patch(
    "/block-remove-admin",
    [
        body('action')
            .isString().trim()
            .isIn(['block', 'remove'])
            .withMessage('action must be either "block" or "remove".'),

        body('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user id is required.'),

        adminAuthMiddleware,
    ],
    blockRemoveAdminCtrl
);


router.get(
    "/activity-log",
    [
        query('user_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user_id is required.'),

        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getActivityLogCtrl
);


/*
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
*/

// dashboard-topTotal-analysis
router.get(
    "/dashboard-topTotal-analysis",
    [
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getDashboardTopTotalAnalysisCtrl
);

// best-performing-projects
router.get(
    "/best-performing-projects",
    [
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getBestPerformingProjectsCtrl
);



export default router;
