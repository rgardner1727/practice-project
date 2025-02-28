const nodemailer = require('nodemailer');
require('dotenv').config();
const OTP = require('./otpSchema');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MY_GMAIL,
        pass: process.env.MY_GMAIL_PASSWORD
    }
});

const sendConfirmationEmail = async (recipientEmail, recipientFirstName) => {
    try {
        const mailOptions = {
            from: process.env.MY_GMAIL,
            to: recipientEmail,
            subject: 'Example App Name',
            text: `Welcome to our app ${recipientFirstName}!`,
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


const sendOTPEmail = async (recipientEmail, recipientFirstName) => {
    try {
        const oneTimePasscode = generateOTP();

        const mailOptions = {
            from: process.env.MY_GMAIL,
            to: recipientEmail,
            subject: 'Example App Name - One-Time Password',
            text: `You're almost registered ${recipientFirstName}. Verify your email by entering this one-time passcode: ${oneTimePasscode}. This passcode expires in 30 minutes`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; border: 1px solid #ccc; display: grid; justify-content: center; align-items: center;">
                <h1 style="text-align: center;">Welcome to Example App Name</h1>
                <p>You're almost registered. Verify your email by entering this one-time passcode: </p>
                <h1 style="text-align: center; display: block; font-size: 48px">${oneTimePasscode}</h1>
                <p style="text-align: center;">This code expires in 30 minutes. Navigate to the login page to generate a new code.</p>
                <p>If you have any questions, please contact us at <a href="mailto:support@example.com">support@example.com</a>.</p>
                <p style="font-size: 12px;">Thank you for choosing Example App Name!</p>
                <p style="font-size: 12px;">P.S. This email was sent from a program I wrote. Pretty cool, right? Love, Ryan</p>
            </div>
            `
        }
        const info = await transporter.sendMail(mailOptions);

        const newOTP = new OTP({
            email: recipientEmail,
            otp: oneTimePasscode,
            createdAt: Date.now(),
            expiresAt: new Date(Date.now() + .5 * 60 * 1000)
        })

        await newOTP.save();
        
        return [info, null];
    } catch (error) {
        console.log(error);
        return [null, error];
    }
}

const generateOTP = () => {
    const passcode = Math.floor(10000 * Math.random()).toString().padStart(4, '0');
    return passcode;
}

module.exports = {
    sendConfirmationEmail, 
    sendOTPEmail, 
    generateOTP
}