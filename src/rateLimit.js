const buckets = new Map();

function rateLimit({ windowMs, max, message }) {
  return function limiter(req, res, next) {
    const key = `${req.ip}:${req.baseUrl || req.path}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || now > existing.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= max) {
      return res.status(429).json({ error: message || "Too many requests" });
    }

    existing.count += 1;
    return next();
  };
}

module.exports = { rateLimit };
