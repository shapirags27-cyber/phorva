const db = require("./api/database");
const { createApiKeyStore } = require("./api/api-keys");
const { createAgentStore } = require("./api/agents");

const apiKeyStore = createApiKeyStore(db);
const agentStore = createAgentStore(db);

const developerId = `http_daily_test_${Date.now()}`;

const project = apiKeyStore.createProject({
  name: `HTTP Daily Limit Test ${Date.now()}`,
  developerId,
  useCases: ["autonomous-trading"],
  actions: [],
  applicationCapabilities: ["send"],
  policy: {},
  securityProfile: {
    explicitLimits: {
      maxTransactionAmount: 10000,
      dailyLimit: 10000
    }
  }
});

const key = apiKeyStore.createKey({
  projectId: project.id,
  name: "HTTP Runtime Test",
  environment: "test"
});

const agentA = agentStore.createAgent({
  projectId: project.id,
  name: "HTTP Daily Agent A",
  capabilities: ["send"],
  policy: {}
});

const agentB = agentStore.createAgent({
  projectId: project.id,
  name: "HTTP Daily Agent B",
  capabilities: ["send"],
  policy: {}
});

const recipient =
  "0x0000000000000000000000000000000000000001";

async function verify(agentId, amount) {
  const response = await fetch(
    "http://127.0.0.1:3000/v1/verify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key.apiKey}`
      },
      body: JSON.stringify({
        agent: {
          id: agentId
        },

        action: {
          type: "send",
          chain: 84532,
          recipient,
          amount
        },

        intent: {
          type: "send",
          chain: 84532,
          recipient,
          amount,
          nativeValue: String(amount)
        },

        transaction: {
          chainId: 84532,
          expectedChainId: 84532,
          to: recipient,
          value: String(amount),
          calldata: "0x"
        }
      })
    }
  );

  const data = await response.json();

  return {
    httpStatus: response.status,
    ...data
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

(async () => {
  console.log("");
  console.log("========================================");
  console.log("PHORVA HTTP DAILY LIMIT TEST");
  console.log("========================================");
  console.log("Project:", project.id);
  console.log("Agent A:", agentA.id);
  console.log("Agent B:", agentB.id);
  console.log("");

  const tests = [
    [agentA.id, 2000, "Agent A $2,000"],
    [agentA.id, 3000, "Agent A $3,000"],
    [agentA.id, 5000, "Agent A $5,000"],
    [agentA.id, 1, "Agent A $1"],
    [agentB.id, 10000, "Agent B $10,000"]
  ];

  const results = [];

  for (const [agentId, amount, label] of tests) {
    const result =
      await verify(agentId, amount);

    console.log(label);
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    results.push({
      agentId,
      amount,
      label,
      result
    });
  }

  const a1 = results[0].result;
  const a2 = results[1].result;
  const a3 = results[2].result;
  const a4 = results[3].result;
  const b1 = results[4].result;

  assert(
    a1.verdict === "AUTHORIZED",
    "Agent A $2,000 should be AUTHORIZED"
  );

  assert(
    a2.verdict === "AUTHORIZED",
    "Agent A $3,000 should be AUTHORIZED"
  );

  assert(
    a3.verdict === "AUTHORIZED",
    "Agent A $5,000 should be AUTHORIZED"
  );

  assert(
    a4.verdict === "BLOCKED",
    "Agent A $1 should be BLOCKED"
  );

  assert(
    a4.dailyLimitAllowed === false,
    "Agent A $1 should fail dailyLimitAllowed"
  );

  assert(
    b1.verdict === "AUTHORIZED",
    "Agent B $10,000 should be AUTHORIZED"
  );

  assert(
    b1.dailyLimitAllowed === true,
    "Agent B should have an independent daily allowance"
  );

  console.log("========================================");
  console.log("RESULT");
  console.log("========================================");
  console.log("PASS: HTTP /v1/verify cumulative daily limit works.");
  console.log("PASS: Agent A reaches exactly $10,000.");
  console.log("PASS: Agent A's next $1 is blocked.");
  console.log("PASS: Agent B has an independent $10,000 allowance.");
  console.log("========================================");
})().catch(error => {
  console.error("");
  console.error("HTTP DAILY LIMIT TEST FAILED");
  console.error(error.message);
  process.exit(1);
});
