import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getPromotionsCtrl,
    getActivePromotionsCtrl,
    uploadPromotionsCtrl,
    updatePromotionsCtrl
} from '@/controllers/admin/adminPromotionsController.js';


// router.use(bodyParser.json());
router.use(bodyParser.json({limit: "50mb"}));

// get all active promotions
router.get(
    "/active",
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
    getActivePromotionsCtrl
);

// get all promotions
router.get(
    "/",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getPromotionsCtrl
);


// sendNewsletter
router.post(
    "/upload",
    [
        body('title').isString().trim(),

        body('image')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Image banner is required.'),

        body('userType')
            .isString().trim().isLength({ min: 2 })
            .withMessage('User dashboard type is required.'),

        body('user_name')
            .isString().trim().isLength({ min: 3 })
            .withMessage('user_name type is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    uploadPromotionsCtrl
);

// sendNewsletter
router.post(
    "/update",
    [
        body('promotional_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('_id is required.'),

        body('action')
            .isString().trim()
            .isIn(['status', 'delete'])  // "status" | "delete"
            .withMessage('action must be either "status" or "delete".'),

        body('actionValue')
            .isBoolean().notEmpty()
            .withMessage('Action value is required.'),


        routeValidationResult,
        adminAuthMiddleware,
    ],
    updatePromotionsCtrl
);


export default router;
