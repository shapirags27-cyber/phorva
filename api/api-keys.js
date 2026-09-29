const crypto = require("crypto");

function generateApiKey(environment = "live") {
  if (environment !== "test" && environment !== "live") {
    throw new Error("Invalid API key environment");
  }

  const prefix =
    environment === "test"
      ? "pk_test_"
      : "pk_live_";

  const secret = crypto
    .randomBytes(32)
    .toString("hex");

  const apiKey = `${prefix}${secret}`;

  const keyHash = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  return {
    apiKey,
    keyPrefix: apiKey.slice(0, 16),
    keyHash
  };
}

function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

function createApiKeyStore(db) {
  function createProject({
    name,
    developerId
  }) {
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      throw new Error("Project name is required");
    }

    if (
      typeof developerId !== "string" ||
      !developerId.trim()
    ) {
      throw new Error("developerId is required");
    }

    const projectId =
      `proj_${crypto.randomUUID()}`;

    const now =
      new Date().toISOString();

    const project = {
      id: projectId,
      developer_id: developerId,
      name: name.trim(),
      created_at: now,
      updated_at: now
    };

    db.withData((data) => {
      if (!Array.isArray(data.projects)) {
        data.projects = [];
      }

      data.projects.push(project);
    });

    return {
      id: project.id,
      name: project.name,
      developerId: project.developer_id,
      createdAt: project.created_at
    };
  }

  function getProject(projectId) {
    if (!projectId) {
      return null;
    }

    const data = db.load();

    return (
      data.projects.find(
        project =>
          project.id === projectId
      ) || null
    );
  }

  function listProjects(developerId) {
    const data = db.load();

    return data.projects
      .filter(
        project =>
          project.developer_id === developerId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .map(project => ({
        id: project.id,
        name: project.name,
        createdAt: project.created_at,
        updatedAt:
          project.updated_at ||
          project.created_at
      }));
  }

  function developerOwnsProject(
    developerId,
    projectId
  ) {
    const project =
      getProject(projectId);

    return Boolean(
      project &&
      project.developer_id === developerId
    );
  }

  function createKey({
    projectId,
    name = "Default",
    environment = "live"
  }) {
    if (!projectId) {
      throw new Error("projectId is required");
    }

    if (
      environment !== "test" &&
      environment !== "live"
    ) {
      throw new Error("Invalid API key environment");
    }

    const generated =
      generateApiKey(environment);

    const keyId =
      `key_${crypto.randomUUID()}`;

    const createdAt =
      new Date().toISOString();

    let projectExists = false;

    db.withData((data) => {
      projectExists =
        Array.isArray(data.projects) &&
        data.projects.some(
          project =>
            project.id === projectId
        );

      if (!projectExists) {
        return;
      }

      if (!Array.isArray(data.apiKeys)) {
        data.apiKeys = [];
      }

      data.apiKeys.push({
        id: keyId,
        project_id: projectId,
        name:
          typeof name === "string" &&
          name.trim()
            ? name.trim()
            : "Default",
        key_prefix:
          generated.keyPrefix,
        key_hash:
          generated.keyHash,
        environment,
        created_at: createdAt,
        last_used_at: null,
        revoked_at: null
      });
    });

    if (!projectExists) {
      throw new Error("Project not found");
    }

    return {
      id: keyId,
      projectId,
      name:
        typeof name === "string" &&
        name.trim()
          ? name.trim()
          : "Default",
      environment,
      apiKey: generated.apiKey,
      keyPrefix:
        generated.keyPrefix
    };
  }

  function getKey(id) {
    if (!id) {
      return null;
    }

    const data = db.load();

    return (
      data.apiKeys.find(
        key => key.id === id
      ) || null
    );
  }

  function authenticate(apiKey) {
    if (
      typeof apiKey !== "string" ||
      !apiKey
    ) {
      return null;
    }

    const keyHash =
      hashApiKey(apiKey);

    const data = db.load();

    const record =
      data.apiKeys.find(
        key =>
          key.key_hash === keyHash
      );

    if (
      !record ||
      record.revoked_at
    ) {
      return null;
    }

    const expectedPrefix =
      record.environment === "test"
        ? "pk_test_"
        : record.environment === "live"
          ? "pk_live_"
          : null;

    if (
      !expectedPrefix ||
      !apiKey.startsWith(expectedPrefix) ||
      record.key_prefix !==
        apiKey.slice(0, 16)
    ) {
      return null;
    }

    const now =
      new Date().toISOString();

    db.withData((current) => {
      const key =
        current.apiKeys.find(
          item =>
            item.id === record.id
        );

      if (key) {
        key.last_used_at = now;
      }
    });

    return {
      id: record.id,
      projectId:
        record.project_id,
      name: record.name,
      environment:
        record.environment,
      keyPrefix:
        record.key_prefix
    };
  }

  function revoke(id) {
    let revoked = false;

    db.withData((data) => {
      const record =
        data.apiKeys.find(
          key => key.id === id
        );

      if (
        !record ||
        record.revoked_at
      ) {
        return;
      }

      record.revoked_at =
        new Date().toISOString();

      revoked = true;
    });

    return revoked;
  }

  function list(projectId) {
    const data = db.load();

    return data.apiKeys
      .filter(
        key =>
          key.project_id === projectId
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .map(key => ({
        id: key.id,
        project_id:
          key.project_id,
        name: key.name,
        key_prefix:
          key.key_prefix,
        environment:
          key.environment,
        created_at:
          key.created_at,
        last_used_at:
          key.last_used_at,
        revoked_at:
          key.revoked_at
      }));
  }

  return {
    createProject,
    getProject,
    listProjects,
    developerOwnsProject,
    createKey,
    getKey,
    authenticate,
    revoke,
    list
  };
}

module.exports = {
  createApiKeyStore
};
