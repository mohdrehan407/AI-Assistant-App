# KodBank - Banking Simulation App

A small banking simulation with JWT-based authentication, user registration, login, check balance, and transfer money.

## Project Structure

```
kodbankapp/
├── backend/          # Express API
│   ├── db.js         # SQLite DB + two tables (bank_users, bank_tokens)
│   ├── server.js     # Entry point
│   ├── config.js     # JWT secret, cookie name
│   ├── middleware/auth.js  # Token validation
│   └── routes/
│       ├── auth.js   # Register, login, logout
│       └── bank.js   # Balance, transfer (protected)
├── frontend/         # React + Vite
│   └── src/
│       ├── pages/    # Login, Register, Dashboard
│       └── ...
└── README.md
```

## Database Tables

1. **bank_users** – User details
   - id, email, password (bcrypt), full_name, balance (default 1000), created_at

2. **bank_tokens** – JWT tokens
   - id, user_id, token, created_at

## Authentication Flow

1. User registers → password hashed, user stored in `bank_users`
2. User logs in → JWT generated, stored in `bank_tokens`, sent as httpOnly cookie
3. Protected routes → middleware validates cookie, checks token in DB
4. Check balance / Transfer → token validated, balance shown or updated

## Run the App

### Backend (port 5000)

```bash
cd backend
npm install
npm run dev
```

### Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

## API Endpoints

| Method | Endpoint           | Auth | Description          |
|--------|--------------------|------|----------------------|
| POST   | /api/auth/register | No   | Register new user    |
| POST   | /api/auth/login    | No   | Login, returns cookie|
| POST   | /api/auth/logout   | No   | Logout, clear cookie |
| GET    | /api/bank/balance  | Yes  | Get user balance     |
| POST   | /api/bank/transfer | Yes  | Transfer money       |
