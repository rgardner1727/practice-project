const User = require('../user/userSchema.js');
const OTP = require('../mail/otpSchema.js');
const jwt = require('jsonwebtoken');
const RefreshToken = require('./refreshTokenSchema');
const { sendOTPEmail } = require('../mail/mailHelpers.js');
const bcrypt = require('bcrypt');

const retrieveUserByEmail = async (email) => {
    const user = await User.findOne({ email: email });
    return user;
}

const isUserVerified = (user) => {
    return user.isVerified;
}

const retrieveOTPByUser = async (user) => {
    const otp = await OTP.findOne({ email: email });
    return otp;
}

const isOTPExpired = (otp) => {
    return otp.expiresAt < Date.now();
}

const deleteCurrentOTP = async (user) => {
    await OTP.deleteMany({ email: user.email });
}

const isPasswordsMatching = async (user, password) => {
    const isMatching = await bcrypt.compare(password, user.password);
    return isMatching;
}

const hashPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
}

const generateAccessToken = (user) => {
    const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    }
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
}

const generateRefreshToken = async (user) => {
    const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    }
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
    const storedRefreshToken = new RefreshToken({
        refreshToken: refreshToken,
        email: user.email
    });
    await storedRefreshToken.save();
}

const authenticateAccessToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.sendStatus(401);
        }
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err)
                return res.sendStatus(403);
            req.user = user;
            next();
        })
    } catch (error) {
        res.sendStatus(500);
    }
}

const retrieveRefreshTokenByEmail = async (email) => {
    const refreshToken = await RefreshToken.findOne({ email: email });
    return refreshToken.refreshToken;
}

const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { email } = req.body;
        const existingRefreshToken = await retrieveRefreshTokenByEmail(email);
        if (!existingRefreshToken) return res.sendStatus(401);
        jwt.verify(existingRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        })
    } catch (error) {
        res.sendStatus(500);
    }
}

const registerUser = async (firstName, lastName, email, hashedPassword) => {
    const user = new User({
        firstName: firstName, 
        lastName: lastName,
        email: email,
        password: hashedPassword
    });
    await user.save();
    return user;
}

const deleteUserRefreshTokens = async (user) => {
    await RefreshToken.deleteMany({ email: user.email });
    return;
}

module.exports = {
    retrieveUserByEmail, 
    isUserVerified, 
    retrieveOTPByUser,
    isOTPExpired, 
    deleteCurrentOTP,
    isPasswordsMatching,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    authenticateAccessToken,
    authenticateRefreshToken,
    registerUser,
    deleteUserRefreshTokens,
}