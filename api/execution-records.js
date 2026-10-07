const crypto = require("crypto");

function createExecutionRecordStore(db) {
  function createRecord({
    requestId,
    verificationId,
    projectId,
    projectName,
    agentId,
    agentName,
    useCase,
    status,
    risk,
    actualTransactionAmount,
    requestedAmount,
    actionType,
    intentType,
    chain,
    protocol,
    securityProfileId,
    baselineDecision,
    dailyLimit,
    policyPassed,
    intentMatched,
    parameterMatched,
    executionTypeMatched,
    nativeValueMatched,
    protocolMatched,
    transactionSecuritySafe,
    capabilityAllowed,
    transaction
  }) {
    const now = new Date().toISOString();

    const record = {
      id: `exec_${crypto.randomUUID()}`,
      request_id: requestId || null,
      verification_id: verificationId || null,

      project_id: projectId || null,
      project_name: projectName || null,

      agent_id: agentId || null,
      agent_name: agentName || null,

      use_case: useCase || null,

      status: status || "UNKNOWN",
      risk: risk || "LOW",

      review: {
        required:
          status === "REVIEW_REQUIRED",
        status:
          status === "REVIEW_REQUIRED"
            ? "PENDING"
            : "NOT_REQUIRED",
        reason: null,
        decision: null,
        reviewed_at: null
      },

      requested_amount:
        requestedAmount !== undefined &&
        requestedAmount !== null
          ? String(requestedAmount)
          : null,

      actual_transaction_amount:
        actualTransactionAmount !== undefined &&
        actualTransactionAmount !== null &&
        Number.isFinite(Number(actualTransactionAmount))
          ? Number(actualTransactionAmount)
          : null,

      action_type: actionType || null,
      intent_type: intentType || null,

      chain: chain || null,
      protocol: protocol || null,

      security_profile_id:
        securityProfileId || null,

      baseline_decision:
        baselineDecision || null,

      daily_limit:
        dailyLimit !== undefined &&
        dailyLimit !== null &&
        Number.isFinite(Number(dailyLimit))
          ? Number(dailyLimit)
          : null,

      checks: {
        policyPassed: policyPassed === true,
        intentMatched: intentMatched === true,
        parameterMatched: parameterMatched === true,
        executionTypeMatched:
          executionTypeMatched === true,
        nativeValueMatched:
          nativeValueMatched === true,
        protocolMatched:
          protocolMatched === true,
        capabilityAllowed:
          capabilityAllowed === true,
        transactionSecuritySafe:
          transactionSecuritySafe === true
      },

      transaction: transaction || null,

      created_at: now,
      updated_at: now
    };

    db.withData(data => {
      if (!Array.isArray(data.executionRecords)) {
        data.executionRecords = [];
      }

      data.executionRecords.push(record);
    });

    return record;
  }

  function getRecord(id) {
    const data = db.load();

    return (
      data.executionRecords?.find(
        record => record.id === id
      ) || null
    );
  }

  function getByVerificationId(verificationId) {
    const data = db.load();

    return (
      data.executionRecords?.find(
        record =>
          record.verification_id === verificationId
      ) || null
    );
  }

  function listByProject(projectId, limit = 100) {
    const data = db.load();

    const records =
      Array.isArray(data.executionRecords)
        ? data.executionRecords
        : [];

    return records
      .filter(
        record =>
          record.project_id === projectId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, Math.max(1, Number(limit) || 100));
  }

  function updateReview(
    verificationId,
    projectId,
    decision,
    reason = null
  ) {
    let updated = null;

    db.withData(data => {
      const records =
        Array.isArray(data.executionRecords)
          ? data.executionRecords
          : [];

      const record =
        records.find(
          item =>
            item.verification_id === verificationId &&
            item.project_id === projectId
        );

      if (!record) {
        return;
      }

      if (
        !record.review ||
        typeof record.review !== "object"
      ) {
        record.review = {
          required:
            record.status === "REVIEW_REQUIRED",
          status:
            record.status === "REVIEW_REQUIRED"
              ? "PENDING"
              : "NOT_REQUIRED",
          reason: null,
          decision: null,
          reviewed_at: null
        };
      }

      if (record.review.status !== "PENDING") {
        return;
      }

      const normalizedDecision =
        String(decision || "").toUpperCase();

      if (
        normalizedDecision !== "APPROVED" &&
        normalizedDecision !== "REJECTED"
      ) {
        return;
      }

      const now =
        new Date().toISOString();

      record.review.status =
        normalizedDecision;

      record.review.decision =
        normalizedDecision;

      record.review.reason =
        reason || null;

      record.review.reviewed_at =
        now;

      record.updated_at = now;

      record.status =
        normalizedDecision === "APPROVED"
          ? "APPROVED"
          : "BLOCKED";

      updated = record;
    });

    return updated;
  }

  function listReviews(projectId, limit = 100) {
    const data = db.load();

    const records =
      Array.isArray(data.executionRecords)
        ? data.executionRecords
        : [];

    return records
      .filter(
        record =>
          record.project_id === projectId &&
          record.review &&
          record.review.required === true
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(
        0,
        Math.max(1, Number(limit) || 100)
      );
  }

  function getDailyAgentUsage(
    projectId,
    agentId,
    now = Date.now()
  ) {
    const data = db.load();

    const records =
      Array.isArray(data.executionRecords)
        ? data.executionRecords
        : [];

    const current = new Date(now);

    const startOfDay =
      new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate()
      ).getTime();

    const endOfDay =
      startOfDay + 24 * 60 * 60 * 1000;

    return records
      .filter(record => {
        if (
          record.project_id !== projectId ||
          record.agent_id !== agentId
        ) {
          return false;
        }

        /*
         * Only successful/approved executions consume
         * the cumulative daily allowance.
         *
         * REVIEW_REQUIRED and BLOCKED do not consume it.
         */
        if (
          record.status !== "VERIFIED" &&
          record.status !== "APPROVED"
        ) {
          return false;
        }

        const createdAt =
          new Date(record.created_at).getTime();

        return (
          Number.isFinite(createdAt) &&
          createdAt >= startOfDay &&
          createdAt < endOfDay
        );
      })
      .reduce((total, record) => {
        const amount =
          Number(
            record.actual_transaction_amount
          );

        return Number.isFinite(amount) &&
          amount >= 0
          ? total + amount
          : total;
      }, 0);
  }

  function listByAgent(agentId, limit = 100) {
    const data = db.load();

    const records =
      Array.isArray(data.executionRecords)
        ? data.executionRecords
        : [];

    return records
      .filter(
        record =>
          record.agent_id === agentId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )
      .slice(0, Math.max(1, Number(limit) || 100));
  }

  return {
    createRecord,
    getRecord,
    getByVerificationId,
    listByProject,
    listByAgent,
    listReviews,
    updateReview,
    getDailyAgentUsage
  };
}

module.exports = {
  createExecutionRecordStore
};
