const jwt = require('jsonwebtoken');
const RefreshToken = require('./refreshTokenSchema');

const generateAccessToken = (user) => {
    const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    }
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'});
}

const generateRefreshToken = (user) => {
    const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
    }
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {expiresIn: '7d'});
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

const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { email } = req.body;
        const existingRefreshToken = await RefreshToken.findOne({ email: email });
        if (!existingRefreshToken)
            return res.sendStatus(401);
        jwt.verify(existingRefreshToken.refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err)
                return res.sendStatus(403);
            req.user = user;
            next();
        })
    } catch (error) {
        res.sendStatus(500);
    }
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    authenticateAccessToken,
    authenticateRefreshToken
}