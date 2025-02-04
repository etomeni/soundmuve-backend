import { Request, Response, NextFunction } from "express-serve-static-core";
import { validationResult } from "express-validator";


export default async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Data Validation Error!', 
                ...errors,
            });
        };

        next();
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        error.message = "Sent data validation error.";
        next(error);
    }
}