const fs = require("fs");
const path = require("path");

const dataDir =
  process.env.PHORVA_DATA_DIR ||
  path.join(__dirname, "..", "data");

const dataPath =
  process.env.PHORVA_DATABASE_PATH ||
  path.join(dataDir, "phorva.json");

fs.mkdirSync(path.dirname(dataPath), {
  recursive: true
});

function emptyDatabase() {
  return {
    developers: [],
    sessions: [],
    projects: [],
    apiKeys: [],
    agents: [],
    passwordResetTokens: []
  };
}

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(
    dataPath,
    JSON.stringify(
      emptyDatabase(),
      null,
      2
    ),
    {
      mode: 0o600
    }
  );
}

function load() {
  try {
    const raw =
      fs.readFileSync(
        dataPath,
        "utf8"
      );

    if (!raw.trim()) {
      return emptyDatabase();
    }

    const data =
      JSON.parse(raw);

    return {
      developers:
        Array.isArray(
          data.developers
        )
          ? data.developers
          : [],

      sessions:
        Array.isArray(
          data.sessions
        )
          ? data.sessions
          : [],

      projects:
        Array.isArray(
          data.projects
        )
          ? data.projects
          : [],

      apiKeys:
        Array.isArray(
          data.apiKeys
        )
          ? data.apiKeys
          : [],

      agents:
        Array.isArray(
          data.agents
        )
          ? data.agents
          : [],

      passwordResetTokens:
        Array.isArray(
          data.passwordResetTokens
        )
          ? data.passwordResetTokens
          : []
    ,
                   executionRecords:
                            Array.isArray(
                              data.executionRecords
                            )
                              ? data.executionRecords
                              : [],

                   securityAlerts:
                            Array.isArray(
                              data.securityAlerts
                            )
                              ? data.securityAlerts
                              : []
};
  } catch (error) {
    throw new Error(
      `Failed to read Phorva database: ${error.message}`
    );
  }
}

function save(data) {
  const tempPath =
    `${dataPath}.tmp`;

  const serialized =
    JSON.stringify(
      data,
      null,
      2
    );

  try {
    fs.writeFileSync(
      tempPath,
      serialized,
      {
        mode: 0o600
      }
    );

    // Ensure an existing temp file cannot retain weaker permissions.
    fs.chmodSync(
      tempPath,
      0o600
    );

    // Atomically replace the live database.
    fs.renameSync(
      tempPath,
      dataPath
    );
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch {
      // Preserve the original database-write error.
    }

    throw new Error(
      `Failed to write Phorva database: ${error.message}`
    );
  }
}

function getDataPath() {
  return dataPath;
}

function withData(callback) {
  const data = load();

  const result =
    callback(data);

  save(data);

  return result;
}

module.exports = {
  load,
  save,
  withData,
  getDataPath
};
