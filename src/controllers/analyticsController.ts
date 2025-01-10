import { Request, Response, NextFunction } from "express-serve-static-core";

import { releaseModel } from "@/models/release.model.js";
// import { userModel } from '@/models/users.model.js';
import { analyticsModel } from "@/models/analytics.model.js";
// import { transactionModel } from "@/models/transaction.model.js";

import { _getSpotifyAccessTokenFunc } from "@/middleware/sportify_appleMusic.js";

// import { songInterface } from "@/typeInterfaces/release.interface.js";
// import { withdrawExchangeInterface } from "@/typeInterfaces/transaction.interface.js";
// import { payoutDetailsInterface } from "@/typeInterfaces/payout.interface.js";
import { albumAndSinglesAnalyticsInterface, analyticsInterface, releaseAnalyticsInterface } from "@/typeInterfaces/analytics.interface.js";
// import { logActivity } from "@/util/activityLogFn.js";



// Get sales report analytics
export const getSalesreportAnalyticsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;
        
        // expected date formate is YYYY-MM-DD
        const startDate: any = req.query.startDate; // YYYY-MM-DD
        const endDate: any = req.query.endDate; // YYYY-MM-DD

        // analytics is stored in a monthly order so the sort 
        // begins at the begining the 1st day of the month
        const [startYear, startMonth, startDay] = startDate.split("-");
        // const [endYear, endMonth, endDay] = endDate.split("-");

        const startDateObject = new Date(`${startYear}-${startMonth}-01`);
        // const endDateObject = new Date(`${endYear}-${endMonth}-01`);
        const endDateObject = new Date(endDate);

        const filter = {
            user_id,
            // user_email,
            date: { $gte: startDateObject, $lte: endDateObject },
        };

        // Fetch analytics records in the date range
        // const analyticsResults = await analyticsModel.find({}, { date: 1 })
        const analyticsResults = await analyticsModel.find(filter)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();

        // console.log(analyticsResults);

        if (!analyticsResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get transactions."
            });
        }

        // Calculate totals earnings
        const totalsEarnings = analyticsResults.reduce(
            (acc, record) => {
                acc.albumSold += record.albumSold || 0;
                acc.noSold += record.noSold || 0;
                acc.revenue += record.revenue || 0;
                acc.streamRevenue += record.streamRevenue || 0;
                acc.streamPlay += record.streamPlay || 0;
                return acc;
            },
            { albumSold: 0, noSold: 0, revenue: 0, streamRevenue: 0, streamPlay: 0 }
        );

        const albumAndSinglesData = await getAlbumSinglesData(analyticsResults);
        const albumRelease = albumAndSinglesData.albumRelease;
        const singlesRelease = albumAndSinglesData.singlesRelease;

        // const albumRelease = getAlbum_SinglesData(analyticsResults).albumRelease;
        // const singlesRelease = getAlbum_SinglesData(analyticsResults).singlesRelease;


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                // data: transactionResults,
                totalsEarnings: {
                    ...totalsEarnings,
                    totalAlbums: albumRelease.length,
                    totalSingles: singlesRelease.length
                },
                // salesReportSingles: singlesRelease, // rework on it
                // salesReportAlbums: albumRelease, // rework on it
                salesReportSingles: singlesRelease, // rework on it
                salesReportAlbums: albumRelease, // rework on it
                // salesReportLocation: locationData,
                salesReportLocation: getLocationData(analyticsResults),
                salesReportMonths: analyticsResults
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

