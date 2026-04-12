type RateLimitBucket = {
  hits: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const MAX_BUCKET_COUNT = 5_000;

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();

  if (rateLimitBuckets.size > MAX_BUCKET_COUNT) {
    pruneExpiredBuckets(now);
  }

  const currentBucket = rateLimitBuckets.get(key);

  if (!currentBucket || currentBucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      hits: 1,
      resetAt: now + windowMs,
    });

    return true;
  }

  if (currentBucket.hits >= maxAttempts) {
    return false;
  }

  currentBucket.hits += 1;
  rateLimitBuckets.set(key, currentBucket);

  return true;
}
