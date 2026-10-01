const crypto = require("crypto");

function createSecurityAlertStore(db) {
  function createAlert({
    projectId,
    projectName,
    agentId,
    agentName,
    verificationId,
    requestId,
    type,
    severity = "HIGH",
    title,
    message,
    reason,
    transaction,
    metadata = {}
  }) {
    const now = new Date().toISOString();

    const alert = {
      id: `alert_${crypto.randomUUID()}`,
      project_id: projectId || null,
      project_name: projectName || null,
      agent_id: agentId || null,
      agent_name: agentName || null,
      verification_id: verificationId || null,
      request_id: requestId || null,
      type: type || "SECURITY_EVENT",
      severity,
      title:
        title ||
        "Security event detected",
      message:
        message ||
        "Phorva detected a security event during execution verification.",
      reason: reason || null,
      transaction: transaction || null,
      metadata:
        metadata &&
        typeof metadata === "object" &&
        !Array.isArray(metadata)
          ? metadata
          : {},
      status: "OPEN",
      created_at: now,
      updated_at: now,
      resolved_at: null
    };

    db.withData(data => {
      if (!Array.isArray(data.securityAlerts)) {
        data.securityAlerts = [];
      }

      data.securityAlerts.push(alert);
    });

    return alert;
  }

  function getAlert(id) {
    const data = db.load();

    return (
      Array.isArray(data.securityAlerts)
        ? data.securityAlerts.find(
            alert => alert.id === id
          )
        : null
    ) || null;
  }

  function listByProject(
    projectId,
    limit = 100
  ) {
    const data = db.load();

    const alerts =
      Array.isArray(data.securityAlerts)
        ? data.securityAlerts
        : [];

    return alerts
      .filter(
        alert =>
          alert.project_id === projectId
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

  function resolveAlert(id, projectId) {
    let resolved = null;

    db.withData(data => {
      const alert =
        Array.isArray(data.securityAlerts)
          ? data.securityAlerts.find(
              item =>
                item.id === id &&
                item.project_id === projectId
            )
          : null;

      if (!alert) {
        return;
      }

      const now =
        new Date().toISOString();

      alert.status = "RESOLVED";
      alert.updated_at = now;
      alert.resolved_at = now;

      resolved = alert;
    });

    return resolved;
  }

  return {
    createAlert,
    getAlert,
    listByProject,
    resolveAlert
  };
}

module.exports = {
  createSecurityAlertStore
};
