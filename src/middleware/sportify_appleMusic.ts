import { Request, Response, NextFunction } from "express-serve-static-core";
import NodeCache from 'node-cache';
import axios from "axios";
import qs from "qs";

const tokenCache = new NodeCache({ stdTTL: 7200 }); // 7200 seconds = 2 hours

let spotifyAccessToken = '';
let spotifyTokenExpirationTime = 0;

// Middleware to get the stored Spotify access token or fetch a new one if expired
export async function getSpotifyAccessToken(req: Request, res: Response, next: NextFunction) {
    const cachedToken = tokenCache.get('spotifyAccessToken');
    const cachedTokenTokenExpirationTime = tokenCache.get('spotifyTokenExpirationTime');
    if (cachedToken) {
        spotifyAccessToken = cachedToken.toString();
        spotifyTokenExpirationTime = Number(cachedTokenTokenExpirationTime || 0);

        // req.accessToken = accessToken;
        req.body.spotify = {
            access_token: cachedToken,
            expirationTime: cachedTokenTokenExpirationTime
        }

        return next();
    }

    if (!spotifyAccessToken || !spotifyTokenExpirationTime || Date.now() >= spotifyTokenExpirationTime) {
        try {
            const tokenUrl = 'https://accounts.spotify.com/api/token';
            const body = qs.stringify({
                grant_type: 'client_credentials',
            });
        
            const response = (await axios.post(tokenUrl, body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
                },
            })).data;
    
            // return response.access_token;

            if (response.access_token ) {
                spotifyAccessToken = response.access_token;
                const expiresIn: number = response.expiresIn;
                
                spotifyTokenExpirationTime = Date.now() + (expiresIn * 1000); // expires_in is in seconds

                // req.accessToken = accessToken;
                req.body.spotify = {
                    access_token: response.access_token, 
                    expirationTime: spotifyTokenExpirationTime
                }

                return next();
            }

            spotifyAccessToken = '';
            spotifyTokenExpirationTime = 0;


            return res.status(402).json({
                message: response.message || "Unable to get access token",
                status: false,
                statusCode: 402,
            });

        } catch (error: any) {
            console.log(error);
            
            spotifyAccessToken = '';
            spotifyTokenExpirationTime = 0;

            return res.status(500).json({
                // message: error.response.message || "Unable to get access token",
                message: "Unable to get access token",
                status: false,
                statusCode: 500,
                error
            });
        }
    } else {
        req.body.spotify = {
            access_token: spotifyAccessToken,
            expirationTime: spotifyTokenExpirationTime
        }

        // next();
        return next();
    }
}



// Function to get Spotify access token
export const _getSpotifyAccessTokenFunc = async () => {
    try {
        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const body = qs.stringify({
            grant_type: 'client_credentials',
        });
    
        const response = (await axios.post(tokenUrl, body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
            },
        })).data;
    
        return response.access_token;
    } catch (error) {
        console.log(error);
        return ''
    }
};
