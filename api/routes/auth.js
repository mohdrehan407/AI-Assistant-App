const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

const router = express.Router();

// Register
router.post('/register', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'Email, password and full name are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO bank_users (email, password, full_name) VALUES (?, ?, ?)',
    [email, hashedPassword, fullName],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: 'Registration successful',
        userId: this.lastID
      });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT id, email, password, full_name, balance FROM bank_users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { userId: user.id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRY }
    );

    db.run('INSERT INTO bank_tokens (user_id, token) VALUES (?, ?)', [user.id, token], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      res.cookie(config.COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          balance: user.balance
        }
      });
    });
  });
});

// Logout (optional - revoke token)
router.post('/logout', (req, res) => {
  const token = req.cookies?.[config.COOKIE_NAME];
  if (token) {
    db.run('DELETE FROM bank_tokens WHERE token = ?', [token]);
  }
  res.clearCookie(config.COOKIE_NAME);
  res.json({ message: 'Logged out' });
});

module.exports = router;
