require('dotenv').config({ path: '../../.env'});

const express = require('express');
const router = express.Router();
const User = require('../user/userSchema');
const OTP = require('./otpSchema.js');
const { sendConfirmationEmail } = require('./mailHelpers.js');

router.post('/send-confirmation-email', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email });
        if (!user)
            return res.sendStatus(404);
        const [_, error] = await sendConfirmationEmail(email, user.firstName);
        if (error)
            return res.sendStatus(500);
        res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

router.post('/confirm-otp', async (req, res) => {
    try {
        const { email, oneTimePasscode } = req.body;
        const existingUser = await User.findOne({ email: email });
        if (!existingUser)
            return res.sendStatus(404);
        if (existingUser.isVerified)
            throw new Error('User is already verified. They should not be here.');
        if (!oneTimePasscode)
            return res.sendStatus(401);
        const existingOTP = await OTP.findOne({ email: email });
        if (!existingOTP)
            return res.sendStatus(404);
        if (existingOTP.expiresAt < Date.now())
            return res.sendStatus(401);
        if (oneTimePasscode !== existingOTP.otp)
            return res.sendStatus(403);
        existingUser.isVerified = true;
        await existingUser.save();
        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
})

module.exports = router;
