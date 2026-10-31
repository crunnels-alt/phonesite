import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

/** The site's Upstash Redis (provisioned as Vercel KV, so it keeps the KV_* variable names). Null when unconfigured. */
export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token } = process.env;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}
