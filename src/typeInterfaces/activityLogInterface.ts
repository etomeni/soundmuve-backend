import { userLocationInterface } from "./users.interface.js";

export type activityLogInterface = {
    user_id: string;
    action: string;
    location: userLocationInterface;
    browserDetails: {
        browserName: string;
        browserVersion: string;
        osName: string;
        osVersion: string;
        device: { 
            type: string;
            vendor: string;
            model: string;
        }
    };

    metadata: {
        ip: string;
        method: string;
        params: any;
        query: any;
        body: any;
    };
}