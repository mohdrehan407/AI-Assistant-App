import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

const API = '/api';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [balanceModal, setBalanceModal] = useState(false);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await fetch(`${API}/bank/balance`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setBalance(data.balance);
      else if (res.status === 401) {
        onLogout();
        navigate('/login');
      }
    } catch (err) {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const [transferOpen, setTransferOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferMsg, setTransferMsg] = useState({ type: '', text: '' });
  const [depositMsg, setDepositMsg] = useState({ type: '', text: '' });
  const [withdrawMsg, setWithdrawMsg] = useState({ type: '', text: '' });
  const [transferLoading, setTransferLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const handleCheckBalance = async () => {
    setBalanceModal(true);
    setBalance(null);
    await loadBalance();
  };

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    onLogout();
    navigate('/login');
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferMsg({ type: '', text: '' });
    setTransferLoading(true);

    try {
      const res = await fetch(`${API}/bank/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, amount }),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          navigate('/login');
          return;
        }
        setTransferMsg({ type: 'error', text: data.error || 'Transfer failed' });
        return;
      }

      setTransferMsg({ type: 'success', text: `Transferred $${data.amount} to ${data.recipient}` });
      setToEmail('');
      setAmount('');
    } catch (err) {
      setTransferMsg({ type: 'error', text: 'Network error' });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header>
        <div>
          <h1>KodBank</h1>
          <p className="user-info">{user?.fullName}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="theme-toggle-btn"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: isDarkMode ? '#fcd34d' : '#475569', display: 'flex', alignItems: 'center'
            }}
          >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="cards">
        <div className="card">
          <h2>Check Balance</h2>
          <p>View your current account balance.</p>
          <button onClick={handleCheckBalance}>Check Balance</button>
        </div>

        <div className="card">
          <h2>Transfer Money</h2>
          <p>Send money to another account by email.</p>
          <button onClick={() => setTransferOpen(!transferOpen)}>
            {transferOpen ? 'Close' : 'Transfer Money'}
          </button>

          {transferOpen && (
            <form className="transfer-form" onSubmit={handleTransfer}>
              <input
                type="email"
                placeholder="Recipient email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <button type="submit" disabled={transferLoading}>
                {transferLoading ? 'Transferring...' : 'Transfer'}
              </button>
              {transferMsg.text && (
                <p className={transferMsg.type}>{transferMsg.text}</p>
              )}
            </form>
          )}
        </div>

        <div className="card">
          <h2>Transaction History</h2>
          <p>View your recent account activity and transactions.</p>
          <button onClick={() => navigate('/history')}>View History</button>
        </div>

        <div className="card">
          <h2>AI Assistant App</h2>
          <p>Get instant help, financial advice, or learn with your AI companion.</p>
          <button onClick={() => navigate('/brokod-chat')}>Chat with AI</button>
        </div>
      </div>

      {balanceModal && (
        <div
          className="modal-overlay"
          onClick={() => setBalanceModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Your Balance</h2>
            {balanceLoading ? (
              <p className="loading">Loading...</p>
            ) : balance !== null ? (
              <p className="balance-value">
                ${typeof balance === 'number' ? balance.toFixed(2) : balance}
              </p>
            ) : (
              <p className="loading">Unable to load balance</p>
            )}
            <button onClick={() => setBalanceModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="brokod-floating" onClick={() => navigate('/brokod-chat')}>
        <span className="floating-text">AI Assistant App</span>
        <img src="https://cdn-icons-png.flaticon.com/512/2040/2040946.png" alt="AI Avatar" />
      </div>
    </div>
  );
}