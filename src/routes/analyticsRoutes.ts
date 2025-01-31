import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getSalesreportAnalyticsCtrl,
    getSongAnalyticsCtrl,
    getAlbumAnalyticsCtrl
} from '@/controllers/analyticsController.js';

router.use(bodyParser.json());

// get-salesreport-analytics
router.get(
    "/get-salesreport-analytics",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        // query('page')
        //     .exists().withMessage('Page is required')
        //     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        // query('limit')
        //     .exists().withMessage('Limit is required')
        //     .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        authMiddleware,
    ],
    getSalesreportAnalyticsCtrl
);

// get-song-analytics
router.get(
    "/get-song-analytics",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        query('songId')
            .isString().trim().notEmpty()
            .withMessage('songId is required.'),

        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        routeValidationResult,
        authMiddleware,
    ],
    getSongAnalyticsCtrl
);

// get-album-analytics
router.get(
    "/get-album-analytics",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        routeValidationResult,
        authMiddleware,
    ],
    getAlbumAnalyticsCtrl
);


/*
    This routes are for admin view of each user analytics.
*/

// get-salesreport-analytics
router.get(
    "/get-salesreport-analytics/:user_id",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        // query('page')
        //     .exists().withMessage('Page is required')
        //     .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        // query('limit')
        //     .exists().withMessage('Limit is required')
        //     .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        routeValidationResult,
        authMiddleware,
    ],
    getSalesreportAnalyticsCtrl
);

// get-song-analytics
router.get(
    "/get-song-analytics/:user_id",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        query('songId')
            .isString().trim().notEmpty()
            .withMessage('songId is required.'),

        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        routeValidationResult,
        authMiddleware,
    ],
    getSongAnalyticsCtrl
);

// get-album-analytics
router.get(
    "/get-album-analytics/:user_id",
    [
        query('startDate')
            .isString().trim().notEmpty()
            .withMessage('startDate is required.'),

        query('endDate')
            .isString().trim().notEmpty()
            .withMessage('endDate is required.'),

        query('release_id')
            .isString().trim().notEmpty()
            .withMessage('release_id is required.'),

        routeValidationResult,
        authMiddleware,
    ],
    getAlbumAnalyticsCtrl
);


export default router;
