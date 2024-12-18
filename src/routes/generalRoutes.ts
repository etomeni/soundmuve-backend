import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    getActivePromotionsAdsCtrl,
} from '@/controllers/generalController.js';

router.use(bodyParser.json());


router.get(
    "/promotions",
    [
        routeValidationResult,
        authMiddleware,
    ],
    getActivePromotionsAdsCtrl
);

export default router;
