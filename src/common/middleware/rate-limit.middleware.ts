import rateLimit from "express-rate-limit";

const createRateLimitMessage = (message: string) => ({
  message,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createRateLimitMessage("Too many API requests, please try again later"),
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createRateLimitMessage("Too many auth attempts, please try again after 10 minutes"),
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createRateLimitMessage("Too many write requests, please slow down"),
});

export { apiLimiter, authLimiter, writeLimiter };
