import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
// import authMiddleware from '@/middleware/auth.js';
import adminAuthMiddleware from '@/middleware/adminAuth.js';

// Controllers
import { 
    getAllCouponCtrl,
    getCouponByIdCtrl,

    rejectCouponDiscountCtrl,
    approveCouponDiscountCtrl
} from '@/controllers/admin/adminCouponController.js';


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

        // authMiddleware,
        adminAuthMiddleware,
    ],
    getAllCouponCtrl
);

// coupon-by-id
router.get(
    "/coupon-by-id",
    [
        query('coupon_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('coupon _id is required.'),

        // authMiddleware,
        adminAuthMiddleware,
    ],
    getCouponByIdCtrl
);

// approve
router.post(
    "/approve",
    [
        body('coupon_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Coupon _id is required.'),

        body('discountPercentage')
            .isNumeric().notEmpty()
            .withMessage('Discount percentage is required.'),


        adminAuthMiddleware,
    ],
    approveCouponDiscountCtrl
);

// reject
router.post(
    "/reject",
    [
        body('coupon_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Coupon _id is required.'),

        adminAuthMiddleware,
    ],
    rejectCouponDiscountCtrl
);



export default router;
