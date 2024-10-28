import express from 'express';
import { body, param } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';

// Controllers
import { 
    addToCartCtrl,
    getAllCartItemCtrl,
    removeFromCartCtrl,
    couponDiscountCtrl,
    getPaymentIntentAndKeysCtrl,
    successfulPaymentCtrl,
    checkReleaseCartCtrl
} from '../controllers/cartController.js';


router.use(bodyParser.json());


// add item to cart
router.post(
    "/add-to-cart",
    [
        // release_id should be a non-empty string
        body('release_id')
            .notEmpty()
            .withMessage('Release ID is required.')
            .isString()
            .withMessage('Release ID must be a string.'),

        // user_email must be a valid email format
        body('user_email')
            .isEmail()
            .withMessage('Invalid email format for user_email.'),

        // user_id should be a non-empty string
        body('user_id')
            .notEmpty()
            .withMessage('User ID is required.')
            .isString()
            .withMessage('User ID must be a string.'),

        // artistName should be a non-empty string
        body('artistName')
            .notEmpty()
            .withMessage('Artist name is required.')
            .isString()
            .withMessage('Artist name must be a string.'),

        // coverArt should be a valid URL format
        body('coverArt')
            .isURL()
            .withMessage('coverArt must be a valid URL.'),

        // price should be a positive number
        body('price')
            .isFloat({ gt: 0 })
            .withMessage('Price must be a positive number.'),

        // releaseType should be either 'single' or 'album'
        body('releaseType')
            .isIn(['single', 'album'])
            .withMessage("Release type must be either 'single' or 'album'."),

        // title should be a non-empty string
        body('title')
            .notEmpty()
            .withMessage('Title is required.')
            .isString()
            .withMessage('Title must be a string.'),

        authMiddleware,
    ],
    addToCartCtrl
);

// Get all cart items for a the current user
router.get(
    "/get-cart-items",
    [
        authMiddleware,
    ],
    getAllCartItemCtrl
);

// remove item from cart
router.delete(
    "/:cart_id",
    [
        // Validate 'cart_id' as a MongoDB ObjectId
        param('cart_id')
            .isMongoId()
            .withMessage('Invalid item ID format.'),

        authMiddleware,
    ],
    removeFromCartCtrl
);

// remove item from cart
router.post(
    "/discount-application",
    [
        // Youtube link should be a valid URL format
        body('youtubeLink')
            .isURL()
            .withMessage('Youtube link must be a valid URL.'),

        // Instagram/Facebook link should be a valid URL format
        body('instagramFacebookLink')
            .isURL()
            .withMessage('Instagram/Facebook link must be a valid URL.'),

        // X (former Twitter) link should be a valid URL format
        body('xLink')
            .isURL()
            .withMessage('X (former Twitter) link must be a valid URL.'),
            
        body('cartItems')
            .isArray({ min: 1 })
            .withMessage('Cart can not be empty.'),

        authMiddleware,
    ],
    couponDiscountCtrl
);

// create payment intent
router.post(
    "/create-payment-intent",
    [
        // amount should be a positive number
        body('amount')
            .isFloat({ gt: 0 })
            .withMessage('Amount must be a positive number.'),

        authMiddleware,
    ],
    getPaymentIntentAndKeysCtrl
);



// successful payment
router.post(
    "/successful-payment",
    [
        // amount should be a positive number
        body('paidAmount')
            .isFloat({ gt: 0 })
            .withMessage('Amount must be a positive number.'),

        body('cartItems')
            .isArray({ min: 1 })
            .withMessage('Cart can not be empty.'),

        body('paymentIntent')
            .isString()
            .withMessage('payment intent ID must be a string.'),

        body('paymentIntentClientSecret')
            .isString()
            .withMessage('payment intent client secret must be a string.'),

        body('paymentStatus')
            .isString()
            .withMessage('payment status must be a string.'),

        authMiddleware,
    ],
    successfulPaymentCtrl
);


// add item to cart
router.post(
    "/check-release-cart",
    [
        // release_id should be a non-empty string
        body('release_id')
            .notEmpty()
            .withMessage('Release ID is required.')
            .isString()
            .withMessage('Release ID must be a string.'),

        // user_email must be a valid email format
        // body('user_email')
        //     .isEmail()
        //     .withMessage('Invalid email format for user_email.'),

        // // user_id should be a non-empty string
        // body('user_id')
        //     .notEmpty()
        //     .withMessage('User ID is required.')
        //     .isString()
        //     .withMessage('User ID must be a string.'),

        // artistName should be a non-empty string
        body('artistName')
            .notEmpty()
            .withMessage('Artist name is required.')
            .isString()
            .withMessage('Artist name must be a string.'),

        // coverArt should be a valid URL format
        body('coverArt')
            .isURL()
            .withMessage('coverArt must be a valid URL.'),

        // price should be a positive number
        body('price')
            .isFloat({ gt: 0 })
            .withMessage('Price must be a positive number.'),

        // releaseType should be either 'single' or 'album'
        body('releaseType')
            .isIn(['single', 'album'])
            .withMessage("Release type must be either 'single' or 'album'."),

        // title should be a non-empty string
        body('title')
            .notEmpty()
            .withMessage('Title is required.')
            .isString()
            .withMessage('Title must be a string.'),

        authMiddleware,
    ],
    checkReleaseCartCtrl
);


export default router;
