import { Request, Response, NextFunction } from "express-serve-static-core";
import Jwt  from "jsonwebtoken";


export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.get('Authorization');
    
        if (!authHeader) {
            // const error = new Error("Not authenticated!");
    
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Not authenticated! Please login and try again.",
            });
        }
    
        const token = authHeader.split(' ')[1];
        let  decodedToken: any;
        try {
            const secretForToken = process.env.JWT_SECRET;

            decodedToken = Jwt.verify(token, `${secretForToken}`)
        } catch (error: any) {
            error.statusCode = 500;
            error.message = "wrong authentication token";
    
            return res.status(500).json({
                status: false,
                message: error.message,
                statusCode: error.statusCode,
                error
            });
        }
    
        if (!decodedToken) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Not authenticated! unable to verify user authtentication token.",
            });
        }
    

        req.body.authMiddlewareParam = {
            isLoggedin: true,
            email: decodedToken.email,
            _id: decodedToken._id
        };
    
        next();
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}