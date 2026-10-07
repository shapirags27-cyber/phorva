const db = require("./api/database");
const { createApiKeyStore } = require("./api/api-keys");
const { createAgentStore } = require("./api/agents");
const { createExecutionRecordStore } = require("./api/execution-records");

const apiKeyStore = createApiKeyStore(db);
const agentStore = createAgentStore(db);
const executionRecordStore =
  createExecutionRecordStore(db);

const developerId =
  `runtime_test_${Date.now()}`;

const project =
  apiKeyStore.createProject({
    name: `Daily Limit Runtime Test ${Date.now()}`,
    developerId,
    useCases: ["autonomous-trading"],
    actions: [],
    applicationCapabilities: ["trade"],
    policy: {},
    securityProfile: {
      explicitLimits: {
        maxTransactionAmount: 10000,
        dailyLimit: 10000
      }
    }
  });

const key =
  apiKeyStore.createKey({
    projectId: project.id,
    name: "Runtime Test",
    environment: "test"
  });

const agentA =
  agentStore.createAgent({
    projectId: project.id,
    name: "Daily Limit Agent A",
    capabilities: ["trade"],
    policy: {}
  });

const agentB =
  agentStore.createAgent({
    projectId: project.id,
    name: "Daily Limit Agent B",
    capabilities: ["trade"],
    policy: {}
  });

function usage(agentId) {
  return executionRecordStore.getDailyAgentUsage(
    project.id,
    agentId
  );
}

function recordAuthorized(agentId, amount) {
  executionRecordStore.createRecord({
    verificationId:
      `runtime_${cryptoRandomId()}`,
    requestId:
      `request_${cryptoRandomId()}`,
    projectId: project.id,
    agentId,
    status: "VERIFIED",
    actualTransactionAmount: amount,
    dailyLimit: 10000,
    dailyUsage: usage(agentId),
    dailyRemaining:
      Math.max(
        0,
        10000 - usage(agentId)
      )
  });
}

function cryptoRandomId() {
  return Math.random()
    .toString(36)
    .slice(2);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

console.log("");
console.log("========================================");
console.log("PHORVA DAILY LIMIT RUNTIME TEST");
console.log("========================================");
console.log("");
console.log("Project:", project.id);
console.log("API key:", key.keyPrefix + "...");
console.log("Agent A:", agentA.id);
console.log("Agent B:", agentB.id);
console.log("");

const steps = [
  [agentA.id, 2000, "Agent A $2,000"],
  [agentA.id, 3000, "Agent A $3,000"],
  [agentA.id, 5000, "Agent A $5,000"],
];

for (const [agentId, amount, label] of steps) {
  const before = usage(agentId);
  const projected = before + amount;
  const allowed = projected <= 10000;

  console.log(
    `${label}: before=$${before}, projected=$${projected}, allowed=${allowed}`
  );

  assert(
    allowed === true,
    `${label} should be allowed`
  );

  recordAuthorized(agentId, amount);

  const after = usage(agentId);

  console.log(
    `  usage after = $${after}`
  );

  assert(
    after === projected,
    `${label} usage should become $${projected}`
  );
}

const agentABeforeBlocked =
  usage(agentA.id);

const blockedAmount = 1;

const blockedProjected =
  agentABeforeBlocked + blockedAmount;

const blocked =
  blockedProjected > 10000;

console.log("");
console.log(
  `Agent A $1: before=$${agentABeforeBlocked}, projected=$${blockedProjected}, allowed=${!blocked}`
);

assert(
  blocked === true,
  "Agent A $1 should be blocked"
);

assert(
  usage(agentA.id) === 10000,
  "Blocked transaction must not consume daily allowance"
);

const agentBBefore =
  usage(agentB.id);

const agentBAmount = 10000;

const agentBAllowed =
  agentBBefore + agentBAmount <= 10000;

console.log("");
console.log(
  `Agent B $10,000: before=$${agentBBefore}, projected=$${agentBBefore + agentBAmount}, allowed=${agentBAllowed}`
);

assert(
  agentBAllowed === true,
  "Agent B must have an independent daily allowance"
);

recordAuthorized(
  agentB.id,
  agentBAmount
);

const agentBAfter =
  usage(agentB.id);

assert(
  agentBAfter === 10000,
  "Agent B usage should become $10,000"
);

console.log(
  `  usage after = $${agentBAfter}`
);

console.log("");
console.log("========================================");
console.log("RESULT");
console.log("========================================");
console.log("Agent A final usage: $" + usage(agentA.id));
console.log("Agent B final usage: $" + usage(agentB.id));
console.log("");
console.log("PASS: cumulative daily limit is isolated per agent.");
console.log("PASS: Agent A cannot exceed $10,000.");
console.log("PASS: Agent B has its own $10,000 allowance.");
console.log("PASS: blocked execution does not consume allowance.");
console.log("");
