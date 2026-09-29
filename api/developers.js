const crypto = require("crypto");

const SESSION_TTL_MS =
  1000 * 60 * 60 * 24 * 7;

const PASSWORD_KEYLEN = 64;
const PASSWORD_SALT_BYTES = 16;
const SESSION_BYTES = 32;

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validateEmail(email) {
  if (!email || email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      PASSWORD_KEYLEN,
      {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 128 * 1024 * 1024
      },
      (error, derivedKey) => {
        if (error) {
          return reject(error);
        }

        resolve(derivedKey.toString("hex"));
      }
    );
  });
}

async function createPasswordHash(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  ) {
    throw new Error(
      "Password must be between 12 and 128 characters"
    );
  }

  const salt = crypto
    .randomBytes(PASSWORD_SALT_BYTES)
    .toString("hex");

  const hash =
    await hashPassword(password, salt);

  return {
    algorithm: "scrypt",
    salt,
    hash
  };
}

async function verifyPassword(password, stored) {
  if (
    typeof password !== "string" ||
    !stored ||
    stored.algorithm !== "scrypt" ||
    !stored.salt ||
    !stored.hash
  ) {
    return false;
  }

  const derived =
    await hashPassword(
      password,
      stored.salt
    );

  const expected =
    Buffer.from(stored.hash, "hex");

  const actual =
    Buffer.from(derived, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    actual
  );
}

function hashSessionToken(token) {
  return crypto
    .createHash("sha256")
    .update(token, "utf8")
    .digest("hex");
}

function createDeveloperStore(db) {
  function createDeveloper({
    email,
    password
  }) {
    const normalizedEmail =
      normalizeEmail(email);

    if (!validateEmail(normalizedEmail)) {
      const error = new Error(
        "A valid email address is required"
      );

      error.code = "INVALID_EMAIL";

      throw error;
    }

    const existing =
      db.load().developers.find(
        developer =>
          developer.email ===
          normalizedEmail
      );

    if (existing) {
      const error = new Error(
        "Developer account already exists"
      );

      error.code = "DEVELOPER_EXISTS";

      throw error;
    }

    return {
      create: async () => {
        const passwordHash =
          await createPasswordHash(password);

        return db.withData(data => {
          const developer = {
            id:
              `dev_${crypto.randomUUID()}`,

            email:
              normalizedEmail,

            password_hash:
              passwordHash,

            status: "active",

            created_at:
              new Date().toISOString(),

            updated_at:
              new Date().toISOString()
          };

          if (
            !Array.isArray(
              data.developers
            )
          ) {
            data.developers = [];
          }

          data.developers.push(
            developer
          );

          return {
            id: developer.id,
            email: developer.email,
            status: developer.status,
            created_at:
              developer.created_at
          };
        });
      }
    };
  }

  function getByEmail(email) {
    const normalizedEmail =
      normalizeEmail(email);

    const data = db.load();

    return data.developers.find(
      developer =>
        developer.email ===
        normalizedEmail
    ) || null;
  }

  function getById(id) {
    const data = db.load();

    return data.developers.find(
      developer =>
        developer.id === id
    ) || null;
  }

  async function authenticate(
    email,
    password
  ) {
    const developer =
      getByEmail(email);

    if (!developer) {
      return null;
    }

    if (developer.status !== "active") {
      return null;
    }

    const valid =
      await verifyPassword(
        password,
        developer.password_hash
      );

    if (!valid) {
      return null;
    }

    return {
      id: developer.id,
      email: developer.email,
      status: developer.status
    };
  }

  function createSession(
    developerId
  ) {
    const developer =
      getById(developerId);

    if (
      !developer ||
      developer.status !== "active"
    ) {
      throw new Error(
        "Developer account is not active"
      );
    }

    const token =
      crypto.randomBytes(
        SESSION_BYTES
      ).toString("base64url");

    const tokenHash =
      hashSessionToken(token);

    const now =
      Date.now();

    const expiresAt =
      new Date(
        now + SESSION_TTL_MS
      ).toISOString();

    db.withData(data => {
      if (
        !Array.isArray(
          data.sessions
        )
      ) {
        data.sessions = [];
      }

      data.sessions.push({
        id:
          `sess_${crypto.randomUUID()}`,

        developer_id:
          developerId,

        token_hash:
          tokenHash,

        created_at:
          new Date(now).toISOString(),

        expires_at:
          expiresAt,

        revoked_at: null
      });
    });

    return {
      token,
      expiresAt
    };
  }

  function authenticateSession(
    token
  ) {
    if (
      typeof token !== "string" ||
      !token
    ) {
      return null;
    }

    const tokenHash =
      hashSessionToken(token);

    const data =
      db.load();

    const session =
      data.sessions.find(
        item =>
          item.token_hash ===
            tokenHash &&
          !item.revoked_at
      );

    if (!session) {
      return null;
    }

    if (
      Date.parse(
        session.expires_at
      ) <= Date.now()
    ) {
      db.withData(data => {
        data.sessions =
          data.sessions.filter(
            item =>
              item.id !==
              session.id
          );
      });

      return null;
    }

    const developer =
      data.developers.find(
        item =>
          item.id ===
          session.developer_id
      );

    if (
      !developer ||
      developer.status !== "active"
    ) {
      return null;
    }

    return {
      developerId:
        developer.id,

      email:
        developer.email,

      sessionId:
        session.id
    };
  }

  function revokeSession(token) {
    if (
      typeof token !== "string" ||
      !token
    ) {
      return false;
    }

    const tokenHash =
      hashSessionToken(token);

    let revoked = false;

    db.withData(data => {
      const session =
        data.sessions.find(
          item =>
            item.token_hash ===
            tokenHash &&
            !item.revoked_at
        );

      if (!session) {
        return;
      }

      session.revoked_at =
        new Date().toISOString();

      revoked = true;
    });

    return revoked;
  }

  return {
    createDeveloper,
    getByEmail,
    getById,
    authenticate,
    createSession,
    authenticateSession,
    revokeSession
  };
}

module.exports = {
  createDeveloperStore
};
