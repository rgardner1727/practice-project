const { 
    retrieveUserByEmail,
    isUserVerified,
    retrieveOTPByUser,
    isOTPExpired,
    deleteCurrentOTPandSendNewOTP,
    isPasswordsMatching,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    registerUser,
    deleteUserRefreshTokens,
    authenticateRefreshToken,
} = require('./authService.js');
const { sendOTPEmail } = require('../mail/mailHelpers.js');

const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const existingUser = await retrieveUserByEmail(email);
        if (existingUser) return res.status(409).send('User with this email already exists.');
        const hashedPassword = await hashPassword(password);
        const registeredUser = await registerUser(firstName, lastName, email, hashedPassword);
        await sendOTPEmail(registeredUser.email, registeredUser.firstName);
        res.status(201).send('User registered successfully. OTP has been sent to the provided email.');
    } catch (error) {
        console.log(error);
        res.status(500).send('A server error occurred when attempting to register.');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await retrieveUserByEmail(email);
        if (!existingUser) return res.status(404).send('User with email not present in database.');
        if (!isUserVerified(existingUser)) {
            const otp = await retrieveOTPByUser(existingUser);
            if (!otp) {
                await deleteCurrentOTPandSendNewOTP(existingUser);
                return res.status(404).send('OTP was not sent for user.');
            }
            if (!isOTPExpired(otp)) return res.status(401).send('User still has valid OTP.');
            await deleteCurrentOTPandSendNewOTP(existingUser);
            return res.status(401).send('User is not verified and OTP is expired. New OTP has been sent.');
        }
        if (!isPasswordsMatching(existingUser, password)) return res.status(403).send('Invalid password provided.');
        const accessToken = generateAccessToken(existingUser);
        await generateRefreshToken(existingUser);
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).send('A server error occurred when attempting to login.');
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await retrieveUserByEmail(email);
        if (!existingUser) return res.status(404).send('Logout failed. User not found in database.');
        await deleteUserRefreshTokens(existingUser);
        res.sendStatus(204);
    } catch (error) {
        console.log(error);
        res.status(500).send('A server error occurred when attempting to logout.');
    }
});

router.post('/refresh-access-token', authenticateRefreshToken, async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await retrieveUserByEmail(email);
        if (!existingUser) return res.status(404).send('Failed to refresh access token. User not found in database.');
        const accessToken = generateAccessToken(existingUser);
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).send('A server error occurred when attempting to refresh the access token.');
    }
})

module.exports = router;