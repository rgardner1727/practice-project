const express = require('express');
const router = express.Router();
const User = require('../user/userSchema');
const RefreshToken = require('./refreshTokenSchema');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken, authenticateRefreshToken } = require('./authHelpers');

router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (existingUser)
            return res.sendStatus(409);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstName: firstName, 
            lastName: lastName,
            email: email,
            password: hashedPassword
        });
        await newUser.save();
        res.sendStatus(201);
    } catch (error) {
        res.sendStatus(500);
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser)
            return res.sendStatus(404);
        const isCorrectPassword = await bcrypt.compare(password, existingUser.password);
        if (!isCorrectPassword)
            return res.sendStatus(401);
        const accessToken = generateAccessToken(existingUser);
        const refreshToken = generateRefreshToken(existingUser);
        const newStoredRefreshToken = new RefreshToken({
            refreshToken: refreshToken,
            email: existingUser.email
        });
        await newStoredRefreshToken.save();
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

router.post('/logout', async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser)
            return res.status(404).json({ message: 'User not found' });
        await RefreshToken.deleteMany({ email: email });
        res.sendStatus(204);
    } catch (error) {
        res.sendStatus(500);
    }
})

router.post('/refresh-access-token', authenticateRefreshToken, async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser)
            return res.sendStatus(404);
        const accessToken = generateAccessToken(existingUser);
        res.status(201).json({ accessToken: accessToken });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

module.exports = router;