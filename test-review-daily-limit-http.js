const db = require("./api/database");
const { createApiKeyStore } = require("./api/api-keys");
const { createAgentStore } = require("./api/agents");

const apiKeyStore = createApiKeyStore(db);
const agentStore = createAgentStore(db);

const recipient =
  "0x0000000000000000000000000000000000000001";

function assert(condition, message) {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
}

function createTestProject(label) {
  const developerId =
    `review_daily_${Date.now()}_${Math.random()}`;

  const project =
    apiKeyStore.createProject({
      name: label,
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

  const key =
    apiKeyStore.createKey({
      projectId: project.id,
      name: "Review Runtime Test",
      environment: "test"
    });

  const agent =
    agentStore.createAgent({
      projectId: project.id,
      name: "Review Daily Agent",
      capabilities: ["send"],
      policy: {}
    });

  return {
    project,
    key,
    agent
  };
}

async function verify(key, agentId, amount) {
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

  const data =
    await response.json();

  return {
    httpStatus: response.status,
    ...data
  };
}

async function approve(
  key,
  verificationId,
  reason
) {
  const response =
    await fetch(
      `http://127.0.0.1:3000/v1/reviews/${verificationId}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${key.apiKey}`
        },
        body: JSON.stringify({
          reason
        })
      }
    );

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  return {
    httpStatus: response.status,
    ...data
  };
}

async function runSuccessCase() {
  console.log("");
  console.log("========================================");
  console.log("CASE 1: REVIEW CAN BE APPROVED");
  console.log("========================================");

  const {
    project,
    key,
    agent
  } =
    createTestProject(
      `Review Approval Success ${Date.now()}`
    );

  console.log("Project:", project.id);
  console.log("Agent:", agent.id);
  console.log("");

  /*
   * Establish baseline:
   *
   * 5 x $1,000
   * baseline = $1,000
   * upper bound = $2,000
   * daily usage = $5,000
   */
  for (let i = 1; i <= 5; i++) {
    const result =
      await verify(
        key,
        agent.id,
        1000
      );

    assert(
      result.verdict === "AUTHORIZED",
      `Baseline observation ${i} should be AUTHORIZED`
    );
  }

  const review =
    await verify(
      key,
      agent.id,
      2500
    );

  console.log(
    "Abnormal $2,500:"
  );
  console.log(
    JSON.stringify(review, null, 2)
  );

  assert(
    review.verdict === "REVIEW_REQUIRED",
    "Abnormal transaction should require review"
  );

  assert(
    review.reviewRequired === true,
    "Review should be required"
  );

  assert(
    review.baselineDecision === "ABNORMAL",
    "Baseline decision should be ABNORMAL"
  );

  assert(
    review.dailyLimitAllowed === true,
    "Review transaction should still be within daily limit"
  );

  assert(
    review.dailyUsage === 5000,
    "Daily usage before approval should be $5,000"
  );

  const approval =
    await approve(
      key,
      review.verificationId,
      "Approved during daily-limit integration test."
    );

  console.log("");
  console.log(
    "Approval:"
  );
  console.log(
    JSON.stringify(approval, null, 2)
  );

  assert(
    approval.httpStatus === 200,
    "Approval should return HTTP 200"
  );

  assert(
    approval.review?.status === "APPROVED" ||
      approval.status === "APPROVED",
    "Review should become APPROVED"
  );

  console.log("");
  console.log(
    "PASS: REVIEW_REQUIRED transaction was approved."
  );
}

async function runRejectApprovalCase() {
  console.log("");
  console.log("========================================");
  console.log("CASE 2: DAILY LIMIT BLOCKS APPROVAL");
  console.log("========================================");

  const {
    project,
    key,
    agent
  } =
    createTestProject(
      `Review Approval Daily Limit ${Date.now()}`
    );

  console.log("Project:", project.id);
  console.log("Agent:", agent.id);
  console.log("");

  /*
   * Establish baseline:
   *
   * 5 x $1,600 = $8,000
   * baseline = $1,600
   * upper bound = $3,200
   * daily usage = $8,000
   */
  for (let i = 1; i <= 5; i++) {
    const result =
      await verify(
        key,
        agent.id,
        1600
      );

    assert(
      result.verdict === "AUTHORIZED",
      `Baseline observation ${i} should be AUTHORIZED`
    );
  }

  /*
   * $4,000 is above the adaptive upper bound
   * but still below the $10,000 single transaction limit.
   *
   * It therefore becomes REVIEW_REQUIRED.
   *
   * Current daily usage = $8,000
   * Projected after approval = $12,000
   * Daily limit = $10,000
   */
  const review =
    await verify(
      key,
      agent.id,
      4000
    );

  console.log(
    "Abnormal $4,000:"
  );
  console.log(
    JSON.stringify(review, null, 2)
  );

  assert(
    review.verdict === "REVIEW_REQUIRED",
    "Abnormal transaction should require review"
  );

  assert(
    review.reviewRequired === true,
    "Review should be required"
  );

  assert(
    review.baselineDecision === "ABNORMAL",
    "Baseline decision should be ABNORMAL"
  );

  assert(
    review.dailyUsage === 8000,
    "Daily usage before approval should be $8,000"
  );

  /*
   * The approval endpoint must re-check
   * the persistent daily allowance.
   */
  const approval =
    await approve(
      key,
      review.verificationId,
      "Attempt approval after daily allowance is insufficient."
    );

  console.log("");
  console.log(
    "Approval attempt:"
  );
  console.log(
    JSON.stringify(approval, null, 2)
  );

  assert(
    approval.httpStatus === 409,
    "Approval should return HTTP 409"
  );

  assert(
    String(
      approval.error || ""
    ).includes(
      "daily transaction limit"
    ),
    "Approval rejection should identify the daily transaction limit"
  );

  console.log("");
  console.log(
    "PASS: Daily limit prevented review approval."
  );
}

(async () => {
  await runSuccessCase();
  await runRejectApprovalCase();

  console.log("");
  console.log("========================================");
  console.log("FINAL RESULT");
  console.log("========================================");
  console.log(
    "PASS: Review approval respects cumulative daily limits."
  );
  console.log("========================================");
})().catch(error => {
  console.error("");
  console.error(
    "REVIEW DAILY LIMIT TEST FAILED"
  );
  console.error(error.stack || error.message);
  process.exit(1);
});
