import { Request } from "express-serve-static-core";
import axios from "axios";
import { userLocationInterface } from "@/typeInterfaces/users.interface.js";


const defaultUserLocation: userLocationInterface = {
    ip: "0.0.0.0",
    city: "unknown",
    region: "unknown",
    country: "unknown",
    isp: "unknown",
    lat: 0,
    lon: 0,
    // usedIps: ["0.0.0.0"]
};

export async function getUserLocation(req: Request) {
    // Get client's IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

    try {
        // Use ip-api for geolocation data (replace `YOUR_IP` with the client's IP)
        const response = (await axios.get(`http://ip-api.com/json/${clientIp}`)).data;

        if (response.query) {
            const location: userLocationInterface = {
                ip: response.query,
                city: response.city,
                region: response.regionName,
                country: response.country,
                isp: response.isp || response.org,
                lat: response.lat,
                lon: response.lon,
                // usedIps: [response.query]
            };
    
            return location;
        }

        return defaultUserLocation;
    } catch (error) {
        // console.log(error);

        const response = (await axios.get(`https://ipapi.co/${clientIp}/json/`)).data;
        if (response.ip) {
            const location: userLocationInterface = {
                ip: response.ip,
                city: response.city,
                region: response.region,
                country: response.country_name,
                isp: response.org || response.asn,
                lat: response.latitude,
                lon: response.longitude,
                // usedIps: [response.query]
            };
            return location;            
        }

        return defaultUserLocation;
    }
}

export async function getCountries() {
    try {
        const url = "https://restcountries.com/v3.1/all?fields=name,flags,idd";
        // const response: countryInterface[] = (await axios.get(`${url}`)).data;
        const response = (await axios.get(`${url}`)).data;
        // console.log(response);

        response.sort((a: any, b: any) => {
            if (a.name.common < b.name.common) return -1;
            if (a.name.common > b.name.common) return 1;
            return 0;
        });
        
        return response;
    } catch (error: any) {
        const errorResponse = error.response.data;
        console.log(errorResponse);
        // return [];
    }
}