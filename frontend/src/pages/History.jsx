import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API = '/api';

const TYPE_LABELS = {
  deposit: 'Deposit',
  withdraw: 'Withdrawal',
  transfer_in: 'Received',
  transfer_out: 'Sent'
};

const TYPE_CLASS = {
  deposit: 'type-deposit',
  withdraw: 'type-withdraw',
  transfer_in: 'type-credit',
  transfer_out: 'type-debit'
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function History({ user, onLogout }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/bank/transactions`, { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) {
          onLogout();
          navigate('/login');
          return [];
        }
        return res.json();
      })
      .then((data) => setTransactions(data.transactions || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, [onLogout, navigate]);

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    onLogout();
    navigate('/login');
  };

  return (
    <div className="history-page">
      <header>
        <div>
          <h1>KodBank</h1>
          <p className="user-info">{user?.fullName}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="back-link">Dashboard</Link>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="history-content">
        <h2>Transaction History</h2>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet.</p>
        ) : (
          <div className="transactions-table-wrap">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="amount-col">Amount</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.created_at)}</td>
                    <td><span className={'badge ' + (TYPE_CLASS[t.type] || '')}>{TYPE_LABELS[t.type] || t.type}</span></td>
                    <td>{t.description || '—'}</td>
                    <td className={'amount-col ' + (t.amount >= 0 ? 'positive' : 'negative')}>
                      {t.amount >= 0 ? '+' : ''}${Math.abs(t.amount).toFixed(2)}
                    </td>
                    <td>${t.balance_after != null ? Number(t.balance_after).toFixed(2) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
