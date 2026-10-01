const crypto = require("crypto");

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(10).toString("hex")}`;
}

function normalizeOptionalLimit(value, fieldName) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(
      `${fieldName} must be a non-negative number when provided.`
    );
  }

  return number;
}

function createSecurityProfile({
  useCase,
  maxTransactionAmount,
  agentTransactionLimit,
  dailyLimit
}) {
  if (!useCase) {
    throw new Error("useCase is required.");
  }

  return {
    id: createId("profile"),
    version: "phorva-security-profile-v1",

    useCase,

    explicitLimits: {
      maxTransactionAmount: normalizeOptionalLimit(
        maxTransactionAmount,
        "maxTransactionAmount"
      ),

      agentTransactionLimit: normalizeOptionalLimit(
        agentTransactionLimit,
        "agentTransactionLimit"
      ),

      dailyLimit: normalizeOptionalLimit(
        dailyLimit,
        "dailyLimit"
      )
    },

    adaptiveBaseline: {
      enabled: true,
      status: "INITIALIZING",
      observationCount: 0,
      normalRange: null
    },

    createdAt: new Date().toISOString()
  };
}

module.exports = {
  createSecurityProfile
};
