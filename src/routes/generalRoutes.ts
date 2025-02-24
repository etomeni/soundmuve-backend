import express from 'express';
import { body, param, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';
import { upload_diskStorage } from '@/middleware/multerFile.js';

// Controllers
import { 
    getActivePromotionsAdsCtrl,
    editArtistProfileCtrl,
    editRlProfileCtrl,
    sendEmailUpdateOtpCodeCtrl,
    resendEmailUpdateOtpCodeCtrl,
    verifyEmailUpdateCodeCtr,
    // deleteCodeCtr, deleteReleasesAndFilesCtr
} from '@/controllers/generalController.js';

router.use(bodyParser.json());


// /promotions
router.get(
    "/promotions",
    [
        routeValidationResult,
        authMiddleware,
    ],
    getActivePromotionsAdsCtrl
);

// /artistProfile/edit/:user_id
router.patch(
    "/artistProfile/edit/:user_id",
    [
        body('firstName').isString()
            .trim().notEmpty()
            .withMessage('First name is required'),

        body('lastName').isString()
            .trim().notEmpty()
            .withMessage('Last name is required'),

        body('phoneNumber').isString()
            .trim().notEmpty()
            .withMessage('Phone number is required'),

        body('country').isString()
            .trim().notEmpty()
            .withMessage('Country is required'),

        body('gender').isString()
            .trim().notEmpty()
            .withMessage('Gender is required'),

        body('artistName').isString()
            .trim().notEmpty()
            .withMessage('Artist name is required'),

        routeValidationResult,
        authMiddleware,
    ],
    editArtistProfileCtrl
);

// /rlProfile/edit/:user_id
router.patch(
    "/rlProfile/edit/:user_id",
    [
        upload_diskStorage.fields([{ name: 'recordLabelLogo', maxCount: 1 }]),
        
        body('firstName').isString()
            .trim().notEmpty()
            .withMessage('First name is required'),

        body('lastName').isString()
            .trim().notEmpty()
            .withMessage('Last name is required'),

        body('phoneNumber').isString()
            .trim().notEmpty()
            .withMessage('Phone number is required'),

        body('country').isString()
            .trim().notEmpty()
            .withMessage('Country is required'),

        body('recordLabelName').isString()
            .trim().notEmpty()
            .withMessage('Record label name is required'),

        routeValidationResult,
        authMiddleware,
    ],
    editRlProfileCtrl
);

// /profile/sendEmailUpdateCode/:user_id
router.post(
    "/profile/sendEmailUpdateCode/:user_id",
    [
        body('email').isString()
            .trim().notEmpty().isEmail()
            .withMessage('New email address is required'),

        body('password').isString()
            .trim().notEmpty()
            .withMessage('current password is required'),

        param('user_id').isString()
            .trim().notEmpty()
            .withMessage('user id is required'),

        routeValidationResult,
        authMiddleware,
    ],
    sendEmailUpdateOtpCodeCtrl
);

// /profile/resendEmailUpdateCode/:user_id
router.post(
    "/profile/resendEmailUpdateCode/:user_id",
    [
        body('email').isString()
            .trim().notEmpty()
            .withMessage('New email address is required'),

        param('user_id').isString()
            .trim().notEmpty()
            .withMessage('user id is required'),


        routeValidationResult,
        authMiddleware,
    ],
    resendEmailUpdateOtpCodeCtrl
);

// /profile/verifyEmailUpdateCode/:user_id
router.post(
    "/profile/verifyEmailUpdateCode/:user_id",
    [
        body('email').isString()
            .trim().notEmpty()
            .withMessage('New email address is required'),

        body('code').isString()
            .trim().notEmpty()
            .withMessage('Code is required'),

        body('token').isString()
            .trim().notEmpty()
            .withMessage('Token is required'),

        param('user_id').isString()
            .trim().notEmpty()
            .withMessage('user id is required'),

        routeValidationResult,
        authMiddleware,
    ],
    verifyEmailUpdateCodeCtr
);

// deletes everything.
// router.delete(
//     "/deleteC",
//     [],
//     deleteReleasesAndFilesCtr
// );

export default router;
