'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { readAdminPassword, storeAdminPassword } from '@/lib/admin-client';


/** Asks for the admin password once per browser session, then renders children with it. */
export function AdminGate({ children }: { children: (password: string) => ReactNode }) {
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => setPassword(readAdminPassword()), []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: input }),
    });
    const { authenticated } = await response.json();
    if (!authenticated) {
      setError('Wrong password. Try again.');
      return;
    }
    storeAdminPassword(input);
    setPassword(input);
  };

  if (password) return <>{children(password)}</>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-24 grid max-w-xs gap-3 px-4 font-sans">
      <label htmlFor="admin-password" className="text-xs text-[var(--text-tertiary)]">
        Admin password
      </label>
      <input
        id="admin-password"
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        autoFocus
        className="border border-[var(--border-light)] bg-transparent px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!input}
        className="bg-[var(--foreground)] px-3 py-2 text-sm text-[var(--background)] disabled:opacity-40"
      >
        Open console
      </button>
    </form>
  );
}
