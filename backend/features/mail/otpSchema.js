const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true }
})

module.exports = mongoose.model('OTP', otpSchema);