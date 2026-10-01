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
    policyPassed,
    intentMatched,
    parameterMatched,
    executionTypeMatched,
    nativeValueMatched,
    protocolMatched,
    transactionSecuritySafe,
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
    updateReview
  };
}

module.exports = {
  createExecutionRecordStore
};
