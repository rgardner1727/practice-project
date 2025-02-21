require('dotenv').config({ path: '../../.env'});

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../user/userSchema');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_GMAIL_PASSWORD
    }
});

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
})

const sendConfirmationEmail = async (recipientEmail, recipientFirstName) => {
    try {
        const mailOptions = {
            from: process.env.MY_GMAIL,
            to: recipientEmail,
            subject: 'Example App Name',
            text: 'Welcome to our app!',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; border: 1px solid #ccc; display: grid; justify-content: center; align-items: center;">
                <h1 style="text-align: center;">Welcome to Example App Name</h1>
                <p>Thank you for signing up. Consider purchasing a subscription to get full access to our app.</p>
                <p>If you have any questions, please contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
                <p style="font-size: 12px;">Thank you for choosing Example App Name!</p>
                <p style="font-size: 12px;">P.S. This email was sent from a program I wrote. Pretty cool, right? Love, Ryan</p>
            </div>
            `
        }
        const info = await transporter.sendMail(mailOptions)
        return [info, null];
    } catch (error) {
        console.error('Error sending email');
        return [null, error];
    }
}

module.exports = router;
