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

const formatMessageForEmail = (message: string) => {
    return message.replace(/\n/g, '<br>');
};
  

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
        .replace(/{{message}}/g, formatMessageForEmail(message));
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Hi ${name},

            Thank you for reaching out to us through our website's contact form. We have received your message and our team will review it shortly. One of our representatives will get back to you as soon as possible.

            Here are the details of your submission:

            Name: ${name}
            Email: ${email}
            Message: 
            ${message}
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
                    message: 'an error occured while sending mail.',
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
            message: 'an error occured while sending email.',
        }
    }
}

export const sendUserAdminContactUsReplyMail = (email: string, name: string, message: string) => {
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
        const data = fs.readFileSync("./src/emailTemplates/adminContactUsReply.html", 'utf8');

        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        // .replace(/{{email}}/g, email)
        .replace(/{{year}}/g, year)
        .replace(/{{message}}/g, formatMessageForEmail(message));
        
        // console.log(Htmltemplate);
        
        const mailText = `
            Hi ${name},

            Thank you for reaching out to us. We've carefully reviewed your message, and here is our response:

            Our Response:
            ${message}

            If you have any further questions or need clarification, please feel free to reply to this email or contact us at [Support Email] or [Support Phone Number].

            Thank you for choosing [Your Company Name]. We're here to help!

            Best regards,
            Soundmuve
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Response to Your Inquiry",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err, info) => {
            // console.log(info);

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
        return {
            status: false,
            error,
            message: 'an error occured while sending email.',
        }
    }
}

export const sendNewsletterMail = (
    recipient: string, title: string, message: string
) => {
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


        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: recipient,
            subject: title,
            text: '',
            html: message
        };

        mailTransporter.sendMail(details, (err, info) => {
            console.log(info);
            
            if (err) {
                console.log(err);
                
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
        return {
            status: false,
            error,
            message: 'an error occured while sending email.',
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
            replyTo: email,
            subject: "New Contact Form Submission",
            text: mailText,
            html: Htmltemplate
        };

        mailTransporter.sendMail(details, (err, info) => {
            // console.log(info);
            
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

export const sendNewAdminNotificationMail = (
    email: string, name: string, // password: string,
    adminDashboardUrl: string
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/adminRoleNotification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        // .replace(/{{password}}/g, password)
        .replace(/{{adminDashboardUrl}}/g, adminDashboardUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We are pleased to inform you that you have been granted admin privileges on our website. As an admin, you now have access to additional tools and controls to help manage the platform effectively.

            Please ensure you understand your new responsibilities and use your privileges responsibly. You can log in to your account to explore your new permissions and get started:
            
            Note: To login, use your existing soundmuve login credentials.
            ${ adminDashboardUrl }

            If you have any questions about your new role or need assistance, please feel free to reach out to us.


            Best regards,
            SoundMuve


            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "You Have Been Granted Admin Access!",
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

export const sendNewAdminNotificationMailWithCredentials = (
    email: string, name: string, password: string,
    adminDashboardUrl: string
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/adminRoleNotificationWithCredentials.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{email}}/g, email)
        .replace(/{{password}}/g, password)
        .replace(/{{adminDashboardUrl}}/g, adminDashboardUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We are pleased to inform you that you have been granted admin privileges on our website. As an admin, you now have access to additional tools and controls to help manage the platform effectively.

            Here are your new login credentials:
            Email: ${email}
            Password: ${password}

            Please ensure you understand your new responsibilities and use your privileges responsibly. You can log in to your account to explore your new permissions and get started:

            ${ adminDashboardUrl }

            If you have any questions about your new role or need assistance, please feel free to reach out to us.


            Best regards,
            SoundMuve


            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "You Have Been Granted Admin Access!",
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

export const sendAdminRemovalNotificationMail = (
    email: string, name: string
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/adminRoleRemovalNotification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We wanted to let you know that your admin privileges on our website have been removed. You will no longer have access to admin-specific tools and features.

            If you believe this change was made in error or have any questions, please reach out to our support team for assistance.

            Thank you for your contributions as an admin, and we hope you continue to enjoy using our services.

            Best regards,
            SoundMuve


            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Admin Privileges Removed",
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

export const sendAccountBlockedNotificationMail = (
    email: string, name: string, soundmuveUrl: string
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/accountBlockedNotification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{soundmuveUrl}}/g, soundmuveUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We wanted to inform you that your account on our website has been blocked due to a violation of our terms of service.

            If you believe this action was taken in error or would like more details, please reach out to our support team.

            For assistance, please contact support here:
            ${soundmuveUrl}

            Thank you for your understanding.

            Best regards,
            SoundMuve


            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Your Account has been restricted",
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

export const sendCouponApprovalNotificationMail = (
    email: string, name: string, 
    couponCode: string, discountPercentage: string,
    discountedAmount: string, payableAmount: string,
    soundmuveUrl: string,
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/adminCouponApprovalNotification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        .replace(/{{couponCode}}/g, couponCode)
        .replace(/{{discountPercentage}}/g, discountPercentage)
        .replace(/{{discountedAmount}}/g, discountedAmount)
        .replace(/{{payableAmount}}/g, payableAmount)
        .replace(/{{soundmuveUrl}}/g, soundmuveUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            We're excited to inform you that your application for a discounted release has been approved! Here are the details:

            Coupon Code: ${couponCode}
            Discount Percentage: ${discountPercentage}%
            Discounted Amount: $${discountedAmount}
            Payable Amount: $${payableAmount}

            Use this coupon during checkout to enjoy your discount!

            Start a release here:
            ${soundmuveUrl}

            If you have any questions, feel free to contact our support team.

            Best regards,
            SoundMuve

            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Discounted Release Application Approved!",
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

export const sendCouponRejectionNotificationMail = (
    email: string, name: string, 
) => {
    try {
        // Read the HTML file synchronously
        const data = fs.readFileSync("./src/emailTemplates/adminCouponRejectionNotification.html", 'utf8');
        
        // Replace the placeholder with a dynamic value (e.g., "John")
        const Htmltemplate = data.replace(/{{name}}/g, name)
        // .replace(/{{soundmuveUrl}}/g, soundmuveUrl)
        .replace(/{{year}}/g, year);
        
        
        const mailText = `
            Hello ${name},

            Thank you for applying for a discounted release on our website. After careful review, we regret to inform you that your application for a discount has not been approved at this time.

            If you have any questions or would like further clarification, please feel free to reach out to our support team. We appreciate your interest in our services and hope to keep serving you better.

            Thank you for your understanding.

            Best regards,
            SoundMuve

            © ${year} SoundMuve. All rights reserved.
        `;

        const details = {
            from: `Soundmuve <${ process.env.HOST_EMAIL }>`,
            to: `${email}`,
            subject: "Discounted Release Application Status",
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
