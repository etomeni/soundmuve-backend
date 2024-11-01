import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// Models
// import { userModel } from '../models/users.model.js';

// Controllers
import { 
    loginController, 
} from '@/controllers/admin/adminAuthController.js';

// middleWares
// import authMiddleware from '@/middleware/auth.js';
// import { upload_diskStorage } from '@/middleware/multerFile.js';


router.use(bodyParser.json());


// Login
router.post(
    '/admin/login',
    [
        body('email').trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),

        body('password').trim().not().isEmpty()
    ],
    loginController
);


export default router;