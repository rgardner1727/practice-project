require('dotenv').config();

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('../features/auth/authRoutes');
const mailRoutes = require('../features/mail/mailRoutes');

app.use(express.json());
app.use(cors({
    origin: process.env.ORIGIN
}))
app.use('/auth', authRoutes);
app.use('/mail', mailRoutes);

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log(error);
    }
})();

app.listen(process.env.PORT, () => console.log(`Server is running on port ${process.env.PORT}`));