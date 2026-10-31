'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const FIELD = 'border-0 border-b border-ink bg-transparent py-2 text-[17px] text-ink outline-none focus:border-ink-2';
const LABEL = 'flex flex-col gap-1.5 text-[13px] text-ink-3';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { name, email, message } = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setStatus('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to send message');
      form.reset();
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-[17px]">Thanks, your message is on its way.</p>
        <button type="button" onClick={() => setStatus('idle')} className="self-start text-[15px] text-ink-3 underline underline-offset-4 hover:text-ink">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      <h2 className="text-xs uppercase tracking-[0.1em] text-ink-3">Send a message</h2>
      <label className={LABEL}>
        Name
        <input name="name" type="text" required autoComplete="name" className={FIELD} />
      </label>
      <label className={LABEL}>
        Email
        <input name="email" type="email" required autoComplete="email" className={FIELD} />
      </label>
      <label className={LABEL}>
        Message
        <textarea name="message" rows={4} required className={`${FIELD} min-h-24 resize-y`} />
      </label>
      {status === 'error' && <p role="alert" className="text-[13px] text-ink">{error}</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="flex min-h-11 items-center self-start text-base underline underline-offset-4 hover:text-ink-2 disabled:text-ink-3"
      >
        {status === 'sending' ? 'Sending' : 'Send'}
      </button>
    </form>
  );
}
