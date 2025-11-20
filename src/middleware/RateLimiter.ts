/**
 * Rate Limiter - Prevents command spam
 */

export class RateLimiter {
  private requests: Map<string, number[]>;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove expired requests
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return true;
  }

  reset(userId: string): void {
    this.requests.delete(userId);
  }

  cleanup(): void {
    const now = Date.now();

    for (const [userId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        (timestamp) => now - timestamp < this.windowMs
      );

      if (validRequests.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, validRequests);
      }
    }
  }
}
