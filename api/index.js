const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');
require('./db');

const authRoutes = require('./routes/auth');
const bankRoutes = require('./routes/bank');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

module.exports = app;
