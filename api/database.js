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
    agents: []
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

  fs.writeFileSync(
    tempPath,
    JSON.stringify(
      data,
      null,
      2
    ),
    {
      mode: 0o600
    }
  );

  fs.renameSync(
    tempPath,
    dataPath
  );
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
