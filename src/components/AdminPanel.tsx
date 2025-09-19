'use client';

import { useState } from 'react';

export default function AdminPanel() {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [digit, setDigit] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<unknown>(null);

  const sendTestWebhook = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          digit,
        }),
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
      const response = await fetch('/api/users', {
        method: 'DELETE',
      });
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to clear navigation history' });
    }
  };

  const fetchNavigationData = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setLastResponse(result);
    } catch {
      setLastResponse({ error: 'Failed to fetch navigation data' });
    }
  };

  return (
    <div className="experimental-grid" style={{ gridTemplateRows: 'auto 1fr auto', minHeight: '60vh' }}>

      {/* Header */}
      <div
        className="type-display"
        style={{
          gridColumn: '1 / 13',
          gridRow: '1',
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          lineHeight: '0.9',
          marginBottom: '2rem',
          transform: 'rotate(-0.5deg)'
        }}
      >
        DEVELOPMENT_INTERFACE
      </div>

      {/* Test Controls */}
      <div
        style={{
          gridColumn: '1 / 12',
          gridRow: '2',
          display: 'grid',
          gap: '2rem'
        }}
      >
        {/* Webhook Testing */}
        <div
          style={{
            border: '1px solid var(--accent-gray)',
            padding: '1.5rem',
            opacity: 0.8
          }}
        >
          <div className="type-mono text-xs mb-4 opacity-60">
            WEBHOOK_SIMULATION
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div className="type-mono text-xs mb-2 opacity-60">
                PHONE_NUMBER
              </div>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="type-mono text-sm"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--accent-gray)',
                  background: 'transparent',
                  color: 'var(--foreground)'
                }}
                placeholder="+1234567890"
              />
            </div>

            <div>
              <div className="type-mono text-xs mb-2 opacity-60">
                DIGIT_INPUT
              </div>
              <select
                value={digit}
                onChange={(e) => setDigit(e.target.value)}
                className="type-mono text-sm"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid var(--accent-gray)',
                  background: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              >
                <option value="1">1_ABOUT</option>
                <option value="2">2_PROJECTS</option>
                <option value="3">3_PHOTO</option>
                <option value="4">4_WRITING</option>
                <option value="0">0_HOME</option>
                <option value="*">*_PREVIOUS</option>
                <option value="#">#_CONFIRM</option>
              </select>
            </div>
          </div>

          <button
            onClick={sendTestWebhook}
            disabled={isLoading}
            className="type-mono text-xs uppercase tracking-wide hover-glitch"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${isLoading ? 'var(--accent-gray)' : 'var(--accent-red)'}`,
              background: 'transparent',
              color: isLoading ? 'var(--accent-gray)' : 'var(--accent-red)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'TRANSMITTING...' : 'EXECUTE_WEBHOOK'}
          </button>
        </div>

        {/* Data Controls */}
        <div
          style={{
            border: '1px solid var(--accent-gray)',
            padding: '1.5rem',
            opacity: 0.8
          }}
        >
          <div className="type-mono text-xs mb-4 opacity-60">
            DATA_OPERATIONS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={fetchNavigationData}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                padding: '0.75rem',
                border: '1px solid var(--accent-blue)',
                background: 'transparent',
                color: 'var(--accent-blue)',
                cursor: 'pointer'
              }}
            >
              FETCH_DATA
            </button>

            <button
              onClick={clearNavigationHistory}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                padding: '0.75rem',
                border: '1px solid var(--accent-red)',
                background: 'transparent',
                color: 'var(--accent-red)',
                cursor: 'pointer'
              }}
            >
              PURGE_HISTORY
            </button>
          </div>
        </div>
      </div>

      {/* Response Output */}
      {lastResponse && (
        <div
          style={{
            gridColumn: '13 / 24',
            gridRow: '2',
            border: '1px solid var(--accent-gray)',
            padding: '1.5rem',
            opacity: 0.8
          }}
        >
          <div className="type-mono text-xs mb-4 opacity-60">
            SYSTEM_RESPONSE
          </div>
          <pre
            className="type-mono text-xs"
            style={{
              color: 'var(--foreground)',
              lineHeight: '1.4',
              opacity: 0.8,
              whiteSpace: 'pre-wrap',
              overflow: 'auto',
              maxHeight: '300px'
            }}
          >
            {JSON.stringify(lastResponse, null, 2)}
          </pre>
        </div>
      )}

      {/* Status Indicator */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '20 / 24',
          gridRow: '3',
          opacity: 0.3,
          textAlign: 'right',
          alignSelf: 'end'
        }}
      >
        <div>DEVELOPMENT_MODE</div>
        <div>STATUS: ACTIVE</div>
      </div>

    </div>
  );
}