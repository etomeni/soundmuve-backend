import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import Jwt from "jsonwebtoken";

// models
import { userModel } from '../../models/users.model.js';

// utilities
import { sendAccountBlockedNotificationMail, sendAdminRemovalNotificationMail, sendLoginNotification, sendNewAdminNotificationMail, sendNewAdminNotificationMailWithCredentials } from "@/util/mail.js";


const secretForToken = process.env.JWT_SECRET;


export const adminLoginController = async (req: Request, res: Response, next: NextFunction) => {
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



export const getAllAdminUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // Query to find users whose role is not "user"
        const nonUserRoles = await userModel.find({ role: { $ne: "user" } })
            .sort({ createdAt: -1 })  // Sort by createdAt in descending order
            .exec();
            
        if (!nonUserRoles) {
            return res.status(202).json({
                status: true,
                statusCode: 202,
                result: null, 
                message: "A user with this email could not be found!"
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'successful',
            result: nonUserRoles, 
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const getUserByEmailCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const email = req.query.email;

        // check if the user exist in the database
        const user = await userModel.findOne({email});
        if (!user) {
            return res.status(202).json({
                status: true,
                statusCode: 202,
                result: null, 
                message: "A user with this email could not be found!"
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'successful',
            result: user, 
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const addNewAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        const user_id = req.body.user_id;
        if (user_id) {
            // Check if user already exists and update only the role, 
            // else create a new user account
            const userExist = await userModel.findById(user_id);
            if (userExist) {
                const updatedUser = await userModel.findByIdAndUpdate(
                    user_id,
                    { role: req.body.newRole },
                    {
                        runValidators: true,
                        returnOriginal: false,
                    }
                );

                if (updatedUser) {
                    // Send a notification mail to the new admin
                    const mailRes = sendNewAdminNotificationMail(
                        updatedUser.email, `${updatedUser.firstName} ${updatedUser.lastName}`,
                        "https://soundmuve-superadmin.web.app/"
                    );
                    
                    return res.status(201).json({
                        status: true,
                        statusCode: 201,
                        result: updatedUser, 
                        message: 'User role updated successfully!'
                    });
                } else {
                    return res.status(500).json({
                        status: false,
                        statusCode: 500,
                        message: 'Unable to update user role.'
                    });
                }
            } else {
                return res.status(402).json({
                    status: false,
                    statusCode: 402,
                    message: 'Unable to update user role.'
                });
            }
            
        }

        // generate hashed password to keep the password secret always
        const hashedPassword = await bcryptjs.hash(req.body.password, 12);
        
        // save the registration details to the database
        const newUser = new userModel({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            // gender: req.body.gender,

            email: req.body.email,
            // phoneNumber: req.body.phoneNumber,
            // country: req.body.country,
            password: hashedPassword,
            status: true,
            role: req.body.newRole,
            // userType: "artist",
            balance: 0,
            // recordLabelName: "",
            // recordLabelLogo: "",
            // kyc: {
            //     isKycSubmitted: false,
            //     securityQuestions: []
            // },
            location: req.body.location || null,
        });
        const result = await newUser.save();
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error, try again after some time.'
            });
        }
        
        // Send a notification mail to the new admin
        const mailRes = sendNewAdminNotificationMailWithCredentials(
            result.email, `${result.firstName} ${result.lastName}`,
            req.body.password, "https://soundmuve-superadmin.web.app/"
        );
        // if (!mailRes.status) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: mailRes.message || "unable to send notification mail",
        //         error: mailRes.error
        //     });
        // }

        
        return res.status(201).json({
            status: true,
            statusCode: 201,
            // token,
            result: result, 
            message: 'Admin user registered successfully!'
        });

    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const blockRemoveAdminCtrl = async (req: Request, res: Response, next: NextFunction) => {
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

        // action: 'block' | 'remove', user_id: string

        const user_id = req.body.user_id;
        const action = req.body.action;

        let updateData: any = {};

        if (action == "block") {
            updateData = { 
                // role: req.body.newRole,
                status: false
            }
        } else if (action == "remove") {
            updateData = { 
                role: "user",
                // status: false
            }
        } else {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'wrong action sent.'
            });
        }

        
        const updatedUser = await userModel.findByIdAndUpdate(
            user_id, updateData,
            // { 
            //     role: req.body.newRole,
            //     status:
            // },
            { runValidators: true, returnOriginal: false }
        );

        if (updatedUser) {
            // Send a notification mail to the new admin

            if (action == "block") {
                const mailRes = sendAccountBlockedNotificationMail(
                    updatedUser.email, `${updatedUser.firstName} ${updatedUser.lastName}`,
                    "https://soundmuve-1bb3e.web.app/contact"
                );
            } else if (action == "remove") {
                const mailRes = sendAdminRemovalNotificationMail(
                    updatedUser.email, `${updatedUser.firstName} ${updatedUser.lastName}`,

                );
            }
            
            return res.status(201).json({
                status: true,
                statusCode: 201,
                result: updatedUser, 
                message: 'User role updated successfully!'
            });
        } else {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Unable to update user role.'
            });
        }

    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}
