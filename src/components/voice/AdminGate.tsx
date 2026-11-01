'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { checkAdminSession, signInAdmin, signOutAdmin } from '@/lib/admin-client';

type GateState = 'checking' | 'signed-out' | 'signed-in';

/** Asks for the admin password when there is no admin session, then renders children. */
export function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>('checking');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => setState((await checkAdminSession()) ? 'signed-in' : 'signed-out');
    load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      if (!(await signInAdmin(input))) {
        setError('Wrong password. Try again.');
        return;
      }
    } catch {
      setError('Sign-in failed. Try again.');
      return;
    }
    setInput('');
    setState('signed-in');
  };

  const handleSignOut = async () => {
    await signOutAdmin();
    setState('signed-out');
  };

  if (state === 'checking') return null;

  if (state === 'signed-in') {
    return (
      <>
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={handleSignOut} className="text-xs text-[var(--text-tertiary)] hover:underline">
            Sign out
          </button>
        </div>
        {children}
      </>
    );
  }

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
