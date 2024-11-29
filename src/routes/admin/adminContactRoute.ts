import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getContactMessagesCtrl,
    getContactMessageByIdCtrl,
    contactReplyCtrl,
} from '@/controllers/admin/adminContactController.js';


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

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getContactMessagesCtrl
);

// contact-by-id
router.get(
    "/contact-by-id",
    [
        query('contact_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('contact _id is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    getContactMessageByIdCtrl
);

// reply
router.put(
    "/reply",
    [
        body('contact_id')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Contact _id is required.'),

        body('replyMsg')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Reply message is required.'),

        body('user_name')
            .isString().trim().isLength({ min: 3 })
            .withMessage('Name is required.'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    contactReplyCtrl
);


export default router;
