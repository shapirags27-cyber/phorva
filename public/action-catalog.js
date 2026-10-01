(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    const catalog = factory();
    root.PHORVA_ACTION_CATALOG = catalog;
    root.AGENT_ACTIONS = catalog.AGENT_ACTIONS;
    root.AGENT_ACTION_FIELDS = catalog.AGENT_ACTION_FIELDS;
  }
})(typeof self !== "undefined" ? self : this, function () {

const AGENT_ACTIONS = {
 defi: [
   ["swap", "Swap"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["supply", "Supply"],
   ["redeem", "Redeem"],
   ["lend", "Lend"],
   ["borrow", "Borrow"],
   ["repay", "Repay"],
   ["stake", "Stake"],
   ["unstake", "Unstake"],
   ["lp-add", "Add Liquidity"],
   ["lp-remove", "Remove Liquidity"],
   ["claim", "Claim"],
   ["approve", "Approve"],
   ["permit", "Permit"],
   ["bridge", "Bridge"],
   ["wrap", "Wrap"],
   ["unwrap", "Unwrap"],
   ["mint", "Mint"],
   ["burn", "Burn"],
   ["liquidate", "Liquidate"],
   ["rebalance", "Rebalance"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 "prediction-market": [
   ["buy-position", "Buy Position"],
   ["sell-position", "Sell Position"],
   ["add-position", "Add Position"],
   ["reduce-position", "Reduce Position"],
   ["close-position", "Close Position"],
   ["deposit-collateral", "Deposit Collateral"],
   ["withdraw-collateral", "Withdraw Collateral"],
   ["claim-winnings", "Claim Winnings"],
   ["redeem-position", "Redeem Position"],
   ["split-position", "Split Position"],
   ["merge-position", "Merge Position"],
   ["trade", "Trade"],
   ["approve", "Approve"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 gaming: [
   ["purchase", "Purchase"],
   ["sell", "Sell"],
   ["trade", "Trade"],
   ["transfer", "Transfer"],
   ["mint", "Mint"],
   ["burn", "Burn"],
   ["claim", "Claim"],
   ["upgrade", "Upgrade"],
   ["craft", "Craft"],
   ["equip", "Equip"],
   ["unequip", "Unequip"],
   ["stake", "Stake"],
   ["unstake", "Unstake"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["approve", "Approve"],
   ["marketplace-listing", "Marketplace Listing"],
   ["marketplace-bid", "Marketplace Bid"],
   ["marketplace-offer", "Marketplace Offer"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 dao: [
   ["transfer", "Transfer"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["approve", "Approve"],
   ["delegate", "Delegate"],
   ["undelegate", "Undelegate"],
   ["propose", "Propose"],
   ["vote", "Vote"],
   ["queue", "Queue"],
   ["execute", "Execute"],
   ["cancel-proposal", "Cancel Proposal"],
   ["claim", "Claim"],
   ["stream", "Stream"],
   ["create-grant", "Create Grant"],
   ["fund-grant", "Fund Grant"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 "agent-payment": [
   ["pay", "Pay"],
   ["send", "Send"],
   ["transfer", "Transfer"],
   ["request-payment", "Request Payment"],
   ["split-payment", "Split Payment"],
   ["recurring-payment", "Recurring Payment"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["refund", "Refund"],
   ["claim", "Claim"],
   ["approve", "Approve"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 "virtual-card": [
   ["purchase", "Purchase"],
   ["authorize", "Authorize"],
   ["capture", "Capture"],
   ["void", "Void"],
   ["refund", "Refund"],
   ["partial-refund", "Partial Refund"],
   ["payment", "Payment"],
   ["transfer", "Transfer"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["fund-card", "Fund Card"],
   ["withdraw-card-balance", "Withdraw Card Balance"],
   ["approve", "Approve"],
   ["contract-call", "Contract Call"],
   ["custom-action", "Custom Action"]
 ],

 general: [
   ["send", "Send"],
   ["transfer", "Transfer"],
   ["approve", "Approve"],
   ["permit", "Permit"],
   ["contract-call", "Contract Call"],
   ["deploy", "Deploy"],
   ["upgrade", "Upgrade"],
   ["mint", "Mint"],
   ["burn", "Burn"],
   ["claim", "Claim"],
   ["deposit", "Deposit"],
   ["withdraw", "Withdraw"],
   ["stake", "Stake"],
   ["unstake", "Unstake"],
   ["bridge", "Bridge"],
   ["custom-action", "Custom Action"]
 ]
};



const AGENT_ACTION_FIELDS = {

  defi: {
    swap: [
      ["tokenIn","Token In","text",""],
      ["tokenOut","Token Out","text",""],
      ["amount","Amount In","number","300"],
      ["amountOutMin","Minimum Amount Out","number","0"],
      ["recipient","Recipient","text",""]
    ],
    deposit: [
      ["protocol","Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"]
    ],
    withdraw: [
      ["protocol","Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"]
    ],
    supply: [
      ["protocol","Lending Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Supply Amount","number","300"]
    ],
    redeem: [
      ["protocol","Protocol","text",""],
      ["position","Position / Receipt","text",""],
      ["amount","Amount","number","300"]
    ],
    lend: [
      ["protocol","Lending Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Lend Amount","number","300"]
    ],
    borrow: [
      ["protocol","Lending Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Borrow Amount","number","300"]
    ],
    repay: [
      ["protocol","Lending Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Repayment Amount","number","300"]
    ],
    stake: [
      ["protocol","Staking Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Stake Amount","number","300"],
      ["duration","Duration","number",""]
    ],
    unstake: [
      ["protocol","Staking Protocol","text",""],
      ["asset","Staked Asset","text",""],
      ["amount","Unstake Amount","number","300"]
    ],
    "lp-add": [
      ["protocol","Liquidity Protocol","text",""],
      ["pool","Liquidity Pool","text",""],
      ["amount","Liquidity Amount","number","300"]
    ],
    "lp-remove": [
      ["protocol","Liquidity Protocol","text",""],
      ["pool","Liquidity Pool","text",""],
      ["amount","Liquidity Amount","number","300"]
    ],
    claim: [
      ["protocol","Protocol","text",""],
      ["reward","Reward / Claim","text",""]
    ],
    approve: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"]
    ],
    permit: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"],
      ["deadline","Deadline","number",""]
    ],
    bridge: [
      ["asset","Asset","text",""],
      ["amount","Bridge Amount","number","300"],
      ["destinationChain","Destination Chain","select",""],
      ["bridge","Bridge Provider","text",""],
      ["recipient","Destination Recipient","text",""]
    ],
    wrap: [
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"]
    ],
    unwrap: [
      ["asset","Wrapped Asset","text",""],
      ["amount","Amount","number","300"]
    ],
    mint: [
      ["asset","Asset / Collection","text",""],
      ["quantity","Quantity","number","1"]
    ],
    burn: [
      ["asset","Asset / Position","text",""],
      ["quantity","Quantity","number","1"]
    ],
    liquidate: [
      ["protocol","Lending Protocol","text",""],
      ["position","Position","text",""],
      ["amount","Liquidation Amount","number","300"]
    ],
    rebalance: [
      ["protocol","Protocol / Portfolio","text",""],
      ["portfolio","Portfolio","text",""],
      ["parameters","Rebalance Parameters","text",""]
    ],
    "contract-call": [
      ["contract","Contract","text",""],
      ["function","Function","text",""],
      ["selector","Selector","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["target","Target","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  "prediction-market": {
    "buy-position": [
      ["market","Market","text",""],
      ["position","Position / Outcome","text",""],
      ["amount","Purchase Amount","number","300"],
      ["price","Price / Limit","number",""]
    ],
    "sell-position": [
      ["market","Market","text",""],
      ["position","Position / Outcome","text",""],
      ["amount","Sale Amount","number","300"],
      ["price","Price / Limit","number",""]
    ],
    "add-position": [
      ["market","Market","text",""],
      ["position","Position / Outcome","text",""],
      ["amount","Additional Amount","number","300"]
    ],
    "reduce-position": [
      ["market","Market","text",""],
      ["position","Position / Outcome","text",""],
      ["amount","Reduction Amount","number","300"]
    ],
    "close-position": [
      ["market","Market","text",""],
      ["position","Position / Outcome","text",""]
    ],
    "deposit-collateral": [
      ["market","Market","text",""],
      ["asset","Collateral Asset","text",""],
      ["amount","Collateral Amount","number","300"]
    ],
    "withdraw-collateral": [
      ["market","Market","text",""],
      ["asset","Collateral Asset","text",""],
      ["amount","Collateral Amount","number","300"]
    ],
    "claim-winnings": [
      ["market","Market","text",""],
      ["position","Winning Position","text",""]
    ],
    "redeem-position": [
      ["market","Market","text",""],
      ["position","Position","text",""],
      ["amount","Redemption Amount","number","300"]
    ],
    "split-position": [
      ["market","Market","text",""],
      ["position","Position","text",""],
      ["amount","Split Amount","number","300"]
    ],
    "merge-position": [
      ["market","Market","text",""],
      ["positions","Positions","text",""],
      ["amount","Merge Amount","number","300"]
    ],
    trade: [
      ["market","Market","text",""],
      ["position","Position","text",""],
      ["amount","Trade Amount","number","300"],
      ["price","Price / Limit","number",""]
    ],
    approve: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"]
    ],
    "contract-call": [
      ["contract","Market Contract","text",""],
      ["function","Function","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["market","Market","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  gaming: {
    purchase: [
      ["game","Game / Marketplace","text",""],
      ["item","Item","text",""],
      ["quantity","Quantity","number","1"],
      ["amount","Purchase Amount","number","300"]
    ],
    sell: [
      ["game","Game / Marketplace","text",""],
      ["item","Item","text",""],
      ["quantity","Quantity","number","1"],
      ["amount","Sale Amount","number","300"]
    ],
    trade: [
      ["game","Game / Marketplace","text",""],
      ["item","Item / Asset","text",""],
      ["quantity","Quantity","number","1"],
      ["amount","Trade Value","number","300"]
    ],
    transfer: [
      ["game","Game","text",""],
      ["item","Item / Asset","text",""],
      ["quantity","Quantity","number","1"],
      ["recipient","Recipient","text",""]
    ],
    mint: [
      ["game","Game / Collection","text",""],
      ["item","Item / Collection","text",""],
      ["quantity","Quantity","number","1"]
    ],
    burn: [
      ["game","Game","text",""],
      ["item","Item / Asset","text",""],
      ["quantity","Quantity","number","1"]
    ],
    claim: [
      ["game","Game","text",""],
      ["reward","Reward / Claim","text",""]
    ],
    upgrade: [
      ["game","Game","text",""],
      ["item","Item / Character","text",""],
      ["upgrade","Upgrade","text",""]
    ],
    craft: [
      ["game","Game","text",""],
      ["recipe","Recipe","text",""],
      ["quantity","Quantity","number","1"],
      ["materials","Materials","text",""]
    ],
    equip: [
      ["game","Game","text",""],
      ["item","Item","text",""],
      ["character","Character / Loadout","text",""]
    ],
    unequip: [
      ["game","Game","text",""],
      ["item","Item","text",""],
      ["character","Character / Loadout","text",""]
    ],
    stake: [
      ["game","Game","text",""],
      ["asset","Asset","text",""],
      ["amount","Stake Amount","number","300"],
      ["duration","Duration","number",""]
    ],
    unstake: [
      ["game","Game","text",""],
      ["asset","Staked Asset","text",""],
      ["amount","Unstake Amount","number","300"]
    ],
    deposit: [
      ["game","Game","text",""],
      ["asset","Asset","text",""],
      ["amount","Deposit Amount","number","300"]
    ],
    withdraw: [
      ["game","Game","text",""],
      ["asset","Asset","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    approve: [
      ["asset","Token / Asset","text",""],
      ["spender","Game Contract","text",""],
      ["allowance","Allowance","number","300"]
    ],
    "marketplace-listing": [
      ["marketplace","Marketplace","text",""],
      ["item","Item","text",""],
      ["amount","Listing Price","number","300"]
    ],
    "marketplace-bid": [
      ["marketplace","Marketplace","text",""],
      ["item","Item","text",""],
      ["amount","Bid Amount","number","300"]
    ],
    "marketplace-offer": [
      ["marketplace","Marketplace","text",""],
      ["item","Item","text",""],
      ["amount","Offer Amount","number","300"]
    ],
    "contract-call": [
      ["contract","Game Contract","text",""],
      ["function","Function","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["game","Game","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  dao: {
    transfer: [
      ["asset","Asset","text",""],
      ["amount","Transfer Amount","number","300"],
      ["recipient","Recipient","text",""]
    ],
    deposit: [
      ["treasury","Treasury","text",""],
      ["asset","Asset","text",""],
      ["amount","Deposit Amount","number","300"]
    ],
    withdraw: [
      ["treasury","Treasury","text",""],
      ["asset","Asset","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    approve: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"]
    ],
    delegate: [
      ["governance","Governance","text",""],
      ["delegate","Delegate","text",""],
      ["amount","Delegation Amount","number","300"]
    ],
    undelegate: [
      ["governance","Governance","text",""],
      ["delegate","Delegate","text",""],
      ["amount","Undelegation Amount","number","300"]
    ],
    propose: [
      ["governance","Governance","text",""],
      ["proposal","Proposal","text",""],
      ["description","Description","text",""],
      ["target","Target","text",""],
      ["parameters","Proposal Parameters","text",""]
    ],
    vote: [
      ["governance","Governance","text",""],
      ["proposal","Proposal","text",""],
      ["vote","Vote","select",""]
    ],
    queue: [
      ["governance","Governance","text",""],
      ["proposal","Proposal","text",""]
    ],
    execute: [
      ["governance","Governance","text",""],
      ["proposal","Proposal","text",""],
      ["parameters","Execution Parameters","text",""]
    ],
    "cancel-proposal": [
      ["governance","Governance","text",""],
      ["proposal","Proposal","text",""]
    ],
    claim: [
      ["treasury","Treasury","text",""],
      ["claim","Claim","text",""]
    ],
    stream: [
      ["treasury","Treasury","text",""],
      ["recipient","Recipient","text",""],
      ["asset","Asset","text",""],
      ["amount","Stream Amount","number","300"],
      ["duration","Duration","number",""]
    ],
    "create-grant": [
      ["dao","DAO","text",""],
      ["grant","Grant","text",""],
      ["recipient","Grant Recipient","text",""],
      ["amount","Grant Amount","number","300"]
    ],
    "fund-grant": [
      ["dao","DAO","text",""],
      ["grant","Grant","text",""],
      ["amount","Funding Amount","number","300"]
    ],
    "contract-call": [
      ["contract","Treasury Contract","text",""],
      ["function","Function","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["dao","DAO","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  "agent-payment": {
    pay: [
      ["recipient","Recipient","text",""],
      ["asset","Asset","text",""],
      ["amount","Payment Amount","number","300"],
      ["reference","Payment Reference","text",""]
    ],
    send: [
      ["recipient","Recipient","text",""],
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"]
    ],
    transfer: [
      ["recipient","Recipient","text",""],
      ["asset","Asset","text",""],
      ["amount","Transfer Amount","number","300"]
    ],
    "request-payment": [
      ["counterparty","Payer / Counterparty","text",""],
      ["asset","Asset","text",""],
      ["amount","Requested Amount","number","300"],
      ["reference","Payment Request","text",""]
    ],
    "split-payment": [
      ["recipients","Payment Recipients","text",""],
      ["asset","Asset","text",""],
      ["amount","Total Amount","number","300"],
      ["allocation","Allocation","text",""]
    ],
    "recurring-payment": [
      ["recipient","Recipient","text",""],
      ["asset","Asset","text",""],
      ["amount","Payment Amount","number","300"],
      ["frequency","Frequency","text",""],
      ["duration","Duration","number",""]
    ],
    deposit: [
      ["account","Payment Account","text",""],
      ["asset","Asset","text",""],
      ["amount","Deposit Amount","number","300"]
    ],
    withdraw: [
      ["account","Payment Account","text",""],
      ["asset","Asset","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    refund: [
      ["payment","Original Payment","text",""],
      ["asset","Asset","text",""],
      ["amount","Refund Amount","number","300"]
    ],
    claim: [
      ["payment","Payment / Claim","text",""]
    ],
    approve: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"]
    ],
    "contract-call": [
      ["contract","Payment Contract","text",""],
      ["function","Function","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["target","Payment Target","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  "virtual-card": {
    purchase: [
      ["card","Card","text",""],
      ["merchant","Merchant","text",""],
      ["amount","Purchase Amount","number","300"],
      ["currency","Currency","text",""]
    ],
    authorize: [
      ["card","Card","text",""],
      ["merchant","Merchant","text",""],
      ["amount","Authorization Amount","number","300"],
      ["currency","Currency","text",""]
    ],
    capture: [
      ["payment","Payment Authorization","text",""],
      ["amount","Capture Amount","number","300"]
    ],
    void: [
      ["payment","Payment Authorization","text",""]
    ],
    refund: [
      ["payment","Original Payment","text",""],
      ["amount","Refund Amount","number","300"]
    ],
    "partial-refund": [
      ["payment","Original Payment","text",""],
      ["amount","Refund Amount","number","300"]
    ],
    payment: [
      ["card","Card","text",""],
      ["merchant","Merchant","text",""],
      ["amount","Payment Amount","number","300"],
      ["currency","Currency","text",""]
    ],
    transfer: [
      ["source","Source Account","text",""],
      ["destination","Destination Account","text",""],
      ["amount","Transfer Amount","number","300"]
    ],
    deposit: [
      ["card","Card / Account","text",""],
      ["amount","Deposit Amount","number","300"]
    ],
    withdraw: [
      ["card","Card / Account","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    "fund-card": [
      ["card","Card","text",""],
      ["asset","Funding Asset","text",""],
      ["amount","Funding Amount","number","300"]
    ],
    "withdraw-card-balance": [
      ["card","Card","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    approve: [
      ["payment","Payment","text",""],
      ["authorization","Authorization","text",""]
    ],
    "contract-call": [
      ["contract","Payment Contract","text",""],
      ["function","Function","text",""],
      ["parameters","Parameters","text",""]
    ],
    "custom-action": [
      ["target","Payment Target","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  },

  general: {
    send: [
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"],
      ["recipient","Recipient","text",""]
    ],
    transfer: [
      ["asset","Asset","text",""],
      ["amount","Amount","number","300"],
      ["recipient","Recipient","text",""]
    ],
    approve: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"]
    ],
    permit: [
      ["asset","Token","text",""],
      ["spender","Spender","text",""],
      ["allowance","Allowance","number","300"],
      ["deadline","Deadline","number",""]
    ],
    "contract-call": [
      ["contract","Contract","text",""],
      ["function","Function","text",""],
      ["selector","Selector","text",""],
      ["parameters","Parameters","text",""]
    ],
    deploy: [
      ["contract","Contract","text",""],
      ["parameters","Constructor Parameters","text",""]
    ],
    upgrade: [
      ["contract","Contract","text",""],
      ["upgrade","Upgrade","text",""],
      ["parameters","Upgrade Parameters","text",""]
    ],
    mint: [
      ["asset","Asset / Collection","text",""],
      ["quantity","Quantity","number","1"],
      ["parameters","Mint Parameters","text",""]
    ],
    burn: [
      ["asset","Asset / Token","text",""],
      ["quantity","Quantity","number","1"],
      ["parameters","Burn Parameters","text",""]
    ],
    claim: [
      ["claim","Claim / Reward","text",""],
      ["parameters","Claim Parameters","text",""]
    ],
    deposit: [
      ["protocol","Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Deposit Amount","number","300"]
    ],
    withdraw: [
      ["protocol","Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Withdrawal Amount","number","300"]
    ],
    stake: [
      ["protocol","Staking Protocol","text",""],
      ["asset","Asset","text",""],
      ["amount","Stake Amount","number","300"]
    ],
    unstake: [
      ["protocol","Staking Protocol","text",""],
      ["asset","Staked Asset","text",""],
      ["amount","Unstake Amount","number","300"]
    ],
    bridge: [
      ["asset","Asset","text",""],
      ["amount","Bridge Amount","number","300"],
      ["destinationChain","Destination Chain","select",""],
      ["bridge","Bridge Provider","text",""],
      ["recipient","Destination Recipient","text",""]
    ],
    "custom-action": [
      ["target","Target","text",""],
      ["action","Action","text",""],
      ["parameters","Parameters","text",""]
    ]
  }
};

  return { AGENT_ACTIONS, AGENT_ACTION_FIELDS };
});
