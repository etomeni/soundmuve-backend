import Jwt from "jsonwebtoken";

export const verifyEmailToken = (code: string, token: string) => {
    try {
        let decodedToken: any = Jwt.verify(token, `${code}`);
        // console.log(decodedToken);
        
        if (!decodedToken || decodedToken.code != code) {
            return {
                status: false,
                // decodedToken,
                message: 'wrong verification code!',
            }
        } 

        return {
            status: true,
            decodedToken,
            message: 'verified!',
        }
    } catch (error) {
        return {
            status: false,
            message: 'unable to verify Code!',
        }
    }
}

export function isNumeric(str: string) {
    // Use regular expression to check if the string contains only digits
    const regex = /^\d+$/;
    return regex.test(str);
    // This test will return false if it contains a decimal point
}