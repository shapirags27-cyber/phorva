const db = require("./api/database");
const { createApiKeyStore } = require("./api/api-keys");
const { createAgentStore } = require("./api/agents");

const apiKeyStore = createApiKeyStore(db);
const agentStore = createAgentStore(db);

const projectId =
  "proj_cbd35b4a-6cd4-46b7-aa2b-9947abc0f16c";

const projects =
  db.load().projects || [];

const project =
  projects.find(
    item => item.id === projectId
  );

if (!project) {
  throw new Error(
    `Project not found: ${projectId}`
  );
}

const key =
  apiKeyStore.createKey({
    projectId: project.id,
    name:
      "Automatic Agent Detection Test",
    environment: "test"
  });

const externalAgentId =
  `external-agent-${Date.now()}`;

const recipient =
  "0x0000000000000000000000000000000000000001";

async function verify() {
  const response =
    await fetch(
      "http://127.0.0.1:3000/v1/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${key.apiKey}`
        },
        body: JSON.stringify({
          agent: {
            id: externalAgentId,
            name: "Auto Detected Trading Agent"
          },

          action: {
            type: "send",
            chain: 84532,
            recipient,
            amount: 100
          },

          intent: {
            type: "send",
            chain: 84532,
            recipient,
            amount: 100,
            nativeValue: "100"
          },

          transaction: {
            chainId: 84532,
            expectedChainId: 84532,
            to: recipient,
            value: "100",
            calldata: "0x"
          }
        })
      }
    );

  const data =
    await response.json();

  return {
    httpStatus: response.status,
    ...data
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(
      `FAIL: ${message}`
    );
  }
}

(async () => {
  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "PHORVA AUTOMATIC AGENT DETECTION TEST"
  );
  console.log(
    "========================================"
  );

  console.log("Project:", project.id);
  console.log(
    "External Agent ID:",
    externalAgentId
  );

  const before =
    agentStore.list(project.id);

  console.log(
    "Agents before:",
    before.length
  );

  console.log(
    "Existing agents:",
    before.length
  );

  const result =
    await verify();

  console.log(
    "HTTP status:",
    result.httpStatus
  );

  console.log(
    "Authorization:",
    result.authorized
  );

  assert(
    result.httpStatus === 200,
    "Verification request should return HTTP 200"
  );

  const after =
    agentStore.list(project.id);

  console.log(
    "Agents after:",
    after.length
  );

  assert(
    after.length === before.length + 1,
    "First-seen agent should be created automatically"
  );

  const detected =
    after.find(
      agent =>
        agent.external_id ===
        externalAgentId
    );

  assert(
    detected,
    "Newly detected agent should be present"
  );

  console.log(
    "Detected agent:",
    detected
  );

  assert(
    detected.external_id === externalAgentId,
    "External agent ID should be persisted"
  );

  assert(
    detected.name ===
      "Auto Detected Trading Agent",
    "Agent name should be detected from the request"
  );

  assert(
    !Object.prototype.hasOwnProperty.call(
      detected,
      "capabilities"
    ),
    "Caller-supplied capabilities must not be registered"
  );

  console.log("");
  console.log(
    "PASS: First-seen agent was automatically detected."
  );
  console.log(
    "PASS: External agent ID was persisted."
  );
  console.log(
    "PASS: Caller capabilities were not trusted."
  );
  console.log("");
})().catch(error => {
  console.error("");
  console.error(error);
  console.error("");
  process.exit(1);
});
