export type songAnalyticsInterface = {
    // _id: string,
    song_id: string,
    noSold: string,
    revenue: string,
    streamRevenue: string,
    streamPlay: string,

    location: locationAnalyticsInterface[],
}

export type locationAnalyticsInterface = {
    country: string,
    albumSold: number,
    noSold: number,
    streamRevenue: number,
    streamPlay: number,
    revenue: number,
}

export type analyticsInterface = {
    _id: string,
    
    user_id: string,
    user_email: string,

    release_id: string,
    song_id: string,
    date: string, // month and year
    
    albumSold: number,
    noSold: number,
    revenue: number,
    streamRevenue: number,
    streamPlay: number,

    location: locationAnalyticsInterface[],

    status: "Pending" | "Processing" | "Success" | "Complete" | "Failed",

    updatedBy: {
        user_id: string,
        user_email: string,
        name: string
    },

    createdAt: string;
    updatedAt: string;
}


// date: string, // month and year
// revenue: string,
// no_sold: string,

// release: {
//     release_id: string,
//     title: string,
//     releaseType: "single" | "album",
//     mainArtist: {
//         name: string,
//         profilePicture: string,
//     },
//     coverArt: string,
// },

// user: {
//     user_id: string,
//     email: string,
//     firstName: string;
//     lastName: string;
//     userType: 'artist' | 'record label',
//     stageName: string,
// },
