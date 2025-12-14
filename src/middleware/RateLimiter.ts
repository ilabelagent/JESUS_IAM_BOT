/**
 * Rate Limiter - Prevents spam and abuse
 */

interface RateLimitEntry {
  count: number;
  lastReset: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(userId: string): boolean {
    const now = Date.now();
    let entry = this.limits.get(userId);

    if (!entry || now - entry.lastReset > this.windowMs) {
      entry = { count: 0, lastReset: now };
    }

    entry.count++;
    this.limits.set(userId, entry);

    return entry.count <= this.maxRequests;
  }

  getRemainingRequests(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry) {
      return this.maxRequests;
    }

    const now = Date.now();
    if (now - entry.lastReset > this.windowMs) {
      return this.maxRequests;
    }

    return Math.max(0, this.maxRequests - entry.count);
  }

  reset(userId: string): void {
    this.limits.delete(userId);
  }

  resetAll(): void {
    this.limits.clear();
  }
}
