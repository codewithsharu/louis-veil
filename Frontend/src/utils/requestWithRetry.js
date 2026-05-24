import axios from 'axios';

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export default async function requestWithRetry(url, opts = {}, { retries = 3, backoff = 300 } = {}) {
  const cacheKey = `cache:${url}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, opts);
      try {
        const dataStr = JSON.stringify(res.data);
        localStorage.setItem(cacheKey, dataStr);
      } catch (e) {
        // ignore localStorage failures
      }
      return res;
    } catch (err) {
      const status = err?.response?.status;
      // If rate limited (429) or server error, try fallback to cache
      if (status === 429) {
        // if we have cached data, return it as a fake response shape
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return { data: JSON.parse(cached) };
        }
      }

      if (attempt < retries) {
        // exponential backoff
        await sleep(backoff * Math.pow(2, attempt));
        continue;
      }

      // final attempt failed — rethrow
      throw err;
    }
  }
}
