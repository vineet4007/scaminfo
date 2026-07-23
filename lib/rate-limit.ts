import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/utils";

type Bucket = {
  tokens: number;
  updatedAt: number;
  lastSeenAt: number;
};

export type TokenBucketPolicy = {
  capacity: number;
  refillTokensPerSecond: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  retryAfterSeconds: number;
};

const globalRateLimitStore = globalThis as typeof globalThis & {
  scamInfoTokenBuckets?: Map<string, Bucket>;
  scamInfoTokenBucketLastCleanup?: number;
};

const buckets = globalRateLimitStore.scamInfoTokenBuckets ?? new Map<string, Bucket>();
globalRateLimitStore.scamInfoTokenBuckets = buckets;

const BUCKET_TTL_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function policy(capacityKey: string, refillKey: string, capacity: number, refillTokensPerSecond: number): TokenBucketPolicy {
  return {
    capacity: positiveNumber(process.env[capacityKey], capacity),
    refillTokensPerSecond: positiveNumber(process.env[refillKey], refillTokensPerSecond),
  };
}

export const rateLimitPolicies = {
  adminLogin: policy("RATE_LIMIT_LOGIN_CAPACITY", "RATE_LIMIT_LOGIN_REFILL_PER_SECOND", 5, 1 / 60),
  verifyUrl: policy("RATE_LIMIT_VERIFY_CAPACITY", "RATE_LIMIT_VERIFY_REFILL_PER_SECOND", 8, 8 / 60),
  analyticsWrite: policy("RATE_LIMIT_ANALYTICS_CAPACITY", "RATE_LIMIT_ANALYTICS_REFILL_PER_SECOND", 120, 2),
  adminRead: policy("RATE_LIMIT_ADMIN_READ_CAPACITY", "RATE_LIMIT_ADMIN_READ_REFILL_PER_SECOND", 60, 1),
};

function cleanupExpiredBuckets(now: number) {
  const lastCleanup = globalRateLimitStore.scamInfoTokenBucketLastCleanup ?? 0;
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastSeenAt > BUCKET_TTL_MS) {
      buckets.delete(key);
    }
  }

  globalRateLimitStore.scamInfoTokenBucketLastCleanup = now;
}

export function consumeTokenBucket(key: string, tokenBucketPolicy: TokenBucketPolicy, now = Date.now()): RateLimitResult {
  cleanupExpiredBuckets(now);

  const capacity = Math.max(1, tokenBucketPolicy.capacity);
  const refillRate = Math.max(Number.EPSILON, tokenBucketPolicy.refillTokensPerSecond);
  const existing = buckets.get(key);
  const elapsedSeconds = existing ? Math.max(0, now - existing.updatedAt) / 1000 : 0;
  const availableTokens = existing
    ? Math.min(capacity, existing.tokens + elapsedSeconds * refillRate)
    : capacity;
  const allowed = availableTokens >= 1;
  const tokens = allowed ? availableTokens - 1 : availableTokens;

  buckets.set(key, { tokens, updatedAt: now, lastSeenAt: now });

  return {
    allowed,
    limit: Math.floor(capacity),
    remaining: Math.max(0, Math.floor(tokens)),
    resetAfterSeconds: Math.max(1, Math.ceil((capacity - tokens) / refillRate)),
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((1 - tokens) / refillRate)),
  };
}

function setRateLimitHeaders(response: Response, result: RateLimitResult) {
  response.headers.set("RateLimit-Limit", String(result.limit));
  response.headers.set("RateLimit-Remaining", String(result.remaining));
  response.headers.set("RateLimit-Reset", String(result.resetAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));

  if (!result.allowed) {
    response.headers.set("Retry-After", String(result.retryAfterSeconds));
  }

  return response;
}

function clientIdentifier(request: NextRequest) {
  return getClientIp(request) ?? "unknown-client";
}

export function enforceRateLimit(
  request: NextRequest,
  scope: string,
  tokenBucketPolicy: TokenBucketPolicy,
) {
  const result = consumeTokenBucket(`${scope}:${clientIdentifier(request)}`, tokenBucketPolicy);

  if (!result.allowed) {
    return setRateLimitHeaders(
      NextResponse.json(
        { error: "Too many requests", retryAfterSeconds: result.retryAfterSeconds },
        { status: 429 },
      ),
      result,
    );
  }

  return setRateLimitHeaders(NextResponse.next(), result);
}
