'use client';

import { useState } from 'react';
import PhotoManager from './PhotoManager';
import ContentManager from './ContentManager';
import ContactMessages from './ContactMessages';
import styles from './admin.module.css';

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
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div className={styles.adminHeaderInner}>
          <h1 className={styles.adminTitle}>Admin</h1>
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            className={`type-sans ${styles.buttonSecondary}`}
          >
            {showDevTools ? 'Hide' : 'Show'} Dev Tools
          </button>
        </div>
      </div>

      {/* Dev Tools (Collapsible) */}
      {showDevTools && (
        <div className={styles.devToolsSection}>
          <h2 className={styles.devToolsTitle}>Developer Tools</h2>

          <div className={styles.devToolsGrid}>
            {/* Webhook Testing */}
            <div className={styles.devToolsCard}>
              <h3 className={styles.devToolsCardTitle}>Webhook Simulation</h3>

              <div className={styles.gridTwo} style={{ marginBottom: '0.75rem' }}>
                <div>
                  <label className={styles.label}>Phone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={styles.input}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className={styles.label}>Digit</label>
                  <select
                    value={digit}
                    onChange={(e) => setDigit(e.target.value)}
                    className={styles.input}
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
                className={`type-sans ${isLoading ? styles.buttonLoading : styles.buttonPrimaryFull}`}
              >
                {isLoading ? 'Sending...' : 'Send Test Webhook'}
              </button>
            </div>

            {/* Data Operations */}
            <div className={styles.devToolsCard}>
              <h3 className={styles.devToolsCardTitle}>Data Operations</h3>

              <button
                onClick={clearNavigationHistory}
                className={`type-sans ${styles.buttonDanger} ${styles.buttonFull}`}
                style={{ marginBottom: '0.75rem' }}
              >
                Clear Navigation History
              </button>

              {/* Response Display */}
              {lastResponse && (
                <div>
                  <label className={styles.label}>Last Response</label>
                  <pre className={styles.codeBlock}>
                    {JSON.stringify(lastResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Messages */}
      <ContactMessages />

      {/* Photo Upload */}
      <PhotoManager />

      {/* Content Manager */}
      <ContentManager />
    </div>
  );
}
