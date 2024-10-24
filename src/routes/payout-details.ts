import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';

// Controllers
import { 
    setupPayoutDetailsCtrl,
    editPayoutDetailsCtrl,
    deletePayoutDetailsCtrl,
    getAllPayoutDetailsCtrl,
    getCurrenciesCtrl,
    getBanksListByCountryCodeCtrl,
    getNgBanksAccountNameCtrl
} from '../controllers/payoutDetailsController.js';


router.use(bodyParser.json());


const payoutDetailsValidation = [
    // Validate _id
    // body('_id').isString().withMessage('ID must be a string'),

    // Validate user_email
    // body('user_email').isEmail().withMessage('Invalid email format'),

    // Validate user_id
    // body('user_id').isString().withMessage('User ID must be a string'),

    // Validate paymentMethod
    body('paymentMethod').isString().withMessage('Payment method must be a string'),

    // Validate currency object
    body('currency.currency_symbol').isString().withMessage('Currency symbol must be a string'),
    body('currency.currency_name').isString().withMessage('Currency name must be a string'),
    body('currency.currency_code').isString().withMessage('Currency code must be a string'),

    // Optional fields for account details
    body('account_number').optional().isNumeric().withMessage('Account number must be numeric'),
    body('bank_name').optional().isString().withMessage('Bank name must be a string'),
    body('beneficiary_name').optional().isString().withMessage('Beneficiary name must be a string'),
    
    body('beneficiary_email').optional().isEmail().withMessage('Beneficiary email must be a valid email'),

    body('routing_number').optional().isString().withMessage('Routing number must be a string'),
    body('swift_code').optional().isString().withMessage('SWIFT code must be a string'),

    // Validate beneficiary details
    body('beneficiary_address').optional().isString().withMessage('Beneficiary address must be a string'),
    body('beneficiary_country').optional().isString().withMessage('Beneficiary country must be a string'),

    // Validate other optional address fields
    body('postal_code').optional().isString().withMessage('Postal code must be a string'),
    body('street_number').optional().isString().withMessage('Street number must be a string'),
    body('street_name').optional().isString().withMessage('Street name must be a string'),
    body('city').optional().isString().withMessage('City must be a string'),
    body('destination_branch_code').optional().isString().withMessage('Destination branch code must be a string'),
];


// get payout details for current user
router.get(
    "/",
    [
        authMiddleware,
    ],
    getAllPayoutDetailsCtrl
);

// Add payout details
router.post(
    "/setup",
    [
        ...payoutDetailsValidation,

        authMiddleware,
    ],
    setupPayoutDetailsCtrl
);

// Edit payout details by ID
router.patch(
    "/setup",
    [
        body('payout_id').trim().not().isEmpty(),
        ...payoutDetailsValidation,
    ],
    editPayoutDetailsCtrl
);

// delete payout details
router.delete(
    "/setup/:payout_id",
    [
        authMiddleware,
    ],
    deletePayoutDetailsCtrl
);

// get all supported currencies
router.get(
    "/get-currencies",
    [
        authMiddleware,
    ],
    getCurrenciesCtrl
);

// get list of banks by country code
router.get(
    "/banks/:country",
    [
        authMiddleware,
    ],
    getBanksListByCountryCodeCtrl
);

// get/resolve bank account name Ctrl
router.post(
    "/resolve-account-name",
    [
        body('account_number').isString()
            .trim().not().isEmpty()
            .withMessage('account_number is required'),

        body('account_bank').isString()
            .trim().not().isEmpty()
            .withMessage('account_bank is required'),

        authMiddleware,
    ],
    getNgBanksAccountNameCtrl
);


export default router;
