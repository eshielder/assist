/**
 * In-memory sliding-window rate limiter.
 *
 * Intentionally simple: for a serverless deployment without a database,
 * the limit is per-instance. Vercel Functions reuse instances across
 * concurrent requests (Fluid Compute), so this gives a reasonable guard.
 * For production at scale, plug in Upstash Redis or similar.
 */

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(key: string, options: RateLimitOptions): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }
  entry.count += 1;
  if (entry.count > options.max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    const err = new Error(`Rate limit exceeded. Try again in ${retryAfter}s.`);
    (err as any).retryAfter = retryAfter;
    throw err;
  }
}

export function clientKey(req: Request): string {
  // Prefer forwarded IP header set by Vercel/proxies; fall back to a
  // coarse per-instance key so the limiter still works locally.
  const xf = (req as any).headers?.get?.("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "anonymous";
}