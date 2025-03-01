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
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await retrieveUserByEmail(email);
        if (!user) return res.status(404).send('User with email not present in database.');
        if (!isUserVerified(user)) {
            const otp = await retrieveOTPByUser(user);
            if (!otp) {
                await deleteCurrentOTPandSendNewOTP(user);
                return res.status(404).send('OTP was not sent for user.');
            }
            if (!isOTPExpired(otp)) return res.status(401).send('OTP for user has expired.');
            await deleteCurrentOTPandSendNewOTP(user);
            return res.status(401).send('User is not verified and OTP is expired. New OTP has been sent.');
        }
        if (!isPasswordsMatching(user, password)) return res.status(403).send('Invalid password provided.');
        const accessToken = generateAccessToken(user);
        await generateRefreshToken();
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        console.log(error);
        res.status(500).send('A server error occurred when attempting to login.');
    }
})