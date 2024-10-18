import { Request, Response, NextFunction } from "express-serve-static-core";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import Jwt from "jsonwebtoken";

// models
import { userModel } from '../models/users.model.js';
import { userInterface } from "@/typeInterfaces/users.interface.js";

// utilities
import { sendEmailVerificationCode, sendLoginNotification, sendNewPasswordConfirmationMail } from "@/util/mail.js";
import { cloudinaryUpload } from "@/util/cloudFileStorage.js";
import { verifyEmailToken } from "@/util/resources.js";


const secretForToken = process.env.JWT_SECRET;

interface passwordResetCodeInterface {
    email: string,
    code: string
}
let passwordResetCode: passwordResetCodeInterface[] = [];

export const signupController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        // Check if email already exists
        const emailExist = await userModel.findOne({ email: req.body.email });
        if (emailExist) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'Email already exists.'
            });
        }

        // Check if user agreed to the terms and conditions
        if (req.body.tnc != true) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Must accept terms and conditions before proceeding.'
            });
        }

        // Check if user location is included
        if (!req.body.location) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Must include user location details to proceed.'
            });
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
            role: "user",
            // userType: "artist",
            balance: 0,
            // recordLabelName: "",
            // recordLabelLogo: "",
            // kyc: {
            //     isKycSubmitted: false,
            //     securityQuestions: []
            // },
            location: req.body.location,
        });
        const result = await newUser.save();
        if (!result._id) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'server error, try again after some time.'
            });
        }
        
        // Send a mail verification code.
        // const mailRes = sendEmailVerificationCode(result.email, `${result.firstName} ${result.lastName}`)
        // if (!mailRes.status) {
        //     return res.status(500).json({
        //         status: false,
        //         statusCode: 500,
        //         message: mailRes.message,
        //         error: mailRes.error
        //     });
        // }
        
        const token = Jwt.sign(
            {
                email: result.email,
                _id: result._id
            },
            `${secretForToken}`,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            status: true,
            statusCode: 201,
            token,
            result: result, 
            message: 'User registered successfully!'
        });
           
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

export const updateSignupController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'sent data validation error!', 
                ...errors
            });
        };

        // const email = req.body.authMiddlewareParam.email;
        // const user_id = req.body.authMiddlewareParam._id;

        const email = req.body.email;
        const userType = req.body.userType;
        const phoneNumber = req.body.phoneNumber;
        const country = req.body.country;

        let user;
        if (userType == "artist") {
            user = await userModel.findOneAndUpdate(
                { email: email }, 
                { 
                    $set: { 
                        artistName: req.body.artistName,
                        userType,
                        phoneNumber: phoneNumber, 
                        country: country, 
                        gender: req.body.gender, 
                        // recordLabelName: null 
                    } 
                }, 
                { new: true }
            );
            if (!user) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'server error, unable to update artist details, please try again after some time.'
                });
            }
        } else if (userType == "record label") {
            const result = await cloudinaryUpload(req.body.recordLabelLogo);

            user = await userModel.findOneAndUpdate(
                { email: email }, 
                { 
                    $set: { 
                        // artistName: null,
                        userType,
                        phoneNumber: phoneNumber, 
                        country: country, 
                        // gender: null, 
                        recordLabelName: req.body.recordLabelName,
                        recordLabelLogo: result 
                    } 
                }, 
                { new: true }
            );

            if (!user) {
                return res.status(500).json({
                    status: false,
                    statusCode: 500,
                    message: 'server error, unable to update record label details, please try again after some time.'
                });
            }
        } else {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'unknown user type.'
            });
        }

        return res.status(201).json({
            status: true,
            statusCode: 201,
            result: user,
            message: 'Details Updated Successfully.'
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}

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
                _id: user._id
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
                _id: user._id
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

// forgot password ::-> verifies the user and sends email to verify its him requesting the rest
export const sendPasswordResetEmailCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'Email validation error.', 
                errors
            });
        };

        const email = req.body.email;
        const uzer = await userModel.findOne({email});

        if (!uzer) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'User with this Email Address does not exist!',
            });
        }

        const mailResponse = sendEmailVerificationCode(
            email,
            `${uzer.firstName} ${uzer.lastName}`,
            "Password Reset Request"
        );

        if (!mailResponse.status) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: mailResponse.message,
                error: mailResponse.error
            });
        }


        setPasswordResetCode({
            code: mailResponse.code || '',
            email: uzer.email || email,
        });

        return res.status(201).json({
            statusCode: 201,
            status: true,
            token: mailResponse.jwt_token,
            message: 'Password reset Email sent, kindly check your mail for verification code.',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}


// verify email reset code
export const verifyEmailTokenCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.body.code;
        // const email = req.body.email;
        // const token = req.body.token;

        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No authentication token, Please try again.",
            });
        };

        const token = authHeader.split(' ')[1];
        
        const verifyRes =  verifyEmailToken(code, token);
        
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'wrong verification code!',
            });
        }


        return res.status(201).json({
            status: true,
            statusCode: 201,
            // decodedToken: verifyRes.decodedToken,
            message: 'Please proceed to reset your password.',
        });
    } catch (error: any) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = 'server error!';
        }
        next(error);
    }
}


