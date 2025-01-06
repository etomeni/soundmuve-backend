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


export default router;
