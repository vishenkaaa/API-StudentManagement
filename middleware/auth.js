const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Неавторизований доступ. Будь ласка, надайте токен' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.userId = decoded.id; 
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Термін дії токена вийшов. Увійдіть ще раз' });
        } else {
            res.status(400).json({ error: 'Недійсний токен' });
        }
    }
};

module.exports = { authMiddleware };
