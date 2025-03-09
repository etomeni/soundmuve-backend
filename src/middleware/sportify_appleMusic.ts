import { Request, Response, NextFunction } from "express-serve-static-core";
import NodeCache from 'node-cache';
import axios from "axios";
import qs from "qs";
import fs from "fs";
import Jwt from "jsonwebtoken";


const tokenCache = new NodeCache({ stdTTL: 7200 }); // 7200 seconds = 2 hours

let spotifyAccessToken = '';
let spotifyTokenExpirationTime = 0;

let appleMusicAccessToken = '';
let appleMusicTokenExpirationTime = 0;

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

                // tokenCache.set('spotifyAccessToken', response.access_token);
                // tokenCache.set('spotifyTokenExpirationTime', spotifyTokenExpirationTime);
                
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

// Middleware to generate and store apple music access token
export async function getAppleMusicAccessToken(req: Request, res: Response, next: NextFunction) {
    const cachedToken = tokenCache.get('appleMusicAccessToken');
    const cachedTokenTokenExpirationTime = tokenCache.get('appleMusicTokenExpirationTime');
    if (cachedToken) {
        appleMusicAccessToken = cachedToken.toString();
        appleMusicTokenExpirationTime = Number(cachedTokenTokenExpirationTime || 0);

        // req.accessToken = accessToken;
        req.body.appleMusic = {
            access_token: cachedToken,
            expirationTime: cachedTokenTokenExpirationTime
        }

        return next();
    }

    if (!appleMusicAccessToken || !appleMusicTokenExpirationTime || Date.now() >= appleMusicTokenExpirationTime) {
        try {
            // Generate apple music Token
            const private_key = fs.readFileSync('./uploads/AppleMusic_AuthKey.p8').toString(); 
            // console.log(private_key);
            const team_id = process.env.APPLE_MUSIC_KEY_TEAM_ID; 
            const key_id = process.env.APPLE_MUSIC_KEY_ID; 

            const token = Jwt.sign({}, private_key, {
                algorithm: 'ES256',
                expiresIn: '180d',
                issuer: team_id,
                keyid: key_id,
                header: {
                    alg: 'ES256',
                    kid: key_id
                }
            });

            // console.log(token);
            if (token) tokenCache.set("appleMusicAccessToken", token);

            const expiresDayInSec = 160 * 24 * 60 * 60; // convert the expiring day (160) to seconds;
            const expiresIn = Date.now() + (expiresDayInSec * 1000);
            if (expiresIn) tokenCache.set("appleMusicTokenExpirationTime", expiresIn);

            req.body.appleMusic = {
                access_token: token,
                expirationTime: expiresIn,
            }

            return next();
        } catch (error: any) {
            console.log(error);
            
            appleMusicAccessToken = '';
            appleMusicTokenExpirationTime = 0;

            return res.status(500).json({
                message: "Unable to get apple music access token",
                status: false,
                statusCode: 500,
                error
            });
        }
    } else {
        req.body.appleMusic = {
            access_token: appleMusicAccessToken,
            expirationTime: appleMusicTokenExpirationTime
        }

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
