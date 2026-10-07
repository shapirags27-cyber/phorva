const USE_CASES = [
  {
    id: "autonomous-trading",
    name: "Autonomous Trading",
    description: "AI agents executing trading strategies across markets and protocols."
  },
  {
    id: "defi",
    name: "DeFi",
    description: "Agents interacting with lending, liquidity, yield and other DeFi protocols."
  },
  {
    id: "prediction-markets",
    name: "Prediction Markets",
    description: "Agents participating in prediction-market applications and markets."
  },
  {
    id: "agent-payments",
    name: "Agent Payments",
    description: "Agents making autonomous payments or transferring economic value."
  },
  {
    id: "dao-treasury",
    name: "DAO / Treasury Automation",
    description: "Agents executing authorized treasury and organizational operations."
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Agents performing autonomous on-chain gaming activities."
  },
  {
    id: "onchain-automation",
    name: "On-chain Automation",
    description: "Agents executing scheduled or event-driven blockchain operations."
  },
  {
    id: "agent-platform",
    name: "AI Agent Platform",
    description: "Infrastructure that hosts or coordinates autonomous AI agents."
  },
  {
    id: "wallet-infrastructure",
    name: "Wallet / Account Infrastructure",
    description: "Applications providing execution infrastructure for autonomous agents."
  },
  {
    id: "custom",
    name: "Custom",
    description: "A custom autonomous execution application."
  }
];

const USE_CASE_APPLICATION_CAPABILITIES = Object.freeze({
  "autonomous-trading": [
    "trade", "swap", "approve", "approval", "permit",
    "buy-position", "sell-position", "rebalance",
    "bridge", "deposit", "withdraw", "contract-call",
    "custom-action"
  ],

  "defi": [
    "swap", "approve", "approval", "permit", "bridge",
    "deposit", "withdraw", "supply", "redeem", "lend",
    "borrow", "repay", "stake", "unstake", "lp-add",
    "lp-remove", "claim", "mint", "burn", "liquidate",
    "rebalance", "contract-call", "custom-action"
  ],

  "prediction-markets": [
    "buy-position", "sell-position", "add-position",
    "reduce-position", "close-position",
    "deposit-collateral", "withdraw-collateral",
    "claim-winnings", "redeem-position",
    "split-position", "merge-position", "trade",
    "approve", "permit", "deposit", "withdraw",
    "contract-call", "custom-action"
  ],

  "agent-payments": [
    "pay", "request-payment", "split-payment",
    "recurring-payment", "refund", "authorize",
    "capture", "void", "partial-refund", "payment",
    "fund-card", "withdraw-card-balance", "approve",
    "permit", "transfer", "send", "contract-call",
    "custom-action"
  ],

  "dao-treasury": [
    "delegate", "undelegate", "propose", "vote",
    "queue", "execute", "cancel-proposal", "stream",
    "create-grant", "fund-grant", "pay", "transfer",
    "send", "approve", "contract-call", "custom-action"
  ],

  "gaming": [
    "purchase", "sell", "upgrade", "craft", "equip",
    "unequip", "marketplace-listing", "marketplace-bid",
    "marketplace-offer", "mint", "burn", "transfer",
    "approve", "contract-call", "custom-action"
  ],

  "onchain-automation": [
    "send", "transfer", "approve", "approval", "swap",
    "permit", "bridge", "deposit", "withdraw", "supply",
    "redeem", "lend", "borrow", "repay", "stake",
    "unstake", "rebalance", "claim", "contract-call",
    "custom-action"
  ],

  "agent-platform": [
    "deploy",
    "send", "transfer", "approve", "approval", "swap",
    "permit", "bridge", "deposit", "withdraw", "trade",
    "purchase", "pay", "contract-call", "custom-action"
  ],

  "wallet-infrastructure": [
    "deploy",
    "send", "transfer", "approve", "approval", "permit",
    "deposit", "withdraw", "payment", "authorize",
    "capture", "void", "contract-call", "custom-action"
  ],

  "custom": [
    "deploy",
    "send", "transfer", "approve", "approval", "swap",
    "permit", "bridge", "deposit", "withdraw",
    "contract-call", "custom-action"
  ]
});

function getUseCaseApplicationCapabilities(useCaseId) {
  const capabilities =
    USE_CASE_APPLICATION_CAPABILITIES[
      String(useCaseId || "").trim().toLowerCase()
    ];

  return Array.isArray(capabilities)
    ? [...capabilities]
    : [];
}

function getUseCases() {
  return USE_CASES.map(useCase => ({ ...useCase }));
}

function getUseCase(useCaseId) {
  return USE_CASES.find(
    useCase => useCase.id === useCaseId
  ) || null;
}

function isValidUseCase(useCaseId) {
  return Boolean(getUseCase(useCaseId));
}

module.exports = {
  USE_CASES,
  USE_CASE_APPLICATION_CAPABILITIES,
  getUseCases,
  getUseCase,
  getUseCaseApplicationCapabilities,
  isValidUseCase
};
