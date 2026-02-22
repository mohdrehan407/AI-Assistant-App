const express = require('express');
const { validateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.use(validateToken);

function logTransaction(userId, type, amount, balanceAfter, description, relatedUserId, callback) {
  db.run(
    'INSERT INTO bank_transactions (user_id, type, amount, balance_after, description, related_user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, type, amount, balanceAfter, description, relatedUserId || null],
    callback
  );
}

// Check balance
router.get('/balance', (req, res) => {
  db.get('SELECT balance, full_name FROM bank_users WHERE id = ?', [req.userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json({
      balance: row.balance,
      fullName: row.full_name
    });
  });
});

// Deposit
router.post('/deposit', (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const numericAmount = parseFloat(amount);

  db.run('UPDATE bank_users SET balance = balance + ? WHERE id = ?', [numericAmount, req.userId], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    db.get('SELECT balance FROM bank_users WHERE id = ?', [req.userId], (err, row) => {
      if (err || !row) return res.status(500).json({ error: 'Failed to fetch balance' });

      logTransaction(req.userId, 'deposit', numericAmount, row.balance, 'Cash deposit', null, () => {
        res.json({
          message: 'Deposit successful',
          amount: numericAmount,
          newBalance: row.balance
        });
      });
    });
  });
});

// Withdraw
router.post('/withdraw', (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount required' });
  }

  const numericAmount = parseFloat(amount);

  db.get('SELECT balance FROM bank_users WHERE id = ?', [req.userId], (err, user) => {
    if (err || !user) return res.status(500).json({ error: 'User not found' });
    if (user.balance < numericAmount) return res.status(400).json({ error: 'Insufficient balance' });

    db.run('UPDATE bank_users SET balance = balance - ? WHERE id = ?', [numericAmount, req.userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const newBalance = user.balance - numericAmount;
      logTransaction(req.userId, 'withdraw', -numericAmount, newBalance, 'Cash withdrawal', null, () => {
        res.json({
          message: 'Withdrawal successful',
          amount: numericAmount,
          newBalance
        });
      });
    });
  });
});

// Transfer money
router.post('/transfer', (req, res) => {
  const { toEmail, amount } = req.body;

  if (!toEmail || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid recipient email and amount required' });
  }

  const numericAmount = parseFloat(amount);

  db.get('SELECT id, balance, full_name FROM bank_users WHERE id = ?', [req.userId], (err, sender) => {
    if (err || !sender) return res.status(500).json({ error: 'Sender not found' });
    if (sender.balance < numericAmount) return res.status(400).json({ error: 'Insufficient balance' });

    db.get('SELECT id, full_name, email FROM bank_users WHERE email = ?', [toEmail], (err, recipient) => {
      if (err || !recipient) return res.status(404).json({ error: 'Recipient not found' });
      if (recipient.id === sender.id) return res.status(400).json({ error: 'Cannot transfer to yourself' });

      const senderNewBalance = sender.balance - numericAmount;
      const recipientNewBalance = recipient.balance + numericAmount;

      db.serialize(() => {
        db.run('UPDATE bank_users SET balance = balance - ? WHERE id = ?', [numericAmount, sender.id]);
        db.run('UPDATE bank_users SET balance = balance + ? WHERE id = ?', [numericAmount, recipient.id], function (err) {
          if (err) return res.status(500).json({ error: err.message });

          logTransaction(sender.id, 'transfer_out', -numericAmount, senderNewBalance, `To: ${recipient.full_name}`, recipient.id);
          logTransaction(recipient.id, 'transfer_in', numericAmount, recipientNewBalance, `From: ${sender.full_name}`, sender.id);

          res.json({
            message: 'Transfer successful',
            amount: numericAmount,
            recipient: recipient.full_name,
            newBalance: senderNewBalance
          });
        });
      });
    });
  });
});

// Transaction history
router.get('/transactions', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    'SELECT id, type, amount, balance_after, description, related_user_id, created_at FROM bank_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.userId, limit, offset],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ transactions: rows });
    }
  );
});

module.exports = router;
