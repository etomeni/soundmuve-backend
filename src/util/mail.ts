import fs from "fs";
import Jwt from "jsonwebtoken";
// import axios from "axios";
import nodemailer from 'nodemailer';
import moment from 'moment';
import { locationInterface } from "@/typeInterfaces/users.interface.js";

const year = moment().format("YYYY");


const mailTransporter = () => {
    const mailTransporter = nodemailer.createTransport({
        // service: "gmail",
        host:  process.env.HOST_SENDER,
        port: 465,
        auth: {
            user: process.env.HOST_EMAIL,
            pass: process.env.HOST_PASSWORD
        }
    });

    return mailTransporter;
}

export const sendEmailVerificationCode = (email: string, name = "", subject = "Email Verification Code") => {
    try {
        const codeLength = 4;
        const code = Math.floor(Math.random() * Math.pow(10, codeLength)).toString().padStart(codeLength, '0');
    
        const jwt_token = Jwt.sign(
            { code, email },
            `${code}`,
            { expiresIn: '30m' }
        );

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/emailVerification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{code}}/g, code)
        .replace(/{{year}}/g, year);
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Email Verification


            Hi ${name},
            Please use this code below to verify your email address.
            
            ${code}
            
            
            Thanks for choosing Soundmuve.
            
            Best wishes,
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject,
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter().sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending verification mail.',
                }
            }
        });
        
        return {
            status: true,
            code: code,
            jwt_token: jwt_token,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        }
    }
}

export const sendUserContactMailAutoResponse = (email: string, name: string, message: string) => {
    try {
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host:  process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/contactUs_UserAutoResMail.html", 'utf8');
        

        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{year}}/g, year)
        .replace(/{{message}}/g, message);
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Hi ${name},

            Thank you for reaching out to us through our website's contact form. We have received your message and our team will review it shortly. One of our representatives will get back to you as soon as possible.

            Here are the details of your submission:

            Name: ${name}
            Email: ${email}
            Message: ${message}
            If you have any urgent questions, feel free to reply to this email or contact us directly at help@soundmuve.com.

            Thank you again for getting in touch!

            Best regards,
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Thank You for Contacting Us - We've Received Your Message!",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending verification mail.',
                }
            }
        });
        
        return {
            status: true,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        }
    }
}

export const sendAdminUserContactUsNotification = (email: string, name: string, message: string) => {
    try {
        const mailTransporter = nodemailer.createTransport({
            // service: "gmail",
            host:  process.env.HOST_SENDER,
            port: 465,
            auth: {
                user: process.env.HOST_EMAIL,
                pass: process.env.HOST_PASSWORD
            }
        });

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/contactUs_NotifyAdminMail.html", 'utf8');
        

        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{year}}/g, year)
        .replace(/{{message}}/g, message);
        
        
        const mailText = `
            Hello Admin,

            You have received a new contact form submission on Soundmuve.com. Below are the details:

            Name: ${name}
            Email: ${email}
            Message: ${message}
            Please review the message and take appropriate action.

            Thank you.
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `help@soundmuve.com`,
            subject: "New Contact Form Submission",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending verification mail.',
                }
            }
        });
        
        return {
            status: true,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        return {
            status: false,
            error,
            message: 'an error occured while sending verification email.',
        }
    }
}

export const sendLoginNotification = (
    email: string, name: string, location: locationInterface, soundmuveUrl = "www.soundmuve.com"
) => {
    try {
        const fullDate_time = moment().format('MMMM Do YYYY, h:mm:ss a'); // October 18th 2024, 8:47:29 am

        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/login_differentIpMail.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{city}}/g, location.city)
        .replace(/{{region}}/g, location.region)
        .replace(/{{country}}/g, location.country)
        .replace(/{{userIp}}/g, location.ip)
        .replace(/{{date_time}}/g, fullDate_time)
        .replace(/{{soundmuveUrl}}/g, soundmuveUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We noticed a new login to your account from a different location. If this was you, there's no need to worry. However, if you did not initiate this login, please secure your account immediately.

            Login Details:

            IP Address: ${location.ip}
            Location: ${location.city}, ${location.region}, ${location.country}
            Date & Time: ${fullDate_time}
            If you suspect unauthorized access, please change your password and review your account activity as soon as possible. You can secure your account by clicking the link below:
            ${soundmuveUrl}

            If this was you, you can safely disregard this email.

            Thank you,
            SoundMuve

            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "New Login Alert!",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter().sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending mail.',
                }
            }
        });
        
        return {
            status: true,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        console.log(error);
        
        return {
            status: false,
            error,
            message: 'an error occured while sending email.',
        }
    }
}

export const sendNewPasswordConfirmationMail = (
    email: string, name: string,
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/newPasswordConfirmationMail.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            Your password has been successfully reset. You can now log in with your new password.

            If you did not reset your password or suspect any unauthorized activity, please contact our support team immediately.

            You can log in to your account here:
            www.soundmuve.com/auth/login/

            Thank you for using our services. If you have any questions, feel free to reach out to us.


            Best regards,
            SoundMuve


            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Password Reset Successful",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter().sendMail(details, (err) => {
            if (err) {
                return {
                    status: false,
                    error: err,
                    message: 'an error occured while sending mail.',
                }
            }
        });
        
        return {
            status: true,
            message: 'Email sent successfully.',
        }
    } catch (error) {
        console.log(error);
        
        return {
            status: false,
            error,
            message: 'an error occured while sending email.',
        }
    }
}
