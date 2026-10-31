const STORAGE_KEY = 'phonesite-admin-password';

export function readAdminPassword(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeAdminPassword(password: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, password);
  } catch {}
}

export function clearAdminPassword(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** fetch with the admin password from this browser session attached. */
export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${readAdminPassword()}`);
  return fetch(input, { ...init, headers });
}
