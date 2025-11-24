'use client';

import { useState, FormEvent } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Failed to send message');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <p className="type-serif-italic" style={{ fontSize: '18px', marginBottom: '1rem' }}>
          Thank you for your message
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="type-sans"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-light)',
            padding: '0.5rem 1rem',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="name"
          className="type-sans"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.05em',
          }}
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontFamily: 'inherit',
            fontSize: '16px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="email"
          className="type-sans"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.05em',
          }}
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontFamily: 'inherit',
            fontSize: '16px',
          }}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="message"
          className="type-sans"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.05em',
          }}
        >
          Message
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          rows={5}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid var(--border-light)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontFamily: 'inherit',
            fontSize: '16px',
            resize: 'vertical',
          }}
        />
      </div>

      {status === 'error' && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            fontSize: '14px',
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="type-sans"
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '1px solid var(--foreground)',
          background: status === 'loading' ? 'var(--foreground)' : 'transparent',
          color: status === 'loading' ? 'var(--background)' : 'var(--foreground)',
          fontSize: '13px',
          letterSpacing: '0.05em',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (status !== 'loading') {
            e.currentTarget.style.background = 'var(--foreground)';
            e.currentTarget.style.color = 'var(--background)';
          }
        }}
        onMouseLeave={(e) => {
          if (status !== 'loading') {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--foreground)';
          }
        }}
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
