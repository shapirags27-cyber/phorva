const crypto = require("crypto");

function createVerificationId() {
  return `ver_${crypto.randomUUID()}`;
}

function createRequestId() {
  return `req_${crypto.randomUUID()}`;
}

function validateVerifyRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }

  if (!body.agent || typeof body.agent !== "object") {
    return "agent is required";
  }

  const agentId =
    body.agent.id ??
    body.agent.agentId;

  if (!agentId || typeof agentId !== "string") {
    return "agent.id is required";
  }

  if (!body.action || typeof body.action !== "object") {
    return "action is required";
  }

  if (!body.intent || typeof body.intent !== "object") {
    return "intent is required";
  }

  if (!body.transaction || typeof body.transaction !== "object") {
    return "transaction is required";
  }

  if (!body.intent.type || typeof body.intent.type !== "string") {
    return "intent.type is required";
  }

  if (!body.action.type || typeof body.action.type !== "string") {
    return "action.type is required";
  }

  if (
    body.transaction.chainId !== undefined &&
    !Number.isInteger(body.transaction.chainId)
  ) {
    return "transaction.chainId must be an integer";
  }

  if (
    body.transaction.to !== undefined &&
    typeof body.transaction.to !== "string"
  ) {
    return "transaction.to must be a string";
  }

  if (
    body.transaction.calldata !== undefined &&
    typeof body.transaction.calldata !== "string"
  ) {
    return "transaction.calldata must be a string";
  }

  if (
    body.transaction.data !== undefined &&
    typeof body.transaction.data !== "string"
  ) {
    return "transaction.data must be a string";
  }

  return null;
}

function normalizeVerificationResult(result) {
  const verification = result || {};
  const analysis = verification.analysis || {};

  let risk = "LOW";

  if (!verification.authorized) {
    risk = "HIGH";
  }

  if (
    analysis.risk === "CRITICAL" ||
    analysis.risk === "HIGH"
  ) {
    risk = "HIGH";
  }

  return {
    verdict: verification.authorized
      ? "AUTHORIZED"
      : "BLOCKED",

    risk,

    intentMatch:
      verification.intentMatched === true,

    policyPassed:
      verification.policyPassed === true,

    capabilityAllowed:
      verification.capabilityAllowed === true,

    velocityAllowed:
      verification.velocityAllowed === true,

    quarantineAllowed:
      verification.quarantineAllowed === true,

    authorizationPassed:
      verification.authorized === true,

    executionTypeMatched:
      verification.executionTypeMatched === true,

    parameterMatched:
      verification.parameterMatched === true,

    nativeValueMatched:
      verification.nativeValueMatched === true,

    protocolMatched:
      verification.protocolMatched === true,

    transactionSecuritySafe:
      verification.transactionSecuritySafe === true,

    actualTransactionAmount:
      verification.actualTransactionAmount,

    parameterChecks:
      verification.parameterChecks || {},

    analysis,

    message:
      verification.authorized
        ? "Transaction satisfies Phorva verification requirements."
        : "Transaction was blocked by Phorva verification."
  };
}

