'use client';

import { useState } from 'react';
import PhotoManager from './PhotoManager';
import ContentManager from './ContentManager';

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid var(--border-light)',
  background: 'var(--background)',
  fontFamily: 'inherit',
  fontSize: '14px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '12px',
  color: 'var(--text-tertiary)',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  border: '1px solid var(--border-light)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '13px',
};

export default function AdminPanel() {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [digit, setDigit] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<Record<string, unknown> | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);

  const sendTestWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, digit }),
      });
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to send test webhook' });
    }
    setIsLoading(false);
  };

  const clearNavigationHistory = async () => {
    try {
      const response = await fetch('/api/users', { method: 'DELETE' });
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to clear navigation history' });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 400 }}>Admin</h1>
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            className="type-sans"
            style={{
              ...buttonStyle,
              fontSize: '12px',
              opacity: 0.6,
            }}
          >
            {showDevTools ? 'Hide' : 'Show'} Dev Tools
          </button>
        </div>
      </div>

      {/* Dev Tools (Collapsible) */}
      {showDevTools && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 400, marginBottom: '1rem', opacity: 0.7 }}>Developer Tools</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Webhook Testing */}
            <div style={{ padding: '1rem', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '1rem' }}>Webhook Simulation</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={inputStyle}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Digit</label>
                  <select
                    value={digit}
                    onChange={(e) => setDigit(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="0">0 - Home</option>
                    <option value="1">1 - About</option>
                    <option value="2">2 - Projects</option>
                    <option value="3">3 - Photo</option>
                    <option value="4">4 - Writing</option>
                    <option value="5">5 - Reading</option>
                    <option value="6">6 - Listening</option>
                    <option value="*">* - Previous</option>
                    <option value="#"># - Confirm</option>
                  </select>
                </div>
              </div>

              <button
                onClick={sendTestWebhook}
                disabled={isLoading}
                className="type-sans"
                style={{
                  ...buttonStyle,
                  width: '100%',
                  background: isLoading ? 'transparent' : 'var(--foreground)',
                  color: isLoading ? 'var(--text-tertiary)' : 'var(--background)',
                }}
              >
                {isLoading ? 'Sending...' : 'Send Test Webhook'}
              </button>
            </div>

            {/* Data Operations */}
            <div style={{ padding: '1rem', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '1rem' }}>Data Operations</h3>

              <button
                onClick={clearNavigationHistory}
                className="type-sans"
                style={{
                  ...buttonStyle,
                  width: '100%',
                  marginBottom: '0.75rem',
                  color: '#dc2626',
                  borderColor: '#dc2626',
                }}
              >
                Clear Navigation History
              </button>

              {/* Response Display */}
              {lastResponse && (
                <div>
                  <label style={labelStyle}>Last Response</label>
                  <pre
                    style={{
                      fontSize: '11px',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '0.5rem',
                      overflow: 'auto',
                      maxHeight: '150px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload */}
      <PhotoManager />

      {/* Content Manager */}
      <ContentManager />
    </div>
  );
}
