import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';

// Controllers
import { 
    addArtistCtrl,
    getArtistCtrl,
    getAllArtistCtrl,
    searchArtistCtrl,
    getTotalRelease_ArtistCtrl,
} from '../controllers/recordLabelController.js';
import { upload_diskStorage } from '@/middleware/multerFile.js';


router.use(bodyParser.json());


// add an artist to a record label
router.post(
    "/add-artist",
    [
        upload_diskStorage.fields([{ name: 'artistAvatar', maxCount: 1 }]),
        authMiddleware,
    ],
    addArtistCtrl
);

// Get an artists under a record label
router.get(
    "/get-artist",
    [

        authMiddleware,
    ],
    getArtistCtrl
);

// Get all artists under a record label
router.get(
    "/get-all-artist",
    [
        // query('page').trim().not().isEmpty(),
        // query('limit').trim().not().isEmpty(),

        authMiddleware,
    ],
    getAllArtistCtrl
);

// Get paginated list of artists under a record label
router.get(
    "/total-release-n-artist",
    [
        authMiddleware,
    ],
    getTotalRelease_ArtistCtrl
);

// search artists under a record label
router.get(
    "/search-artist",
    [
        body('payout_id').trim().not().isEmpty(),

        authMiddleware,
    ],
    searchArtistCtrl
);

// // delete payout details
// router.delete(
//     "/setup/:payout_id",
//     [
//         authMiddleware,
//     ],
//     deletePayoutDetailsCtrl
// );


export default router;
