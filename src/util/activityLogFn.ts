import { Request } from "express-serve-static-core";
// import { Request, Response, NextFunction } from "express-serve-static-core";

import { UAParser } from 'ua-parser-js';

import { activityLogModel } from "@/models/activityLog.model.js";
import { getUserLocation } from "./userLocation.js";
import { activityLogInterface } from "@/typeInterfaces/activityLogInterface.js";
// import cron from 'node-cron'; // Import node-cron

export async function logActivity( req: Request, action: string, user_id: string ) {
    try {
        const location = await getUserLocation(req);

        const userAgent = req.headers['user-agent'] || 'Unknown';
        const parser = new UAParser(userAgent);  // Set the User-Agent string
        // parser.setUA(userAgent); // Set the User-Agent string
        const browser = parser.getBrowser(); // Extracts browser name and version
        const os = parser.getOS(); // Extracts OS name and version
        const device = parser.getDevice(); // Extracts OS name and version

        // Attach browser and OS details to the request object
        const browserDetails = {
            browserName: browser.name || 'Unknown',
            browserVersion: browser.version || 'Unknown',
            osName: os.name || 'Unknown',
            osVersion: os.version || 'Unknown',
            device: { 
                type: device.type || 'Unknown', 
                vendor: device.vendor || 'Unknown', 
                model: device.model || 'Unknown'
            }
        };
      

        const data2db: activityLogInterface = {
            user_id: user_id || location.ip, 
            action: action || req.route.path, // Route path as the activity action
            location, 

            browserDetails,

            metadata: {
                ip: location.ip,
                method: req.method,
                params: req.params,
                query: req.query,
                body: req.body,
            }
        };

        // Log the activity
        await activityLogModel.create(data2db);
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// Function to clean up logs older than 3 months
export async function cleanUpOldActivityLogs() {
    try {
        // Calculate the date 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Delete logs older than 3 months
        const result = await activityLogModel.deleteMany({
            createdAt: { $lt: threeMonthsAgo }, // Use `createdAt` provided by timestamps
        });

        console.log(`Deleted ${result.deletedCount} old activity logs.`);
    } catch (error) {
        console.error('Error cleaning up old activity logs:', error);
    }
}


export async function activityLogCleanUpCronJob() {
    // Schedule cron task (runs daily at midnight)
    // cron.schedule('0 0 * * *', async () => {
    //     console.log('Running scheduled activity log cleanup...');
    //     await cleanUpOldActivityLogs();
    // });
}

