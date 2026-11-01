/** fetch that carries the admin session cookie. */
export function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  return fetch(input, { ...init, credentials: 'same-origin' });
}

const readAuthenticated = async (response: Response): Promise<boolean> => {
  try {
    const { authenticated } = (await response.json()) as { authenticated?: boolean };
    return authenticated === true;
  } catch {
    return false;
  }
};

export async function checkAdminSession(): Promise<boolean> {
  try {
    return await readAuthenticated(await adminFetch('/api/admin/auth', { cache: 'no-store' }));
  } catch {
    return false;
  }
}

export async function signInAdmin(password: string): Promise<boolean> {
  const response = await adminFetch('/api/admin/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return readAuthenticated(response);
}

export async function signOutAdmin(): Promise<void> {
  try {
    await adminFetch('/api/admin/auth', { method: 'DELETE' });
  } catch {}
}
