import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import adminAuthMiddleware from '@/middleware/adminAuth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getTransactionsCtrl,
    getTransactionsByIdCtrl,
    getWithdrawalRequestCtrl,
    getTopTotalTransactionAnalysisCtrl,
    updateStatusCtrl,
    acceptWithdrawalCtrl,
    handleFlutterwaveWebhookCtrl,
    verifyPayPalPaymentCtrl
} from '@/controllers/admin/adminTransactionsController.js';


router.use(bodyParser.json());


// Get all transaction
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
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getTransactionsCtrl
);

// Get a transaction by _id
router.get(
    "/transaction-by-id",
    [
        query('transaction_id')
            .isString().trim().notEmpty()
            .withMessage('transaction_id is required'),

        // authMiddleware,
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getTransactionsByIdCtrl
);

// Get all transaction withdrawal-request
router.get(
    "/withdrawal-request",
    [
        // query('page')
        //     .exists().withMessage('Page is required')
        //     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        // query('limit')
        //     .exists().withMessage('Limit is required')
        //     .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        // authMiddleware,
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getWithdrawalRequestCtrl
);

// Get all transaction withdrawal-request
router.get(
    "/total-transaction-analysis",
    [
        // authMiddleware,
        routeValidationResult,
        adminAuthMiddleware,
    ],
    getTopTotalTransactionAnalysisCtrl
);



// accept-withdrawal
router.post(
    "/accept-withdrawal",
    [
        body('user_id')
            .isString().trim().notEmpty()
            .withMessage('user_id is required'),
            
        body('transaction_id')
            .isString().trim().notEmpty()
            .withMessage('transaction_id is required'),
            
        body('payout_id')
            .isString().trim().notEmpty()
            .withMessage('payout_id is required'),
            
        body('adminName')
            .isString().trim().notEmpty()
            .withMessage('adminName is required'),
            
        routeValidationResult,
        adminAuthMiddleware,
    ],
    acceptWithdrawalCtrl
);

// update-status // reject and paid manually
router.post(
    "/update-status",
    [
        body('user_id')
            .isString().trim().notEmpty()
            .withMessage('user_id is required'),
            
        body('transaction_id')
            .isString().trim().notEmpty()
            .withMessage('transaction_id is required'),
            
        body('adminName')
            .isString().trim().notEmpty()
            .withMessage('adminName is required'),
            
        body('actionType')
            .isString().trim().notEmpty()
            .withMessage('actionType is required')
            .isIn(['reject', 'manually paid'])  // "reject" | "manually paid"
            .withMessage('actionType is required'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    updateStatusCtrl
);

// flutterwave-webhook:transaction_id
router.post(
    "/flutterwave-webhook:transaction_id",
    [
        // body('user_id')
        //     .isString().trim().notEmpty()
        //     .withMessage('user_id is required'),

        // routeValidationResult,
        // adminAuthMiddleware,
    ],
    handleFlutterwaveWebhookCtrl
);

// flutterwave-webhook:transaction_id
router.post(
    "/verify-paypal-payment",
    [
        body('transaction_id')
            .isString().trim().notEmpty()
            .withMessage('transaction_id is required'),

        body('payout_batch_id')
            .isString().trim().notEmpty()
            .withMessage('payout_batch_id is required'),

        routeValidationResult,
        adminAuthMiddleware,
    ],
    verifyPayPalPaymentCtrl
);


export default router;
