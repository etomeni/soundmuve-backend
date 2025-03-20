import Jwt from "jsonwebtoken";
import { userTokenModel } from "@/models/userToken.model.js";
import { userInterface } from "@/typeInterfaces/users.interface.js";


export async function generateTokens(user: userInterface) {
    const secretForToken = process.env.JWT_SECRET;
    const secretForRefreshToken = process.env.REFRESH_TOKEN_SECRET;

    try {
        const access_token = Jwt.sign(
            {
                email: user.email,
                _id: user._id,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
            },
            `${secretForToken}`,
            { expiresIn: '14m' }
        );

        const refresh_token = Jwt.sign(
            {
                email: user.email,
                _id: user._id,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
            },
            `${secretForRefreshToken}`,
            { expiresIn: '30d' }
        );

        const userToken = await userTokenModel.findOne({user_id: user._id, user_email: user.email});
        if (userToken) await userToken.deleteOne();

        const newUserAuth = await new userTokenModel({
            token: refresh_token,
            user_email: user.email,
            user_id: user._id,
            user_role: user.role,
        }).save();

        return Promise.resolve({ refresh_token, access_token });
    } catch (error) {
        return Promise.reject(error);
    }
}


export async function verifyRefreshToken(refreshToken: string) {
    const secretForRefreshToken = process.env.REFRESH_TOKEN_SECRET;

    const userToken = await userTokenModel.findOne({token: refreshToken});
    if (!userToken) {
        return { error: true, message: "Invalid refresh token."};
    }

    const decodedToken = Jwt.verify(refreshToken, `${secretForRefreshToken}`);
    if (!decodedToken) {
        return { error: true, message: "Invalid refresh token."};
    }

    return {
        token: decodedToken,
        error: true,
        message: "Valid refresh token."
    }
}