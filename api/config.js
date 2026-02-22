module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'kodbank-secret-key-change-in-production',
  JWT_EXPIRY: '7d',
  COOKIE_NAME: 'bank_token',
  PORT: process.env.PORT || 5000
};
