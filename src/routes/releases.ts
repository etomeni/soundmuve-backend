import express from 'express';
import { body  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
// import authMiddleware from '../middleware/auth.js';
import authMiddleware from '@/middleware/auth.js';

// Controllers
import { 
    createSingleReleaseCtrl,
    updateCreateSingleReleaseCtrl,
} from '@/controllers/releaseController.js';
import { upload_diskStorage } from '@/middleware/multerFile.js';

router.use(bodyParser.json());


// Validation for artistInterface
const validateArtist = [
    // Validate name (required, must be a string)
    body('mainArtist.spotifyProfile.name')
        .isString()
        .notEmpty()
        .withMessage('Artist name is required and must be a string.'),

    // Validate id (required, must be a string)
    body('mainArtist.spotifyProfile.id')
        .isString()
        .notEmpty()
        .withMessage('Artist ID is required and must be a string.'),

    // Validate profilePicture (required, must be a string)
    body('mainArtist.spotifyProfile.profilePicture')
        .isString()
        .notEmpty()
        .withMessage('Profile picture URL is required and must be a string.'),

    // Validate latestAlbum (optional)
    body('mainArtist.spotifyProfile.latestAlbum.name')
        .optional()
        .isString()
        .withMessage('Latest album name must be a string.'),

    body('mainArtist.spotifyProfile.latestAlbum.releaseDate')
        .optional()
        .isString()
        .withMessage('Latest album release date must be a string.'),

    body('mainArtist.spotifyProfile.latestAlbum.externalUrl')
        .optional()
        .isString()
        .withMessage('Latest album external URL must be a string.'),
];

router.put(
    "/single/create",
    [
        body('release_id')
            .optional()
            .isString().trim(),

        // Validate title (required, must be a string)
        body('title')
            .isString().trim()
            .notEmpty()
            .withMessage('Title is required and must be a string.'),

        // Validate mainArtist (nested object validation for artistInterface)
        ...validateArtist,

        // Validate language (required, must be a string)
        body('language')
            .isString().trim()
            .notEmpty()
            .withMessage('Language is required and must be a string.'),

        // Validate primaryGenre (required, must be a string)
        body('primaryGenre')
            .isString().trim()
            .notEmpty()
            .withMessage('Primary genre is required and must be a string.'),

        // Validate secondaryGenre (required, must be a string)
        body('secondaryGenre')
            .isString().trim()
            .notEmpty()
            .withMessage('Secondary genre is required and must be a string.'),

        // Validate releaseDate (required, must be a string)
        body('releaseDate')
            .isString().trim()
            .notEmpty()
            .withMessage('Release date is required and must be a string.'),

        // Validate spotifyReleaseTime (nested object validation)
        body('spotifyReleaseTime.hours')
            .isString().trim()
            .notEmpty()
            .withMessage('Spotify release hours are required and must be a string.'),
        body('spotifyReleaseTime.minutes')
            .isString().trim()
            .notEmpty()
            .withMessage('Spotify release minutes are required and must be a string.'),
        body('spotifyReleaseTime.am_pm')
            .isIn(['AM', 'PM'])
            .withMessage('Spotify release time AM/PM must be either "AM" or "PM".'),

        // Validate spotifyReleaseTimezone (required, must be a string)
        body('spotifyReleaseTimezone')
            .isString().trim()
            .notEmpty()
            .withMessage('Spotify release timezone is required and must be a string.'),

        // Validate labelName (optional, must be a string if provided)
        body('labelName')
            .optional()
            .isString().trim()
            .withMessage('Label name must be a string if provided.'),

        // Validate recordingLocation (optional, must be a string if provided)
        body('recordingLocation')
            .optional()
            .isString().trim()
            .withMessage('Recording location must be a string if provided.'),

        // Validate soldCountries (nested object validation)
        body('soldCountries.worldwide')
            .isIn(['Yes', 'No'])
            .withMessage('Worldwide must be either "Yes" or "No".'),

        body('soldCountries.countries')
            .if(body('soldCountries.worldwide').equals('No'))
            .isArray()
            .withMessage('Countries must be an array of strings if worldwide is "No".')
            .custom((arr) => arr.every((country: string) => typeof country === 'string'))
            .withMessage('Each country must be a string.'),

        // Validate upc_ean (optional, must be a string if provided)
        body('upc_ean')
            .optional()
            .isString().trim()
            .withMessage('UPC/EAN must be a string if provided.'),

        authMiddleware,
    ],
    createSingleReleaseCtrl
);

router.patch(
    "/single/create-update",
    [
        // validate the release _id to update
        // body('release_id') 
        //     .isString().trim()
        //     .notEmpty()
        //     .withMessage('release _id is required.'),

        // // Validate stores (required, array of strings)
        // body('stores')
        //     .isString().trim()
        //     .notEmpty()
        //     .withMessage('stores is required.'),

        // // Validate socialPlatforms (required, array of strings)
        // body('socialPlatforms')
        //     .isString().trim()
        //     .notEmpty()
        //     .withMessage('social platforms is required.'),

        // Validate singleSong (object validation for songInterface)
        // ...validateSong,
        // _upload_.fields([{ name: 'coverArt' }, { name: 'songAudio' }]),
        // upload_diskStorage.fields([{ name: 'coverArt', maxCount: 1 }, { name: 'songAudio', maxCount: 1 }]),
        // upload_diskStorage.single("songAudio"),
        // upload_memoryStorage.single("songAudio"),
        // upload.single("songAudio"),

        upload_diskStorage.fields([{ name: 'songAudio', maxCount: 1 }, { name: 'coverArt', maxCount: 1 }]),
        authMiddleware,
    ],
    updateCreateSingleReleaseCtrl
);

export default router;