async function getAlbumSinglesData(analytics: analyticsInterface[]) {
    const albumReleaseAnalytics: releaseAnalyticsInterface[] = [];
    const singlesReleaseAnalytics: releaseAnalyticsInterface[] = [];
    // separate Album and Singles releases 

    const artistsWithReleases = await Promise.all(
        analytics.map(async (element) => {
            const releaseResults = await releaseModel.findById(element.release_id).lean();
            if (releaseResults) {
                if (releaseResults.releaseType == "album") {
                    // albumRelease += 1;
    
                    const newData = {
                        ...element,
    
                        release: {
                            title: releaseResults.title,
                            releaseType: releaseResults.releaseType,
                            mainArtist: releaseResults.mainArtist.spotifyProfile.name,
                            releaseDate: releaseResults.releaseDate,
                            labelName: releaseResults.labelName,
                            coverArt: releaseResults.coverArt,
                        },
                    };
                    albumReleaseAnalytics.push(newData);
                } else if (releaseResults.releaseType == "single") {
                    // singlesRelease++;
    
                    const newData = {
                        ...element,
    
                        release: {
                            title: releaseResults.title,
                            releaseType: releaseResults.releaseType,
                            mainArtist: releaseResults.mainArtist.spotifyProfile.name,
                            releaseDate: releaseResults.releaseDate,
                            labelName: releaseResults.labelName,
                            coverArt: releaseResults.coverArt,
                        },
                    };
                    singlesReleaseAnalytics.push(newData);
                } else {
    
                }
            }
        })
    );

    const groupAnalyticsById = (releaseAnalytics: releaseAnalyticsInterface[]) => {
        // Group the results by release_id and calculate totals
        const groupedData = releaseAnalytics.reduce((acc: any, record) => {
            const releaseId = record.release_id;
    
            if (!acc[releaseId]) {
                acc[releaseId] = {
                    release_id: releaseId,
                    totalAlbumSold: 0,
                    totalNoSold: 0,
                    totalRevenue: 0,
                    totalStreamRevenue: 0,
                    totalStreamPlay: 0,
                    ...record.release
                };
            }
    
            acc[releaseId].totalAlbumSold += record.albumSold || 0;
            acc[releaseId].totalNoSold += record.noSold || 0;
            acc[releaseId].totalRevenue += record.revenue || 0;
            acc[releaseId].totalStreamRevenue += record.streamRevenue || 0;
            acc[releaseId].totalStreamPlay += record.streamPlay || 0;
    
            return acc;
        }, {});
    
        // Convert the grouped data object into an array
        const groupedArray: albumAndSinglesAnalyticsInterface[] = Object.values(groupedData);

        return groupedArray;
    }

    return {
        albumRelease: groupAnalyticsById(albumReleaseAnalytics),
        singlesRelease: groupAnalyticsById(singlesReleaseAnalytics)
    };
}

function getAlbum_SinglesData(analytics: analyticsInterface[]) {
    // Extract unique 'release_id' values
    const uniqueReleaseIds = [
        ...new Set(analytics.map(record => record.release_id))
    ];

    const albumRelease: any = [];
    const singlesRelease: any = [];
    // calculate the total number of Album and Singles releases
    uniqueReleaseIds.forEach(async element => {
        const releaseResults = await releaseModel.findById(element).lean();
        if (releaseResults) {
            if (releaseResults.releaseType == "album") {
                // albumRelease += 1;
                albumRelease.push(releaseResults);
            } else if (releaseResults.releaseType == "single") {
                // singlesRelease++;
                singlesRelease.push(releaseResults);
            } else {

            }
        }
    });

    return {
        albumRelease, 
        singlesRelease
    };
}

function getLocationData(analytics: analyticsInterface[]) {
    // Process and group location data by country
    const countryTotals: any = {};

    analytics.forEach(record => {
        if (record.location && record.location.length > 0) {
            record.location.forEach(loc => {
                const { country, albumSold, noSold, revenue, streamRevenue, streamPlay } = loc;

                if (!countryTotals[country]) {
                    countryTotals[country] = {
                        country,
                        albumSold: 0,
                        noSold: 0,
                        revenue: 0,
                        streamRevenue: 0,
                        streamPlay: 0,
                    };
                }

                countryTotals[country].albumSold += albumSold || 0;
                countryTotals[country].noSold += noSold || 0;
                countryTotals[country].revenue += revenue || 0;
                countryTotals[country].streamRevenue += streamRevenue || 0;
                countryTotals[country].streamPlay += streamPlay || 0;
            });
        }
    });

    // Convert the grouped object into an array
    const locationData = Object.values(countryTotals);

    return locationData;
}


