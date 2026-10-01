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

  const reviewRequired =
    verification.authorized === true &&
    verification.reviewRequired === true;

  return {
    verdict:
      reviewRequired
        ? "REVIEW_REQUIRED"
        : verification.authorized
          ? "AUTHORIZED"
          : "BLOCKED",
    reviewRequired,
    reviewReason:
      verification.reviewReason || null,
    baselineDecision:
      verification.baselineDecision || null,

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

    securityContext:
      verification.securityContext || null,

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
  agentStore,
  recordExecution,
  listExecutions,
  listReviews,
  getReview,
  updateReview,
  createSecurityAlert,
  listSecurityAlerts,
  resolveSecurityAlert
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

  router.get("/executions", async (req, res) => {
    try {
      if (typeof listExecutions !== "function") {
        return res.status(503).json({
          error: {
            code: "EXECUTION_LOG_UNAVAILABLE",
            message: "Execution log service is unavailable"
          }
        });
      }

      const limit = Math.min(
        Math.max(
          Number.parseInt(req.query.limit || "100", 10) || 100,
          1
        ),
        100
      );

      const projectId =
        req.phorvaIdentity?.projectId || null;

      if (!projectId) {
        return res.status(401).json({
          error: {
            code: "PROJECT_ID_REQUIRED",
            message: "Authenticated Phorva project is required"
          }
        });
      }

      const records = listExecutions({
        projectId,
        limit
      });

      return res.status(200).json({
        records
      });
    } catch (error) {
      console.error(
        "execution log error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "EXECUTION_LOG_FAILED",
          message: "Unable to load execution records"
        }
      });
    }
  });

  router.get("/reviews", async (req, res) => {
    try {
      const projectId =
        req.phorvaIdentity?.projectId || null;

      if (!projectId) {
        return res.status(401).json({
          error: "Project authentication required."
        });
      }

      const limit = Math.min(
        Math.max(
          Number(req.query.limit) || 100,
          1
        ),
        500
      );

      const records = listReviews({
        projectId,
        limit
      });

      return res.status(200).json({
        records
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message || "Failed to list reviews."
      });
    }
  });

  router.get(
    "/reviews/:verificationId",
    async (req, res) => {
      try {
        const projectId =
          req.phorvaIdentity?.projectId || null;

        if (!projectId) {
          return res.status(401).json({
            error: "Project authentication required."
          });
        }

        const record = getReview({
          projectId,
          verificationId:
            req.params.verificationId
        });

        if (!record) {
          return res.status(404).json({
            error: "Review not found."
          });
        }

        return res.status(200).json({
          record
        });
      } catch (error) {
        return res.status(500).json({
          error: error.message || "Failed to get review."
        });
      }
    }
  );

  router.post(
    "/reviews/:verificationId/approve",
    async (req, res) => {
      try {
        const projectId =
          req.phorvaIdentity?.projectId || null;

        if (!projectId) {
          return res.status(401).json({
            error: "Project authentication required."
          });
        }

        const updated = updateReview({
          projectId,
          verificationId:
            req.params.verificationId,
          decision: "APPROVED",
          reason:
            req.body?.reason || null
        });

        if (!updated) {
          return res.status(404).json({
            error: "Pending review not found."
          });
        }

        return res.status(200).json({
          review: updated.review,
          record: updated
        });
      } catch (error) {
        return res.status(400).json({
          error: error.message || "Failed to approve review."
        });
      }
    }
  );

  router.post(
    "/reviews/:verificationId/reject",
    async (req, res) => {
      try {
        const projectId =
          req.phorvaIdentity?.projectId || null;

        if (!projectId) {
          return res.status(401).json({
            error: "Project authentication required."
          });
        }

        const updated = updateReview({
          projectId,
          verificationId:
            req.params.verificationId,
          decision: "REJECTED",
          reason:
            req.body?.reason || null
        });

        if (!updated) {
          return res.status(404).json({
            error: "Pending review not found."
          });
        }

        return res.status(200).json({
          review: updated.review,
          record: updated
        });
      } catch (error) {
        return res.status(400).json({
          error: error.message || "Failed to reject review."
        });
      }
    }
  );

  router.get("/security-alerts", async (req, res) => {
    try {
      if (typeof listSecurityAlerts !== "function") {
        return res.status(503).json({
          error: {
            code: "SECURITY_ALERTS_UNAVAILABLE",
            message: "Security alert service is unavailable"
          }
        });
      }

      const projectId =
        req.phorvaIdentity?.projectId || null;

      if (!projectId) {
        return res.status(401).json({
          error: {
            code: "PROJECT_ID_REQUIRED",
            message: "Authenticated Phorva project is required"
          }
        });
      }

      const limit = Math.min(
        Math.max(
          Number.parseInt(
            req.query.limit || "100",
            10
          ) || 100,
          1
        ),
        100
      );

      const alerts = listSecurityAlerts({
        projectId,
        limit
      });

      return res.status(200).json({
        alerts
      });
    } catch (error) {
      console.error(
        "security alert list error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "SECURITY_ALERTS_FAILED",
          message: "Unable to load security alerts"
        }
      });
    }
  });

  router.post("/security-alerts/:id/resolve", async (req, res) => {
    try {
      if (typeof resolveSecurityAlert !== "function") {
        return res.status(503).json({
          error: {
            code: "SECURITY_ALERTS_UNAVAILABLE",
            message: "Security alert service is unavailable"
          }
        });
      }

      const projectId =
        req.phorvaIdentity?.projectId || null;

      if (!projectId) {
        return res.status(401).json({
          error: {
            code: "PROJECT_ID_REQUIRED",
            message: "Authenticated Phorva project is required"
          }
        });
      }

      const alertId =
        typeof req.params.id === "string"
          ? req.params.id.trim()
          : "";

      if (!alertId) {
        return res.status(400).json({
          error: {
            code: "ALERT_ID_REQUIRED",
            message: "Security alert ID is required"
          }
        });
      }

      const alert = resolveSecurityAlert({
        projectId,
        alertId
      });

      if (!alert) {
        return res.status(404).json({
          error: {
            code: "SECURITY_ALERT_NOT_FOUND",
            message:
              "Security alert not found for this project"
          }
        });
      }

      return res.status(200).json({
        alert
      });
    } catch (error) {
      console.error(
        "security alert resolve error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "SECURITY_ALERT_RESOLVE_FAILED",
          message: "Unable to resolve security alert"
        }
      });
    }
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

    /*
     * Agent identity enforcement:
     *
     * The API key authenticates the Phorva project.
     * The agent ID must then resolve to an active agent
     * belonging to that same authenticated project.
     *
     * An arbitrary agent ID, an agent from another project,
     * or a revoked agent must never reach the verification engine.
     */
    const projectId =
      req.phorvaIdentity?.projectId || null;

    if (!projectId) {
      return res.status(401).json({
        requestId,
        verificationId,
        error: {
          code: "PROJECT_ID_REQUIRED",
          message:
            "Authenticated Phorva project is required"
        }
      });
    }

    const requestedAgent =
      req.body?.agent || {};

    const requestedAgentId =
      requestedAgent.id ??
      requestedAgent.agentId ??
      null;

    const verifiedAgent =
      typeof agentStore?.getAgent === "function"
        ? agentStore.getAgent(
            projectId,
            requestedAgentId
          )
        : null;

    if (!verifiedAgent) {
      return res.status(403).json({
        requestId,
        verificationId,
        error: {
          code: "AGENT_NOT_AUTHORIZED",
          message:
            "Agent is not registered, is revoked, or is not authorized for this project"
        }
      });
    }

    /*
     * From this point onward, use the server-side agent
     * record as the authoritative identity.
     *
     * Caller-supplied agent.name/capabilities/policy are
     * not trusted as identity claims.
     */
    req.phorvaAgent = verifiedAgent;

    try {
      const result = await verify({
        ...req.body,
        phorvaIdentity: req.phorvaIdentity
      });

      const normalized =
        normalizeVerificationResult(result);

      if (typeof recordExecution === "function") {
        try {
          const securityContext =
            result?.securityContext ||
            normalized.securityContext ||
            {};

          const agent =
            req.phorvaAgent || {};

          const action =
            req.body?.action || {};

          const intent =
            req.body?.intent || {};

          const transaction =
            req.body?.transaction || {};

          const status =
              normalized.verdict === "AUTHORIZED"
                ? "VERIFIED"
                : normalized.verdict === "REVIEW_REQUIRED"
                  ? "REVIEW_REQUIRED"
                  : "BLOCKED";

            recordExecution({
            requestId,
            verificationId,

            projectId:
              securityContext.projectId ||
              req.phorvaIdentity?.projectId ||
              null,

            projectName:
              securityContext.projectName ||
              null,

            agentId:
              agent.id ??
              agent.agentId ??
              null,

            agentName:
              agent.name ||
              null,

            useCase:
              securityContext.useCases?.[0] ||
              null,

            status,

            risk:
              normalized.risk ||
              "LOW",

            actualTransactionAmount:
              normalized.actualTransactionAmount,

            requestedAmount:
              intent.amount ??
              transaction.amount ??
              null,

            actionType:
              action.type ||
              null,

            intentType:
              intent.type ||
              null,

            chain:
              intent.chain ||
              transaction.chainId ||
              null,

            protocol:
              intent.protocol ||
              null,

            securityProfileId:
              securityContext.securityProfileId ||
              null,

            baselineDecision:
              normalized.baselineDecision || null,
            policyPassed:
              normalized.policyPassed,

            intentMatched:
              normalized.intentMatch,

            parameterMatched:
              normalized.parameterMatched,

            executionTypeMatched:
              normalized.executionTypeMatched,

            nativeValueMatched:
              normalized.nativeValueMatched,

            protocolMatched:
              normalized.protocolMatched,

            transactionSecuritySafe:
              normalized.transactionSecuritySafe,

            transaction
          });
        } catch (recordingError) {
          console.error(
            `[${requestId}] execution record error:`,
            recordingError
          );
        }
      }

      /*
       * Security alert:
       * A blocked transaction is treated as an unauthorized execution
       * attempt only when the observed execution does not match the
       * agent's declared/verified intent or execution parameters.
       *
       * Ordinary policy blocks do not create this alert.
       */
      if (
        normalized.verdict === "BLOCKED" &&
        (
          normalized.intentMatch === false ||
          normalized.parameterMatched === false ||
          normalized.executionTypeMatched === false ||
          normalized.nativeValueMatched === false ||
          normalized.protocolMatched === false
        ) &&
        typeof createSecurityAlert === "function"
      ) {
        try {
          const securityContext =
            result?.securityContext ||
            normalized.securityContext ||
            {};

          const agent =
            req.body?.agent || {};

          const action =
            req.body?.action || {};

          const intent =
            req.body?.intent || {};

          const transaction =
            req.body?.transaction || {};

          const reasons = [];

          if (normalized.intentMatch === false) {
            reasons.push("declared intent does not match the observed execution");
          }

          if (normalized.parameterMatched === false) {
            reasons.push("transaction parameters do not match the verified intent");
          }

          if (normalized.executionTypeMatched === false) {
            reasons.push("execution type does not match the verified intent");
          }

          if (normalized.nativeValueMatched === false) {
            reasons.push("native transaction value does not match the verified intent");
          }

          if (normalized.protocolMatched === false) {
            reasons.push("protocol does not match the verified intent");
          }

          const reason =
            reasons.length > 0
              ? reasons.join("; ")
              : "observed transaction did not match the agent's verified execution intent";

          createSecurityAlert({
            projectId:
              securityContext.projectId ||
              req.phorvaIdentity?.projectId ||
              null,

            projectName:
              securityContext.projectName ||
              null,

            agentId:
              agent.id ??
              agent.agentId ??
              null,

            agentName:
              agent.name ||
              null,

            verificationId,
            requestId,

            type: "UNAUTHORIZED_EXECUTION_ATTEMPT",
            severity: "HIGH",

            title:
              "Unauthorized execution attempt detected",

            message:
              "Phorva blocked a transaction that did not match the agent's verified execution intent.",

            reason,

            transaction,

            metadata: {
              actionType:
                action.type ||
                null,

              intentType:
                intent.type ||
                null,

              requestedAmount:
                intent.amount ??
                transaction.amount ??
                null,

              actualTransactionAmount:
                normalized.actualTransactionAmount,

              risk:
                normalized.risk,

              intentMatched:
                normalized.intentMatch,

              parameterMatched:
                normalized.parameterMatched,

              executionTypeMatched:
                normalized.executionTypeMatched,

              nativeValueMatched:
                normalized.nativeValueMatched,

              protocolMatched:
                normalized.protocolMatched
            }
          });
        } catch (alertError) {
          console.error(
            `[${requestId}] security alert error:`,
            alertError
          );
        }
      }

      return res.status(200).json({
        requestId,
        verificationId,
        ...normalized
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
