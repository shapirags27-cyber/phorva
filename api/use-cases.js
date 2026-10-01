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
  getUseCases,
  getUseCase,
  isValidUseCase
};
