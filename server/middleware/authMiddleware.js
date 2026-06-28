const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const token = authHeader.replace('Bearer ', '').trim();
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('FATAL: JWT_SECRET is not set in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired, please log in again' });
        }
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
