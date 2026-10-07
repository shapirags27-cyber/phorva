const db = require("./api/database");
const { createAgentStore } = require("./api/agents");
const { createApiKeyStore } = require("./api/api-keys");

const agentStore = createAgentStore(db);
const apiKeyStore = createApiKeyStore(db);

const projectId = "proj_cbd35b4a-6cd4-46b7-aa2b-9947abc0f16c";
const agentId = "agent_6ab4200d-691e-4f52-bacb-d670129a61f5";

function word(value) {
  return BigInt(value).toString(16).padStart(64, "0");
}

function addressWord(address) {
  return address
    .toLowerCase()
    .replace(/^0x/, "")
    .padStart(64, "0");
}

function buildApprovalCalldata(spender, amount) {
  return (
    "0x095ea7b3" +
    addressWord(spender) +
    word(amount)
  );
}

const agent = agentStore.getAgent(projectId, agentId);

if (!agent) {
  throw new Error("Agent not found");
}

const originalPolicy = { ...(agent.policy || {}) };

const testPolicy = {
  ...originalPolicy,
  maxTransactionAmount: 5000,
  maxApprovalAmount: 10000,
  allowedSpenders: [
    "0x0000000000000000000000000000000000000001"
  ],
  allowUnlimitedApprovals: false
};

const key = apiKeyStore.createKey({
  projectId,
  name: "Policy composition test",
  environment: "test"
});

agentStore.updatePolicy(
  projectId,
  agentId,
  testPolicy
);

const amount = 6000;
const spender =
  "0x0000000000000000000000000000000000000001";

const calldata =
  buildApprovalCalldata(spender, amount);

console.log("TEMP_KEY=" + key.apiKey);
console.log("KEY_ID=" + key.id);
console.log("CALldata=" + calldata);
console.log("ORIGINAL_POLICY=" + JSON.stringify(originalPolicy));
console.log("TEST_POLICY=" + JSON.stringify(testPolicy));
console.log("");
console.log("Run the HTTP verification with:");
console.log("");
console.log(
  `curl -s -X POST http://127.0.0.1:3000/v1/verify ` +
  `-H 'Content-Type: application/json' ` +
  `-H 'Authorization: Bearer ${key.apiKey}' ` +
  `-d '${JSON.stringify({
    agent: { id: agentId },
    action: {
      type: "approval",
      chain: "baseSepolia",
      protocol: "ERC20",
      asset: "USDC",
      amount: String(amount)
    },
    intent: {
      type: "approval",
      chain: "baseSepolia",
      protocol: "ERC20",
      asset: "USDC",
      amount: String(amount),
      assetAddress:
        "0x5555555555555555555555555555555555555555",
      spender
    },
    transaction: {
      from: "0xAgentWallet",
      to:
        "0x5555555555555555555555555555555555555555",
      chainId: 84532,
      expectedChainId: 84532,
      value: "0",
      calldata,
      amount: String(amount)
    }
  })}'`
);