function createProductionApi({
  express,
  verify,
  getHealth,
  authenticate,
  agentStore
}) {
  const router = express.Router();

  router.use(async (req, res, next) => {
    if (typeof authenticate !== "function") {
      return next();
    }

    try {
      const authenticated = await authenticate(req);

      if (!authenticated) {
        return res.status(401).json({
          requestId: createRequestId(),
          error: {
            code: "UNAUTHORIZED",
            message: "Valid Phorva API credentials are required"
          }
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        requestId: createRequestId(),
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication failed"
        }
      });
    }
  });

  router.get("/health", async (req, res) => {
    const requestId = createRequestId();

    try {
      const health =
        typeof getHealth === "function"
          ? await getHealth()
          : {
              status: "ok",
              service: "phorva-api"
            };

      return res.status(200).json({
        requestId,
        ...health
      });
    } catch (error) {
      return res.status(503).json({
        requestId,
        status: "unavailable",
        service: "phorva-api"
      });
    }
  });

  router.post("/agents", async (req, res) => {
    try {
      const projectId =
        req.phorvaIdentity?.projectId;

      if (!projectId) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Authenticated project is required"
          }
        });
      }

      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "";

      if (!name) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message: "Agent name is required"
          }
        });
      }

      const agent =
        agentStore.createAgent({
          projectId,
          name,
          capabilities:
            Array.isArray(req.body?.capabilities)
              ? req.body.capabilities
              : [],
          policy:
            req.body?.policy &&
            typeof req.body.policy === "object"
              ? req.body.policy
              : {}
        });

      return res.status(201).json({
        agent
      });
    } catch (error) {
      return res.status(400).json({
        error: {
          code: "AGENT_REGISTRATION_FAILED",
          message: error.message
        }
      });
    }
  });

  router.get("/agents", async (req, res) => {
    const projectId =
      req.phorvaIdentity?.projectId;

    if (!projectId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated project is required"
        }
      });
    }

    return res.json({
      agents: agentStore.list(projectId)
    });
  });

  router.patch("/agents/:id/capabilities", async (req, res) => {
    const projectId =
      req.phorvaIdentity?.projectId;

    if (!projectId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated project is required"
        }
      });
    }

    const agent =
      agentStore.getAgent(
        projectId,
        req.params.id
      );

    if (!agent) {
      return res.status(404).json({
        error: {
          code: "AGENT_NOT_FOUND",
          message: "Agent not found or revoked"
        }
      });
    }

    if (!Array.isArray(req.body?.capabilities)) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "capabilities must be an array"
        }
      });
    }

    const updated =
      agentStore.updateCapabilities(
        projectId,
        req.params.id,
        req.body.capabilities
      );

    return res.json({
      agent: updated
    });
  });

  router.patch("/agents/:id/policy", async (req, res) => {
    const projectId =
      req.phorvaIdentity?.projectId;

    if (!projectId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated project is required"
        }
      });
    }

    const agent =
      agentStore.getAgent(
        projectId,
        req.params.id
      );

    if (!agent) {
      return res.status(404).json({
        error: {
          code: "AGENT_NOT_FOUND",
          message: "Agent not found or revoked"
        }
      });
    }

    if (
      !req.body?.policy ||
      typeof req.body.policy !== "object" ||
      Array.isArray(req.body.policy)
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "policy must be an object"
        }
      });
    }

    const updated =
      agentStore.updatePolicy(
        projectId,
        req.params.id,
        req.body.policy
      );

    return res.json({
      agent: updated
    });
  });

  router.post("/agents/:id/revoke", async (req, res) => {
    const projectId =
      req.phorvaIdentity?.projectId;

    if (!projectId) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated project is required"
        }
      });
    }

    const revoked =
      agentStore.revoke(
        projectId,
        req.params.id
      );

    if (!revoked) {
      return res.status(404).json({
        error: {
          code: "AGENT_NOT_FOUND",
          message: "Agent not found or already revoked"
        }
      });
    }

    return res.json({
      revoked: true,
      id: req.params.id
    });
  });

  router.post("/verify", async (req, res) => {
    const requestId = createRequestId();
    const verificationId = createVerificationId();

    const validationError =
      validateVerifyRequest(req.body);

    if (validationError) {
      return res.status(400).json({
        requestId,
        verificationId,
        error: {
          code: "INVALID_REQUEST",
          message: validationError
        }
      });
    }

    if (typeof verify !== "function") {
      return res.status(503).json({
        requestId,
        verificationId,
        error: {
          code: "VERIFICATION_ENGINE_UNAVAILABLE",
          message:
            "Phorva verification engine is unavailable"
        }
      });
    }

    try {
      const result = await verify({
        ...req.body,
        phorvaIdentity: req.phorvaIdentity
      });

      return res.status(200).json({
        requestId,
        verificationId,
        ...normalizeVerificationResult(result)
      });
    } catch (error) {
      console.error(
        `[${requestId}] verification error:`,
        error
      );

      return res.status(400).json({
        requestId,
        verificationId,
        error: {
          code: "VERIFICATION_FAILED",
          message:
            error.message ||
            "Phorva verification failed"
        }
      });
    }
  });

  return router;
}

module.exports = {
  createProductionApi,
  validateVerifyRequest
};
