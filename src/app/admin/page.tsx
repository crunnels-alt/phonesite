'use client';

import { useState } from 'react';
import AdminPanel from '@/components/AdminPanel';

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid var(--border-light)',
  background: 'var(--background)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  border: '1px solid var(--border-light)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.authenticated) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setError('Invalid password');
        setPassword('');
      }
    } catch {
      setError('Authentication failed');
    } finally {
      setIsChecking(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="type-sans"
              style={{
                ...buttonStyle,
                color: '#dc2626',
                borderColor: '#dc2626',
              }}
            >
              Logout
            </button>
          </div>

          <AdminPanel />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--background)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '2rem',
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 400, marginBottom: '2rem', textAlign: 'center' }}>
          Admin Login
        </h1>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: '14px', color: '#dc2626' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isChecking || !password}
            className="type-sans"
            style={{
              ...buttonStyle,
              width: '100%',
              background: isChecking || !password ? 'transparent' : 'var(--foreground)',
              color: isChecking || !password ? 'var(--text-tertiary)' : 'var(--background)',
              cursor: isChecking || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {isChecking ? 'Checking...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
