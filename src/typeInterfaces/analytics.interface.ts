export type locationAnalyticsInterface = {
    country: string,
    albumSold: string,
    singleSold: string,
    streamRevenue: string,
    streamPlay: string,
    revenue: string,
}

export type songAnalyticsInterface = {
    // _id: string,
    song_id: string,
    noSold: string,
    revenue: string,
    streamRevenue: string,
    streamPlay: string,

    location: locationAnalyticsInterface[],
}


export type analyticsInterface = {
    _id: string,
    
    user_id: string,
    user_email: string,

    release_id: string,
    
    albumSold: string,
    date: string, // month and year

    // songAnalytics: songAnalyticsInterface,

    song_id: string,
    noSold: string,
    revenue: string,
    streamRevenue: string,
    streamPlay: string,

    location: locationAnalyticsInterface[],

    status: "Pending" | "Processing" | "Success" | "Complete" | "Failed",

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