export const setNewPasswordCtr = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            return res.status(400).json({
                statusCode: 400,
                status: false,
                message: 'Form validation error!',
                error
            });
        };

        const email = req.body.email;
        const newPassword = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                statusCode: 400,
                message: 'password does not match.',
            });
        }

        // get the saved tempt code
        const resetcode = getPasswordResetCodeByEmail(email);
        if (!resetcode) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: 'session timeout!',
            });
        }


        // add extra security to ensure the actual user requested for the change
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                status: false,
                statusCode: 401,
                message: "No authentication token, Please try again.",
            });
        };

        const token = authHeader.split(' ')[1];
        const verifyRes = verifyEmailToken(resetcode.code, token);
        if (!verifyRes.status) {
            return res.status(401).json({
                statusCode: 401,
                status: false,
                message: 'session timeout!',
            });
        }

        // remove the saved code;
        removePasswordResetCode(email);

        // generate and update the new password hash
        const hashedPassword = await bcryptjs.hash(newPassword, 12);
        const updatedUser = await userModel.findOneAndUpdate(
            { email: email }, 
            { password: hashedPassword },
            {
                runValidators: true,
                returnOriginal: false,
            }
        );

        if (!updatedUser) {
            return res.status(500).json({
                status: false,
                statusCode: 500,
                message: 'Ooopps unable to update password.',
            });
        }

        // send email to user about the changed password.
        sendNewPasswordConfirmationMail(updatedUser.email, `${updatedUser.firstName} ${updatedUser.lastName}`);

        return res.status(201).json({
            status: true,
            statusCode: 201,
            message: 'Password Changed successfully!',
        });
    } catch (error: any) {
        if (!error.statusCode) error.statusCode = 500;
        next(error);
    }
}



function setPasswordResetCode(passwordResetData: passwordResetCodeInterface) {
    // Check if the email already exists in the array
    const existingCode = passwordResetCode.find(code => code.email == passwordResetData.email);
  
    // If the email doesn't exist, add the new code to the array
    if (!existingCode) passwordResetCode.push(passwordResetData);
}

function removePasswordResetCode(email: string) {
    // Find the index of the code with the specified email
    const index = passwordResetCode.findIndex(code => code.email === email);
  
    // If the code is found, remove it from the array
    if (index !== -1) passwordResetCode.splice(index, 1);
}

function getPasswordResetCodeByEmail(email: string) {
    // Find the code object with the specified email
    const code = passwordResetCode.find(code => code.email == email);
  
    // Return the code object or null if not found
    return code || null;
}


// export const changePasswordCtr = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // const userId = req.body.userId;
//         const currentPassword = req.body.currentPassword;
//         const newPassword = req.body.newPassword;
//         const confirmNewPassword = req.body.confirmNewPassword;
//         const userDataParam = req.body.authMiddlewareParam;

//         if (newPassword !== confirmNewPassword) {
//             return res.status(400).json({
//                 status: false,
//                 statusCode: 400,
//                 message: "passwords doesn't match."
//             });
//         }

//         const user = await userModel.findOne({email: userDataParam.email});
//         if (!user?._id) {
//             return res.status(401).json({
//                 message: "A user with this ID could not be found!",
//                 status: false,
//                 statusCode: 401,
//             });
//         };

//         const isPassEqual = await bcryptjs.compare(currentPassword, user.password);
//         if (!isPassEqual) {
//             return res.status(400).json({
//                 status: false,
//                 statusCode: 400,
//                 message: "Wrong password!"
//             });
//         }

//         const hashedPassword = await bcryptjs.hash(newPassword, 12);

//         const updatedUser = await userModel.findOneAndUpdate(
//             { _id: user._id }, 
//             { password: hashedPassword },
//             // {
//             //     runValidators: true,
//             //     returnOriginal: false,
//             // }
//         );
        
//         if (!updatedUser?._id) {
//             return res.status(500).json({
//                 status: false,
//                 statusCode: 500,
//                 message: 'Ooopps unable to update password.',
//             });
//         }

//         return res.status(201).json({
//             status: true,
//             statusCode: 201,
//             message: 'Password Changed successfully!',
//         });
//     } catch (error: any) {
//         if (!error.statusCode) {
//             error.statusCode = 500;
//         }
//         next(error);
//     }
// }

