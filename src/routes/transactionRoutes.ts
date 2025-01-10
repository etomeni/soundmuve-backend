import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getExchangeRateCtrl,
    initiateWithdrawalCtrl,
    getTransactionsCtrl
} from '@/controllers/transactionController.js';

router.use(bodyParser.json());

// exchange-rate
router.get(
    "/exchange-rate",
    [
        query('amount')
            .isNumeric().notEmpty()
            .withMessage('amount is required.'),

        query('currency')
            .isString().trim().notEmpty()
            .withMessage('currency is required.')
            .matches(/^[A-Z]{3}$/)
            .withMessage('Invalid currency format.'),

        routeValidationResult,
        authMiddleware,
    ],
    getExchangeRateCtrl
);

// get-transactions
router.get(
    "/get-transactions",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        authMiddleware,
    ],
    getTransactionsCtrl
);

// initiate-withdrawal
router.post(
    "/initiate-withdrawal",
    [
        body('amount')
            .isNumeric().notEmpty()
            .withMessage('amount is required.'),

        body('currency')
            .isString().trim().notEmpty()
            .withMessage('currency is required.')
            .matches(/^[A-Z]{3}$/)
            .withMessage('Invalid currency format.'),

        body('narration')
            .isString().trim()
            .withMessage('narration is required.'),

        // body('exchangeRate')
        //     .isObject()
        //     .withMessage('exchangeRate is required.'),

        body('exchangeRate.rate')
            .isNumeric().notEmpty()
            .withMessage('exchange rate is required.'),

        body('exchangeRate.source.amount')
            .isNumeric().notEmpty()
            .withMessage('source amount is required.'),
        body('exchangeRate.source.currency')
            .isString().trim().notEmpty()
            .withMessage('source currency is required.'),

        body('exchangeRate.destination.amount')
            .isNumeric().notEmpty()
            .withMessage('destination amount is required.'),
        body('exchangeRate.destination.currency')
            .isString().trim().notEmpty()
            .withMessage('destination currency is required.'),


        // body('paymentDetails')
        //     .isObject()
        //     .withMessage('narration is required.'),
        body('paymentDetails.payout_id')
            .isString().trim().notEmpty()
            .withMessage('payout_id is required.'),
        body('paymentDetails.paymentMethod')
            .isString().trim().notEmpty()
            .withMessage('payment method is required.'),
        body('paymentDetails.accountNumber')
            .optional().trim().isString(),
            // .withMessage('account number is required.'),
        body('paymentDetails.beneficiaryName')
            .isString().trim().optional(),
            // .withMessage('account number is required.'),
        body('paymentDetails.bankName')
            .isString().trim().optional(),
            // .withMessage('account number is required.'),
        body('paymentDetails.beneficiaryEmail')
            .isString().trim().optional(),
            // .withMessage('account number is required.'),

        routeValidationResult,
        authMiddleware,
    ],
    initiateWithdrawalCtrl
);

export default router;
