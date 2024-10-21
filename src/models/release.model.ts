import mongoose, { Schema } from 'mongoose';

import { releaseInterface, songInterface } from '@/typeInterfaces/release.interface.js';


// Artist Interface Schema
const ArtistSchema = {
    name: { type: String, required: true },
    id: { type: String, required: true },
    profilePicture: { type: String, required: true },
    latestAlbum: {
        name: { type: String },
        releaseDate: { type: String },
        externalUrl: { type: String },
    }
};

// Song Creatives Interface Schema
const SongArtistsCreativesSchema = {
    name: { type: String, required: true },
    role: { type: String, required: true },
    artist: { type: ArtistSchema }, // Reference artist schema
};

// Song Interface Schema
const SongSchema = new Schema<songInterface>({
    songAudio: { type: String, required: true },
    songTitle: { type: String, required: true },
    songWriters: [{ type: String, required: true }],
    songArtists_Creatives: [SongArtistsCreativesSchema],
    copyrightOwnership: {
        coverVersion: { type: String, enum: ['Yes', 'No'], required: true },
        permissions: { type: String, enum: ['Yes', 'No'] },
    },
    explicitLyrics: { type: String, enum: ['Yes', 'No'], required: true },
    isrcNumber: { type: String, required: true },
    lyricsLanguage: { type: String, required: true },
    lyrics: { type: String },
    tikTokClipStartTime: {
        minutes: { type: String },
        seconds: { type: String },
    },
});

// Release Interface Schema
const releaseSchema = new Schema<releaseInterface>({
    user_id: { type: String, required: true },
    email: { type: String, required: true },
    recordLabelArtist_id: { type: String },
    releaseType: { type: String, enum: ['single', 'album'], required: true },

    title: { type: String, required: true }, // √
    mainArtist: { // √
        spotifyProfile: { type: ArtistSchema, required: true },
        appleMusicProfile: { type: Schema.Types.Mixed },
    },
    language: { type: String, required: true }, // √
    primaryGenre: { type: String, required: true }, // √
    secondaryGenre: { type: String, required: true }, // √
    releaseDate: { type: String, required: true }, // √
    spotifyReleaseTime: { // √
        hours: { type: String, required: true },
        minutes: { type: String, required: true },
        am_pm: { type: String, enum: ['AM', 'PM'], required: true },
    },
    spotifyReleaseTimezone: { type: String, required: true }, // √

    labelName: { type: String },
    recordingLocation: { type: String },
    soldCountries: {
        worldwide: { type: String, enum: ['Yes', 'No'] },
        countries: [{ type: String }],
    },
    upc_ean: { type: String },
    // stores: [{ type: String, required: true }],
    stores: [{ type: String }],
    socialPlatforms: [{ type: String }],
    singleSong: { type: SongSchema },
    albumSongs: { type: [SongSchema] },
    coverArt: { type: String },

    status: { 
        type: String, 
        enum: ["Live", "Pending", "Incomplete", "Complete", "Failed"],
        default: "Incomplete",
        required: true
    },
    liveUrl: { type: String },

}, { timestamps: true });

// Mongoose Models
export const releaseModel = mongoose.model("Release", releaseSchema);
