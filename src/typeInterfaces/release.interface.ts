export type artistInterface = {
    name: string,
    id: string,
    profilePicture: string,
    latestAlbum?: {
        name: string,
        releaseDate: string,
        externalUrl: string,
    }
}

interface songArtists_CreativesInterface {
    name: string,
    role: string,
    artist?: artistInterface
}

export type songInterface = {
    _id?: string,
    songAudio: string,
    songTitle: string, // not needed for singles or better still same as title for singles

    songWriters: string[],
    songArtists_Creatives: songArtists_CreativesInterface[]
    copyrightOwnership: {
        coverVersion: "Yes" | "No",
        permissions?: "Yes" | "No",
    },
    explicitLyrics: "Yes" | "No",

    isrcNumber: string,

    // language_of_lyrics: string,
    lyricsLanguage: string,
    lyrics: string // optional

    tikTokClipStartTime: {  // optional
        minutes: string,
        seconds: string,
    },
};


export type releaseInterface = {
    _id?: string,
    user_id: string,
    email: string,
    recordLabelArtist_id?: string,
    releaseType: "single" | "album",

    title: string,

    mainArtist: {
        spotifyProfile: artistInterface,
        appleMusicProfile: any
    },

    language: string,
    primaryGenre: string,
    secondaryGenre: string,

    releaseDate: string,
    spotifyReleaseTime: {
        hours: string,
        minutes: string,
        am_pm: "AM" | "PM"
    };
    spotifyReleaseTimezone: string;

    labelName: string, // optional
    recordingLocation: string, // optional 

    soldCountries: {
        worldwide: "Yes" | "No",
        countries: string[] // optional if worldwide is No
    },

    upc_ean: string, // optional
    preSave: boolean,

    stores: string[],
    socialPlatforms: string[],

    // singleSong?: songInterface,
    // albumSongs?: songInterface[],
    songs: songInterface[],

    coverArt: string,

    status: "Incomplete" | "Unpaid" | "Processing" |  "Pre-Saved" | "Live" | "Failed" | string,
    liveUrl?: string,
    musicLinks?: {
        code: string;
        url: string;
        dspLinks: {name: string; url: string;}[]
    },
    payment_id?: string,

    createdAt?: string;
    updatedAt?: string;
}