// Get song analytics
export const getSongAnalyticsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;
        
        // expected date formate is YYYY-MM-DD
        const startDate: any = req.query.startDate; // YYYY-MM-DD
        const endDate: any = req.query.endDate; // YYYY-MM-DD
        const release_id: any = req.query.release_id;
        const songId: any = req.query.songId;


        const releaseResults = await releaseModel.findById(release_id)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();

        if (!releaseResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "incorrect release_id."
            });
        }

        const releaseSongs = releaseResults.songs.find((value) => value._id == songId);


        // analytics is stored in a monthly order so the sort 
        // begins at the begining the 1st day of the month
        const [startYear, startMonth, startDay] = startDate.split("-");
        // const [endYear, endMonth, endDay] = endDate.split("-");

        const startDateObject = new Date(`${startYear}-${startMonth}-01`);
        // const endDateObject = new Date(`${endYear}-${endMonth}-01`);
        const endDateObject = new Date(endDate);

        const filter = {
            user_id,
            // user_email,

            // release_id: release_id,
            song_id: songId,
            date: { $gte: startDateObject, $lte: endDateObject },
        };

        // Fetch analytics records in the date range
        // const analyticsResults = await analyticsModel.find({}, { date: 1 })
        const analyticsResults = await analyticsModel.find(filter)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();

        if (!analyticsResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get analytics."
            });
        }

        // Calculate totals earnings
        const totalsEarnings = analyticsResults.reduce(
            (acc, record) => {
                acc.albumSold += record.albumSold || 0;
                acc.noSold += record.noSold || 0;
                acc.revenue += record.revenue || 0;
                acc.streamRevenue += record.streamRevenue || 0;
                acc.streamPlay += record.streamPlay || 0;
                return acc;
            },
            { albumSold: 0, noSold: 0, revenue: 0, streamRevenue: 0, streamPlay: 0 }
        );


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                totalsEarnings,
                release: releaseResults,
                song: releaseSongs,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

// Get album analytics
export const getAlbumAnalyticsCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user_id = req.body.authMiddlewareParam._id;
        // const user_email = req.body.authMiddlewareParam.email;
        
        // expected date formate is YYYY-MM-DD
        const startDate: any = req.query.startDate; // YYYY-MM-DD
        const endDate: any = req.query.endDate; // YYYY-MM-DD
        const release_id: any = req.query.release_id;

        const releaseResults = await releaseModel.findById(release_id)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();

        if (!releaseResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "incorrect release_id."
            });
        }

        // analytics is stored in a monthly order so the sort 
        // begins at the begining the 1st day of the month
        const [startYear, startMonth, startDay] = startDate.split("-");
        // const [endYear, endMonth, endDay] = endDate.split("-");

        const startDateObject = new Date(`${startYear}-${startMonth}-01`);
        // const endDateObject = new Date(`${endYear}-${endMonth}-01`);
        const endDateObject = new Date(endDate);

        const filter = {
            user_id,
            // user_email,

            release_id: release_id,
            // song_id: songId,
            date: { $gte: startDateObject, $lte: endDateObject },
        };

        // Fetch analytics records in the date range
        // const analyticsResults = await analyticsModel.find({}, { date: 1 })
        const analyticsResults = await analyticsModel.find(filter)
        .sort({ createdAt: -1 })  // Sort by createdAt in descending order
        .lean();

        if (!analyticsResults) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: "unable to get analytics."
            });
        }

        // Calculate totals earnings
        const totalsEarnings = analyticsResults.reduce(
            (acc, record) => {
                acc.albumSold += record.albumSold || 0;
                acc.noSold += record.noSold || 0;
                acc.revenue += record.revenue || 0;
                acc.streamRevenue += record.streamRevenue || 0;
                acc.streamPlay += record.streamPlay || 0;
                return acc;
            },
            { albumSold: 0, noSold: 0, revenue: 0, streamRevenue: 0, streamPlay: 0 }
        );


        // Response with paginated data
        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: {
                totalsEarnings,
                release: releaseResults,
            },
            message: "successful"
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}