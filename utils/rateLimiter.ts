interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  check(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const aiChatRateLimiter = new RateLimiter();

setInterval(() => {
  aiChatRateLimiter.cleanup();
}, 60000);
