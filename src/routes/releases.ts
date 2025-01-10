import express from 'express';
import { body, query  } from 'express-validator';
import bodyParser from 'body-parser';

const router = express.Router();

// middleWares
import authMiddleware from '@/middleware/auth.js';
import routeValidationResult from '@/middleware/routeValidationResult.js';

// Controllers
import { 
    createSingleReleaseCtrl,
    updateCreateSingleReleaseCtrl,
    getReleaseCtrl,
    
    createAlbumRelease1Ctrl,
    createAlbumRelease2Ctrl,
    createAlbumRelease3Ctrl,
    createAlbumRelease4Ctrl,
    createAlbumRelease4EditAlbumSongsCtrl,
    createAlbumRelease4DeleteAlbumSongsCtrl,
    createAlbumRelease5Ctrl,

    searchSpotifyArtistCtrl,
    getRL_ArtistReleasesCtrl,
    getRL_ArtistSongsDataCtrl
} from '@/controllers/releaseController.js';
import { upload_diskStorage } from '@/middleware/multerFile.js';
import { getSpotifyAccessToken } from '@/middleware/sportify_appleMusic.js';

router.use(bodyParser.json());


router.get(
    "/",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('releaseType')
            .exists().withMessage('Release type is required')
            .isIn(['single', 'album']).withMessage('Release type must be either "single" or "album"'),
    

        authMiddleware,
    ],
    getReleaseCtrl
);

router.get(
    "/rl-artist",
    [
        query('page')
            .exists().withMessage('Page is required')
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

        query('limit')
            .exists().withMessage('Limit is required')
            .isInt({ min: 1 }).withMessage('Limit must be a positive integer'),

        query('artist_id')
            .exists().withMessage('artist _id is required'),

        authMiddleware,
    ],
    getRL_ArtistReleasesCtrl
);

router.get(
    "/rl-artist-data",
    [
        query('artist_id')
            .exists().withMessage('artist _id is required'),

        routeValidationResult,
        authMiddleware,
    ],
    getRL_ArtistSongsDataCtrl
);

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

const validateRelease1 = [
    body('release_id')
        .optional()
        .isString().trim(),

    body('recordLabelArtist_id')
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
];

const validateRelease2 = [
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
];

// create SINGLES endpoints
router.put(
    "/single/create",
    [
        ...validateRelease1,
        ...validateRelease2,

        authMiddleware,
    ],
    createSingleReleaseCtrl
);

router.patch(
    "/single/create-update",
    [
        upload_diskStorage.fields([{ name: 'songAudio', maxCount: 1 }, { name: 'coverArt', maxCount: 1 }]),
        authMiddleware,
    ],
    updateCreateSingleReleaseCtrl
);



// create ALBUM endpoints
router.put(
    "/album/create-1",
    [
        ...validateRelease1,
        authMiddleware,
    ],
    createAlbumRelease1Ctrl
);

// create-update-2
router.patch(
    "/album/create-update-2",
    [
        body('release_id')
            .isString().trim()
            .withMessage('release _id is required.'),

        ...validateRelease2,
        authMiddleware,
    ],
    createAlbumRelease2Ctrl
);

// create-update-3
router.patch(
    "/album/create-update-3",
    [
        body('release_id')
            .isString().trim()
            .withMessage('release _id is required.'),

        // Validate stores (required, array of strings)
        body('stores')
            .isArray({ min: 1 })
            .withMessage('Stores must be an array of strings.')
            .custom((arr) => arr.every((store: string) => typeof store === 'string'))
            .withMessage('Each store must be a string.'),

        // Validate socialPlatforms (required, array of strings)
        body('socialPlatforms')
            .isArray({ min: 1 })
            .withMessage('Social platforms must be an array of strings.')
            .custom((arr) => arr.every((platform: string) => typeof platform === 'string'))
            .withMessage('Each social platform must be a string.'),

        authMiddleware,
    ],
    createAlbumRelease3Ctrl
);


// Add a song to the albumSongs array
// create-update-4
router.put(
    "/album/create-update-4",
    [
        upload_diskStorage.fields([{ name: 'songAudio', maxCount: 1 } ]),

        // body('release_id')
        //     .isString().trim()
        //     .withMessage('release _id is required.'),

        // ...validateArtist,
        authMiddleware,
    ],
    createAlbumRelease4Ctrl
);

// Edit a song in the albumSongs array
router.patch(
    "/album/create-update-4",
    [
        upload_diskStorage.fields([{ name: 'songAudio', maxCount: 1 } ]),

        // body('release_id')
        //     .isString().trim()
        //     .withMessage('release _id is required.'),

        // body('song_id')
        //     .isString().trim()
        //     .withMessage('song _id is required.'),

        // ...validateArtist,
        authMiddleware,
    ],
    createAlbumRelease4EditAlbumSongsCtrl
);

// Delete a song from the albumSongs array
router.delete(
    "/album/:releaseId/delete-song/:songId",
    [
        // body('release_id')
        //     .isString().trim()
        //     .withMessage('release _id is required.'),

        // body('song_id')
        //     .isString().trim()
        //     .withMessage('song _id is required.'),

        authMiddleware,
    ],
    createAlbumRelease4DeleteAlbumSongsCtrl
);

// save coverArt
router.patch(
    "/album/create-update-5",
    [
        upload_diskStorage.fields([{ name: 'coverArt', maxCount: 1 }]),
        // body('release_id')
        //     .isString().trim()
        //     .withMessage('release _id is required.'),

        authMiddleware,
    ],
    createAlbumRelease5Ctrl
);



// search 
router.get(
    "/search/spotify-artist",
    [
        query('artistName')
            .trim() // Remove leading/trailing spaces
            .notEmpty().withMessage('artistName is required') // Check if it's not empty
            .isLength({ min: 2 }).withMessage('artistName must be at least 2 characters long'), // Validate length

        authMiddleware,
        getSpotifyAccessToken,
    ],
    searchSpotifyArtistCtrl
);

export default router;
