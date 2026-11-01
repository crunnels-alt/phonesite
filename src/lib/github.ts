const OWNER = 'crunnels-alt';
const API = 'https://api.github.com';
const ONE_DAY = 86400;

export interface RepoCommit {
  sha: string;
  message: string;
  date: string;
}

export interface RepoActivity {
  url: string | null;
  updatedAt: string;
  commits: RepoCommit[];
}

interface GitHubRepo {
  html_url: string;
  private: boolean;
}

interface GitHubCommit {
  sha: string;
  parents: unknown[];
  commit: { message: string; committer: { date: string } | null; author: { date: string } | null };
}

const SENSITIVE =
  /servicetitan|salary|\bpay\b|compensation|recruit|interview|job search|layoff|\bvest|secret|token|password|passw|credential|api[\s_-]?key|\.env|@|https?:\/\/|\+?\d[\d\s().-]{8,}\d/i;

const firstLine = (message: string) =>
  message
    .split('\n')[0]
    .replace(/\s*\(#\d+\)\s*$/, '')
    .trim();

async function getJson<T>(path: string, token: string | undefined): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: ONE_DAY },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getRepoActivity(repo: string, count = 3): Promise<RepoActivity | null> {
  const token = process.env.GITHUB_TOKEN || undefined;
  const [info, commits] = await Promise.all([
    getJson<GitHubRepo>(`/repos/${OWNER}/${repo}`, token),
    getJson<GitHubCommit[]>(`/repos/${OWNER}/${repo}/commits?per_page=20`, token),
  ]);
  if (!info || !Array.isArray(commits) || commits.length === 0) return null;

  const dateOf = (c: GitHubCommit) => c.commit.committer?.date ?? c.commit.author?.date ?? '';
  const updatedAt = dateOf(commits[0]);
  if (!updatedAt) return null;

  const recent = commits
    .filter((c) => c.parents.length < 2)
    .map((c) => ({ sha: c.sha, message: firstLine(c.commit.message), date: dateOf(c) }))
    .filter((c) => c.message && !/^merge\b/i.test(c.message) && !SENSITIVE.test(c.message))
    .slice(0, count);

  return { url: info.private ? null : info.html_url, updatedAt, commits: recent };
}
