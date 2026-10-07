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
    developerId,
    useCases = [],
    actions = [],
    applicationCapabilities = [],
    policy = {},
    securityProfile = null
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

    if (!Array.isArray(useCases)) {
      throw new Error("useCases must be an array");
    }

    if (!Array.isArray(actions)) {
      throw new Error("actions must be an array");
    }

    if (!Array.isArray(applicationCapabilities)) {
      throw new Error(
        "applicationCapabilities must be an array"
      );
    }

    if (
      !policy ||
      typeof policy !== "object" ||
      Array.isArray(policy)
    ) {
      throw new Error("policy must be an object");
    }

    const normalizedUseCases =
      useCases
        .filter(
          value =>
            typeof value === "string" &&
            value.trim()
        )
        .map(value => value.trim());

    const normalizedActions =
      actions
        .filter(
          value =>
            typeof value === "string" &&
            value.trim()
        )
        .map(value => value.trim());

    const normalizedApplicationCapabilities =
      applicationCapabilities
        .filter(
          value =>
            typeof value === "string" &&
            value.trim()
        )
        .map(value => value.trim());

    const projectId =
      `proj_${crypto.randomUUID()}`;

    const now =
      new Date().toISOString();

    const project = {
      id: projectId,
      developer_id: developerId,
      name: name.trim(),

      /*
       * Phorva security context.
       *
       * use_cases remains for backward compatibility with
       * the existing Developer Platform API.
       *
       * The new canonical project security model is stored
       * in security_profile.
       */
      use_cases: normalizedUseCases,

      actions: normalizedActions,

      application_capabilities:
        normalizedApplicationCapabilities,

      policy,

      security_profile:
        securityProfile &&
        typeof securityProfile === "object" &&
        !Array.isArray(securityProfile)
          ? securityProfile
          : null,

      integration: {
        method: null,
        status: "NOT_CONNECTED",
        verificationId: null,
        verifiedAt: null,
        updatedAt: now
      },

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
      useCases: project.use_cases,
      actions: project.actions,

      applicationCapabilities:
        Array.isArray(project.application_capabilities)
          ? project.application_capabilities
          : [],
      policy: project.policy,
      securityProfile:
        project.security_profile || null,
      createdAt: project.created_at,
      updatedAt: project.updated_at
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
        useCases: Array.isArray(project.use_cases)
          ? project.use_cases
          : [],
        actions: Array.isArray(project.actions)
          ? project.actions
          : [],
        policy:
          project.policy &&
          typeof project.policy === "object" &&
          !Array.isArray(project.policy)
            ? project.policy
            : {},

        securityProfile:
          project.security_profile &&
          typeof project.security_profile === "object" &&
          !Array.isArray(project.security_profile)
            ? project.security_profile
            : null,

        createdAt: project.created_at,
        updatedAt:
          project.updated_at ||
          project.created_at
      }));
  }

  function updateProject(
    projectId,
    updates = {}
  ) {
    if (!projectId) {
      throw new Error("projectId is required");
    }

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates)
    ) {
      throw new Error("updates must be an object");
    }

    let updatedProject = null;

    db.withData((data) => {
      const project =
        data.projects.find(
          item => item.id === projectId
        );

      if (!project) {
        return;
      }

      if (
        updates.name !== undefined
      ) {
        if (
          typeof updates.name !== "string" ||
          !updates.name.trim()
        ) {
          throw new Error(
            "Project name must be a non-empty string"
          );
        }

        project.name =
          updates.name.trim();
      }

      if (
        updates.useCases !== undefined
      ) {
        if (
          !Array.isArray(updates.useCases)
        ) {
          throw new Error(
            "useCases must be an array"
          );
        }

        project.use_cases =
          updates.useCases
            .filter(
              value =>
                typeof value === "string" &&
                value.trim()
            )
            .map(
              value => value.trim()
            );
      }

      if (
        updates.policy !== undefined
      ) {
        if (
          !updates.policy ||
          typeof updates.policy !== "object" ||
          Array.isArray(updates.policy)
        ) {
          throw new Error(
            "policy must be an object"
          );
        }

        project.policy =
          updates.policy;
      }

      if (
        updates.securityProfile !== undefined
      ) {
        if (
          updates.securityProfile !== null &&
          (
            typeof updates.securityProfile !== "object" ||
            Array.isArray(updates.securityProfile)
          )
        ) {
          throw new Error(
            "securityProfile must be an object or null"
          );
        }

        project.security_profile =
          updates.securityProfile;
      }

      /*
       * Actions are intentionally NOT updated here.
       *
       * Phorva determines the relevant execution
       * surface from actual activity rather than
       * requiring developers to manually configure
       * action types.
       */

      project.updated_at =
        new Date().toISOString();

      updatedProject = {
        id: project.id,
        name: project.name,
        developerId:
          project.developer_id,
        useCases:
          Array.isArray(project.use_cases)
            ? project.use_cases
            : [],
        actions:
          Array.isArray(project.actions)
            ? project.actions
            : [],
        policy:
          project.policy &&
          typeof project.policy === "object" &&
          !Array.isArray(project.policy)
            ? project.policy
            : {},
        securityProfile:
          project.security_profile &&
          typeof project.security_profile === "object" &&
          !Array.isArray(project.security_profile)
            ? project.security_profile
            : null,
        createdAt:
          project.created_at,
        updatedAt:
          project.updated_at
      };
    });

    if (!updatedProject) {
      throw new Error("Project not found");
    }

    return updatedProject;
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

  function getProjectIntegration(projectId) {
    const project =
      getProject(projectId);

    if (!project) {
      return null;
    }

    const integration =
      project.integration &&
      typeof project.integration === "object" &&
      !Array.isArray(project.integration)
        ? project.integration
        : {};

    return {
      method:
        typeof integration.method === "string"
          ? integration.method
          : null,
      status:
        typeof integration.status === "string"
          ? integration.status
          : "NOT_CONNECTED",
      verificationId:
        typeof integration.verificationId === "string"
          ? integration.verificationId
          : null,
      verifiedAt:
        integration.verifiedAt || null,
      updatedAt:
        integration.updatedAt ||
        project.updated_at ||
        project.created_at
    };
  }

  function updateProjectIntegration(
    projectId,
    updates = {}
  ) {
    if (!projectId) {
      throw new Error("projectId is required");
    }

    if (
      !updates ||
      typeof updates !== "object" ||
      Array.isArray(updates)
    ) {
      throw new Error(
        "integration updates must be an object"
      );
    }

    const allowedMethods = [
      "api",
      "sdk",
      "mcp"
    ];

    const allowedStatuses = [
      "NOT_CONNECTED",
      "PENDING",
      "VERIFIED",
      "FAILED"
    ];

    if (
      updates.method !== undefined &&
      !allowedMethods.includes(
        String(updates.method).toLowerCase()
      )
    ) {
      throw new Error(
        "Invalid integration method"
      );
    }

    if (
      updates.status !== undefined &&
      !allowedStatuses.includes(
        String(updates.status).toUpperCase()
      )
    ) {
      throw new Error(
        "Invalid integration status"
      );
    }

    let result = null;

    db.withData((data) => {
      const project =
        data.projects.find(
          item => item.id === projectId
        );

      if (!project) {
        return;
      }

      const now =
        new Date().toISOString();

      const current =
        project.integration &&
        typeof project.integration === "object" &&
        !Array.isArray(project.integration)
          ? project.integration
          : {};

      project.integration = {
        method:
          updates.method !== undefined
            ? String(updates.method).toLowerCase()
            : current.method || null,

        status:
          updates.status !== undefined
            ? String(updates.status).toUpperCase()
            : current.status || "NOT_CONNECTED",

        verificationId:
          updates.verificationId !== undefined
            ? updates.verificationId
            : current.verificationId || null,

        verifiedAt:
          updates.verifiedAt !== undefined
            ? updates.verifiedAt
            : current.verifiedAt || null,

        updatedAt: now
      };

      project.updated_at = now;

      result = {
        method: project.integration.method,
        status: project.integration.status,
        verificationId:
          project.integration.verificationId,
        verifiedAt:
          project.integration.verifiedAt,
        updatedAt:
          project.integration.updatedAt
      };
    });

    if (!result) {
      throw new Error("Project not found");
    }

    return result;
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

    const project =
      data.projects.find(
        item =>
          item.id === record.project_id
      );

    if (!project) {
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
    updateProject,
    developerOwnsProject,
    getProjectIntegration,
    updateProjectIntegration,
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
