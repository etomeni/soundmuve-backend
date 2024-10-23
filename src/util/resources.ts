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


export function determineFileType(filePath: string) {
    // Define common audio and video file extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    const audioExtensions = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.aiff', '.alac'];  
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.mpeg', '.3gp'];
    
    // Extract the file extension from the filePath
    const fileExtension = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  
    // Check if the file extension matches audio or video formats
    if (audioExtensions.includes(fileExtension)) {
      return 'video';
    } else if (videoExtensions.includes(fileExtension)) {
      return 'video';
    } else {
      return 'image';
    }
}
