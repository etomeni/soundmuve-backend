import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
// import authMiddleware from '../middleware/auth.js';
// import { getVasAuthToken } from '@/middleware/psbAuth.js';

// Controllers
import { 
    subscribeNewsletterCtrl,
    contactUsCtrl,
    // getBetBillersCtrl
} from '../controllers/contactController.js';


router.use(bodyParser.json());


router.post(
    "/subscribe-newsletter",
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    subscribeNewsletterCtrl
);

router.post(
    "/contact-us",
    [
        body('name').trim().not().isEmpty(),
        body('message').trim().not().isEmpty(),
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    contactUsCtrl
);


export default router;