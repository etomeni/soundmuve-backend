import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getNewsletterSubscribersCtrl,
    getSentNewslettersCtrl,
    getSentNewslettersByIdCtrl,
    sendNewsletterCtrl,
} from '@/controllers/admin/adminNewsletterController.js';


// router.use(bodyParser.json());
router.use(bodyParser.json({limit: "50mb"}));

// get newsletter subscribers
router.get(
    "/subscribers",
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
    getNewsletterSubscribersCtrl
);

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
    getSentNewslettersCtrl
);

// newsletter-by-id
router.get(
    "/newsletter-by-id",
    [
        query('newsletter_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('newsletter _id is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getSentNewslettersByIdCtrl
);


// sendNewsletter
router.post(
    "/sendNewsletter",
    [
        body('title')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Title is required.'),

        body('message')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Message is required.'),

        body('user_name')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Name is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    sendNewsletterCtrl
);


export default router;
