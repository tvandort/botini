import { Keyv } from "keyv";

const rateLimitWindow = 10 * 1000; // 10 second window in milliseconds
const maxRequests = 5; // Allow 5 requests per user per window

export class RateLimiter {
  #keyv: Keyv<any>;

  constructor() {
    this.#keyv = new Keyv();
  }

  async isUserRateLimited(username: string) {
    const key = `rateLimit:${username}`;

    // Retrieve the current request count and timestamp from Keyv
    const data = await this.#keyv.get(key);

    const currentTime = Date.now();

    if (data) {
      const { count, lastRequestTime } = data;

      if (currentTime - lastRequestTime > rateLimitWindow) {
        await this.#keyv.set(key, { count: 1, lastRequestTime: currentTime });

        return true; // The request is allowed
      }

      if (count < maxRequests) {
        await this.#keyv.set(key, { count: count + 1, lastRequestTime });

        return true; // The request is allowed
      } else {
        return false; // Exceeded the rate limit
      }
    } else {
      // If no data exists, create new record
      await this.#keyv.set(key, { count: 1, lastRequestTime: currentTime });

      return true; // The request is allowed
    }
  }
}
