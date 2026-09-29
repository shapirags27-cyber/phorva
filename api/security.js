const rateLimit = require("express-rate-limit");

function parseAllowedOrigins() {
  return String(
    process.env.PHORVA_ALLOWED_ORIGINS || ""
  )
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

function corsOrigin(origin, callback) {
  /*
   * Non-browser clients do not send Origin.
   * They must remain allowed because Phorva's
   * machine-facing API is also used server-to-server.
   */
  if (!origin) {
    return callback(null, true);
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(null, false);
}

function createDeveloperRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many requests. Please try again later."
      }
    }
  });
}

function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many authentication attempts. Please try again later."
      }
    }
  });
}

function createApiRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message:
          "Too many API requests. Please try again later."
      }
    }
  });
}

/*
 * Browser session mutations must originate from
 * an explicitly trusted browser origin.
 *
 * Requests without Origin are allowed because curl,
 * SDKs and server-to-server integrations normally
 * do not send it.
 */
function requireTrustedOrigin(req, res, next) {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({
    error: {
      code: "ORIGIN_NOT_ALLOWED",
      message:
        "The request origin is not allowed"
    }
  });
}

module.exports = {
  allowedOrigins,
  corsOrigin,
  createDeveloperRateLimiter,
  createAuthRateLimiter,
  createApiRateLimiter,
  requireTrustedOrigin
};
