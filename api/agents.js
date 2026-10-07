const crypto = require("crypto");

function createAgentStore(db) {
  function createAgent({
    projectId,
    name,
    capabilities,
    policy = {},
    externalId = null
  }) {
    if (!projectId) {
      throw new Error("projectId is required");
    }

    if (!name || typeof name !== "string") {
      throw new Error("Agent name is required");
    }

    const normalizedCapabilities =
      Array.isArray(capabilities)
        ? [
            ...new Set(
              capabilities.map(
                value =>
                  String(value || "").toLowerCase()
              )
            )
          ]
        : null;

    const normalizedPolicy =
      policy &&
      typeof policy === "object" &&
      !Array.isArray(policy)
        ? { ...policy }
        : {};

    const agent = {
      id: `agent_${crypto.randomUUID()}`,
      project_id: projectId,
      name: name.trim(),
      policy: normalizedPolicy,
      created_at: new Date().toISOString(),
      revoked_at: null
    };

    if (
      typeof externalId === "string" &&
      externalId.trim()
    ) {
      agent.external_id =
        externalId.trim();
    }

    if (normalizedCapabilities !== null) {
      agent.capabilities = normalizedCapabilities;
    }

    let projectExists = false;

    db.withData((data) => {
      projectExists = data.projects.some(
        (project) => project.id === projectId
      );

      if (!projectExists) {
        return;
      }

      data.agents.push(agent);
    });

    if (!projectExists) {
      throw new Error("Project not found");
    }

    return agent;
  }

  function getAgent(projectId, agentId) {
    if (!projectId || !agentId) {
      return null;
    }

    const data = db.load();

    return (
      data.agents.find(
        (agent) =>
          agent.project_id === projectId &&
          !agent.revoked_at &&
          (
            agent.id === agentId ||
            agent.external_id === agentId
          )
      ) || null
    );
  }

  function list(projectId) {
    const data = db.load();

    return data.agents.filter(
      (agent) =>
        agent.project_id === projectId
    );
  }

  function updatePolicy(projectId, agentId, policy) {
    let updated = null;

    db.withData((data) => {
      const agent = data.agents.find(
        (item) =>
          item.project_id === projectId &&
          item.id === agentId &&
          !item.revoked_at
      );

      if (!agent) {
        return;
      }

      agent.policy =
        policy &&
        typeof policy === "object" &&
        !Array.isArray(policy)
          ? { ...policy }
          : {};

      updated = agent;
    });

    return updated;
  }

  function updateCapabilities(projectId, agentId, capabilities) {
    let updated = null;

    db.withData((data) => {
      const agent = data.agents.find(
        (item) =>
          item.project_id === projectId &&
          item.id === agentId &&
          !item.revoked_at
      );

      if (!agent) {
        return;
      }

      agent.capabilities =
        Array.isArray(capabilities)
          ? [
              ...new Set(
                capabilities.map(
                  value => String(value || "").toLowerCase()
                )
              )
            ]
          : [];

      updated = agent;
    });

    return updated;
  }

  function revoke(projectId, agentId) {
    let revoked = false;

    db.withData((data) => {
      const agent = data.agents.find(
        (item) =>
          item.project_id === projectId &&
          item.id === agentId &&
          !item.revoked_at
      );

      if (!agent) {
        return;
      }

      agent.revoked_at =
        new Date().toISOString();

      revoked = true;
    });

    return revoked;
  }

  return {
    createAgent,
    getAgent,
    list,
    updatePolicy,
    updateCapabilities,
    revoke
  };
}

module.exports = {
  createAgentStore
};
