const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

function validateToken(req, res, next) {
  const token = req.cookies?.[config.COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    db.get('SELECT token FROM bank_tokens WHERE token = ? AND user_id = ?', [token, decoded.userId], (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'Token not found or revoked' });
      }
      req.userId = decoded.userId;
      req.token = token;
      next();
    });
  });
}

module.exports = { validateToken };
