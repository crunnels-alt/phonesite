'use client';

import { useState } from 'react';
import AdminPanel from '@/components/AdminPanel';

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
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setIsChecking(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ padding: '2rem', maxWidth: '1600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 className="type-display" style={{ fontSize: '2rem' }}>
              ADMIN_PANEL
            </h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="type-mono text-xs"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--accent-red)',
                background: 'transparent',
                color: 'var(--accent-red)',
                cursor: 'pointer',
              }}
            >
              LOGOUT
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
        maxWidth: '400px',
        padding: '2rem',
      }}>
        <h1 className="type-display" style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          ADMIN_ACCESS
        </h1>

        <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <label className="type-mono text-xs" style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="type-mono text-sm"
              placeholder="Enter admin password"
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--accent-gray)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {error && (
            <p className="type-mono text-xs" style={{ color: 'var(--accent-red)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isChecking || !password}
            className="type-mono text-xs uppercase tracking-wide"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${isChecking || !password ? 'var(--accent-gray)' : 'var(--accent-red)'}`,
              background: 'transparent',
              color: isChecking || !password ? 'var(--accent-gray)' : 'var(--accent-red)',
              cursor: isChecking || !password ? 'not-allowed' : 'pointer',
            }}
          >
            {isChecking ? 'CHECKING...' : 'AUTHENTICATE'}
          </button>
        </form>

        <p className="type-mono text-xs" style={{ marginTop: '2rem', opacity: 0.4, textAlign: 'center' }}>
          Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
