import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// Models
// import { userModel } from '../models/users.model.js';

// Controllers
import { 
    signupController, 

    loginController, 
    // updateUserProfileCtr, 
    changePasswordCtr,
    resetPasswordCtr,
    reValidateUserAuthCtrl,
    sendPasswordResetEmailCtr,
    resendEmailVerificationTokenCtr,
    updateSignupController,
} from './../controllers/authController.js';

// middleWares
import authMiddleware from './../middleware/auth.js'


router.use(bodyParser.json());

// signup
router.post(
    '/signup',
    [
        body('firstName').trim().not().isEmpty(),
        body('lastName').trim().not().isEmpty(),
        // body('gender').trim().not().isEmpty(),
        // body('country').trim().not().isEmpty(),

        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

        // body('phoneNumber').trim().not().isEmpty(),

        body('password').trim().not().isEmpty(),
        // body('userIp').trim().not().isEmpty(),
    ],
    signupController
);

router.patch(
    "/updateUser-details",
    [
        body('userType').trim().not().isEmpty(),
        body('phoneNumber').trim().not().isEmpty(),
        body('country').trim().not().isEmpty(),

        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
        // authMiddleware
    ],
    updateSignupController
);

// Login
router.post(
    '/login',
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

        body('password').trim().not().isEmpty()
    ],
    loginController
);

router.get(
    "/reValidateUserAuth",
    authMiddleware,
    reValidateUserAuthCtrl
)

// // update User Profile
// router.post(
//     '/updateUserProfile',
//     authMiddleware,
//     updateUserProfileCtr
// );


// send Password Reset Email
router.post(
    '/sendPasswordResetEmail',
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    sendPasswordResetEmailCtr
);


// change User password
router.post(
    '/changePassword',
    authMiddleware,
    changePasswordCtr
);



router.post(
    '/resendEmailVerificationToken',
    resendEmailVerificationTokenCtr
);

// reset password
router.post(
    '/resetPassword',
    [
        body('password').trim()
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
        .isLength({ min: 6}).not().isEmpty(),
        
        body('confirmPassword').trim()
        .matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]+$/)
        .isLength({ min: 6}).not().isEmpty(),

        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    ],
    resetPasswordCtr
);

// // verification for auto login
// router.post(
//     '/verify',
//     authMiddleware,
//     async (req, res) => {
//         return res.status(200).json({
//             message: "Authenticated Successfully!",
//             statusCode: 200,
//             token: req.body
//         });
//     }
// );

export default router;