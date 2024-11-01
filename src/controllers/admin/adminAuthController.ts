import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import Jwt from "jsonwebtoken";

// models
import { userModel } from '../../models/users.model.js';

// utilities
import { sendLoginNotification } from "@/util/mail.js";


const secretForToken = process.env.JWT_SECRET;


export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Incorrect email or password!', 
                errors
            });
        };

        const email = req.body.email;
        const sentPassword = req.body.password;
        const location = req.body.location;

        // check if the user exist in the database
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "A user with this email could not be found!"
            });
        }

        // checks if the user is an admin
        if (user.role == "user") {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Access denied! You don't have permission to access this pages."
            });
        }


        // check if password is correct
        const isPassEqual = await bcryptjs.compare(sentPassword, user.password);
        if (!isPassEqual) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "Incorrect email or password!"
            });
        }

        // check if the account is still active.
        if (user.status == false) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "This account has been disabled, if you believe this is a mistake please contact support to resolve."
            });
        };

        // if loggined from a different IP send a mail notififying 
        // that a login from a different IP was detected.
        if (user.location.ip != location.ip && !user.location.usedIps.includes(location.ip)) {
            sendLoginNotification(user.email, `${user.firstName} ${user.lastName}`, location);

            // update the new ip address
            const newLocation = {
                ...user.location,
                ...location,
                usedIps: [
                    location.ip,
                    ...user.location.usedIps,
                ]
            }
            user.location = newLocation;
            await user.save();
        }


        const token = Jwt.sign(
            {
                email: user.email,
                _id: user._id,
                role: user.role,
            },
            `${secretForToken}`,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Login successful',
            token: token,
            result: user, 
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const reValidateUserAuthCtrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // const email = req.body.authMiddlewareParam.email;
        const _id = req.body.authMiddlewareParam._id;

        if (!_id) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "user id cannot not be resolved, try login again."
            });
        }

        // check if the user exist in the database
        const user = await userModel.findById(_id);
        if (!user) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "A user with this email could not be found!"
            });
        }

        // check if the account is still active.
        if (user.status == false) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "This account has been disabled, if you believe this is a mistake please contact support to resolve."
            });
        };

        // get a new access token
        const newAccessToken = Jwt.sign(
            {
                email: user.email,
                _id: user._id,
                role: user.role
            },
            `${secretForToken}`,
            { expiresIn: '7d' }
        );
        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            newToken: newAccessToken,
            result: user, 
            message: 'success!',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
