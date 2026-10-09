
const PHORVA_PAGES = {'introduction': '\n<section class="doc-hero">\n  <div class="eyebrow">PHORVA / OVERVIEW</div>\n  <h1>Verifiable execution for autonomous agents.</h1>\n  <p>\n    Phorva is a verification and control layer between autonomous systems\n    and blockchain execution. It evaluates declared intent, policy and risk,\n    verifies the execution that actually occurs, and produces a structured\n    verifiable result.\n  </p>\n</section>\n\n<div class="notice">\n  <strong>Core principle</strong>\n  <p>\n    Any autonomous system can declare an intent. Phorva evaluates policy and\n    risk, verifies the actual execution against the authorized intent, and\n    produces a verifiable result.\n  </p>\n</div>\n\n<div class="cards">\n  <div class="card"><h3>Agent</h3><p>Decides what it wants to do.</p></div>\n  <div class="card"><h3>Phorva</h3><p>Verifies whether the intended execution is authorized.</p></div>\n  <div class="card"><h3>Protocol</h3><p>Executes the requested operation.</p></div>\n  <div class="card"><h3>Blockchain</h3><p>Records the resulting execution.</p></div>\n</div>\n', 'architecture': '\n<div class="eyebrow">OVERVIEW / ARCHITECTURE</div>\n<h1>Phorva architecture</h1>\n<p>\n  Phorva is designed as a provider-agnostic and protocol-agnostic\n  verification control plane.\n</p>\n\n<div class="architecture">\n  <div>AGENT</div><span>→</span>\n  <div class="accent">PHORVA CORE</div><span>→</span>\n  <div>INTENT</div><span>→</span>\n  <div>POLICY</div><span>→</span>\n  <div>RISK</div><span>→</span>\n  <div>AUTHORIZATION</div><span>→</span>\n  <div>EXECUTION</div>\n</div>\n\n<h2>Verification flow</h2>\n<ol class="steps">\n  <li><strong>Intent</strong> — establish what the autonomous system says it intends to do.</li>\n  <li><strong>Policy</strong> — apply limits, allowlists, restrictions and authorization rules.</li>\n  <li><strong>Risk</strong> — evaluate transaction and execution conditions.</li>\n  <li><strong>Authorization</strong> — determine whether the execution is permitted.</li>\n  <li><strong>Execution verification</strong> — compare actual execution with the authorized conditions.</li>\n  <li><strong>Evidence</strong> — produce the verification result, trace, commitment and receipt where applicable.</li>\n</ol>\n\n<h2>Infrastructure boundary</h2>\n<p>\n  Phorva defines the verification semantics. Providers supply proving or\n  verification machinery where required. Protocol adapters connect Phorva\n  verification to underlying execution systems.\n</p>\n', 'core-concepts': '\n<div class="eyebrow">OVERVIEW / CORE CONCEPTS</div>\n<h1>Core concepts</h1>\n\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>The declared action and constraints an autonomous system intends to execute.</p></div>\n  <div class="card"><h3>Policy</h3><p>Rules defining what an agent is permitted to execute.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluation of execution conditions and potentially unsafe behavior.</p></div>\n  <div class="card"><h3>Authorization</h3><p>The canonical determination of whether an execution is permitted.</p></div>\n  <div class="card"><h3>Execution Graph</h3><p>A representation of the operations and relationships involved in execution.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Structured information supporting the verification result.</p></div>\n</div>\n\n<h2>Agent identity</h2>\n<p>\n  Agent identity connects an execution request to the autonomous system,\n  wallet or integration context that requested verification.\n</p>\n\n<h2>Trust boundaries</h2>\n<p>\n  Inputs supplied by an agent or caller are treated as claims to be validated,\n  not automatically trusted authorization facts.\n</p>\n', 'what-is': '\n<div class="eyebrow">OVERVIEW / BOUNDARIES</div>\n<h1>What Phorva is — and is not</h1>\n\n<h2>Phorva is</h2>\n<ul>\n  <li>A verification and control layer for autonomous execution.</li>\n  <li>A policy and authorization verification system.</li>\n  <li>A transaction and execution analysis layer.</li>\n  <li>A provider-agnostic verification architecture.</li>\n  <li>A protocol-agnostic control plane.</li>\n</ul>\n\n<h2>Phorva is not</h2>\n<ul>\n  <li>An agent wallet.</li>\n  <li>A blockchain.</li>\n  <li>A prover network.</li>\n  <li>A zk-proof marketplace.</li>\n  <li>An execution venue.</li>\n  <li>A place where agents live.</li>\n</ul>\n\n<div class="notice">\n  <strong>Boundary</strong>\n  <p>\n    Agent wallets hold or control assets. Phorva verifies whether an agent\'s\n    intended execution is authorized.\n  </p>\n</div>\n', 'quickstart': '\n<div class="eyebrow">GET STARTED / QUICKSTART</div>\n<h1>Quickstart</h1>\n<p>Install the Phorva SDK and connect an application to the verification layer.</p>\n\n<h2>Install</h2>\n<pre><code>npm install @phorva/sdk</code></pre>\n\n<h2>Initialize</h2>\n<pre><code>import { Phorva } from \'@phorva/sdk\';\n\nconst phorva = new Phorva({\n  apiKey: process.env.PHORVA_API_KEY,\n  network: \'baseSepolia\'\n});</code></pre>\n\n<h2>Verification request</h2>\n<pre><code>const result = await phorva.authorize({\n  intent: {\n    type: \'swap\',\n    amount: \'300\',\n    token: \'USDC\'\n  },\n  policy: {\n    maxTransactionAmount: 500\n  }\n});\n\nconsole.log(result);</code></pre>\n\n<div class="notice">\n  <strong>Production note</strong>\n  <p>\n    Network availability, API capabilities and protocol adapters are\n    documented according to their implementation status. Testnet support\n    must not be interpreted as mainnet availability.\n  </p>\n</div>\n', 'sdk': '\n<div class="eyebrow">GET STARTED / SDK</div>\n<h1>Phorva SDK</h1>\n<p>\n  The SDK provides an application-facing interface for submitting execution\n  verification requests.\n</p>\n\n<h2>JavaScript / TypeScript</h2>\n<pre><code>import { Phorva } from \'@phorva/sdk\';\n\nconst phorva = new Phorva({\n  apiKey: process.env.PHORVA_API_KEY\n});</code></pre>\n\n<h2>Integration model</h2>\n<p>\n  An agent or application submits an intent and execution context. Phorva\n  evaluates the request and returns a structured verification result.\n</p>\n', 'api': '\n<div class="eyebrow">GET STARTED / API</div>\n<h1>Phorva API</h1>\n<p>\n  The API is the programmatic interface between applications and the Phorva\n  verification engine.\n</p>\n\n<h2>Verification</h2>\n<pre><code>POST /v1/verify</code></pre>\n\n<h2>Health</h2>\n<pre><code>GET /v1/health</code></pre>\n\n<h2>Authentication</h2>\n<p>\n  API requests use a Phorva API key supplied as a Bearer credential.\n</p>\n\n<pre><code>Authorization: Bearer YOUR_PHORVA_API_KEY</code></pre>\n', 'authentication': '\n<div class="eyebrow">GET STARTED / AUTHENTICATION</div>\n<h1>Authentication</h1>\n<p>\n  Phorva API access is authenticated using project-scoped API keys.\n</p>\n\n<h2>Environment separation</h2>\n<div class="cards">\n  <div class="card"><h3>Test</h3><p>For development and test environments.</p></div>\n  <div class="card"><h3>Production</h3><p>For production integrations when production access is available.</p></div>\n</div>\n\n<h2>Secret handling</h2>\n<ul>\n  <li>Keep API keys in environment variables or a secret manager.</li>\n  <li>Never commit secrets to source control.</li>\n  <li>Rotate compromised credentials.</li>\n  <li>The full secret should only be displayed at creation time by the Developer Console.</li>\n</ul>\n', 'connect': '\n<div class="eyebrow">GET STARTED / CONNECTION</div>\n<h1>How to connect</h1>\n<p>\n  Applications can integrate Phorva through the SDK or directly through the\n  verification API.\n</p>\n\n<div class="architecture">\n  <div>AGENT</div><span>→</span>\n  <div>SDK / API</div><span>→</span>\n  <div class="accent">PHORVA</div><span>→</span>\n  <div>VERIFICATION</div><span>→</span>\n  <div>RESULT</div>\n</div>\n', 'intent': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Intent</h1>\n<p>Intent matching compares the declared action and constraints with the execution that is actually evaluated.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'policy': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Policy</h1>\n<p>Policies define transaction limits, protocol and contract allowlists, chain restrictions, asset restrictions and other authorization conditions.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'risk': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Risk</h1>\n<p>Risk evaluation considers the conditions surrounding an execution and can contribute to an allow or block decision.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'authorization': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Authorization</h1>\n<p>Authorization is the canonical determination of whether a requested execution satisfies the applicable authorization conditions.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'transaction': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Transaction Verification</h1>\n<p>Transaction verification analyzes transaction fields, calldata and execution conditions rather than relying solely on caller-supplied claims.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'execution-graph': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Execution Graph</h1>\n<p>The execution graph represents the operations involved in an execution, including multi-step relationships where supported.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'final-state': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Final-State Verification</h1>\n<p>Final-state verification checks resulting state against the conditions that were expected from the authorized execution.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'trace': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Verification Trace</h1>\n<p>A verification trace records how verification conditions were evaluated and which checks contributed to the result.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'proof': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Proof / Evidence</h1>\n<p>Verified actions can produce structured evidence describing the intent, authorization, execution and verification result.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'commitment': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Commitment</h1>\n<p>A deterministic commitment can bind relevant execution and verification data to a verification result.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'receipts': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Verification Receipts</h1>\n<p>A verification receipt provides a structured record of the verification outcome and supporting evidence.</p>\n\n<h2>Verification conditions</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who or what requested the execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What the system declared it intended to do.</p></div>\n  <div class="card"><h3>Policy</h3><p>What the system is permitted to do.</p></div>\n  <div class="card"><h3>Execution</h3><p>What the transaction or execution actually contains.</p></div>\n</div>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Caller-provided authorization claims are not treated as authoritative without validation.</li>\n  <li>Transaction parameters can be compared with declared intent.</li>\n  <li>Contract, protocol and chain conditions can be evaluated.</li>\n  <li>Verification results can carry structured evidence.</li>\n</ul>\n', 'verification-semantics': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Verification semantics</h1>\n<p>\n  Phorva\'s core abstraction is the definition of what must be true for an\n  autonomous execution to be considered authorized and verified.\n</p>\n\n<h2>Semantic layers</h2>\n<div class="cards">\n  <div class="card"><h3>Identity</h3><p>Who is requesting or controlling execution.</p></div>\n  <div class="card"><h3>Intent</h3><p>What was intended.</p></div>\n  <div class="card"><h3>Policy</h3><p>What is permitted.</p></div>\n  <div class="card"><h3>Execution</h3><p>What actually happened or is being proposed.</p></div>\n  <div class="card"><h3>Result</h3><p>Whether the relevant conditions were satisfied.</p></div>\n</div>\n', 'transaction-analysis': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Transaction analysis</h1>\n<p>\n  Transaction analysis examines execution data such as chain identity,\n  destination, function selector, calldata parameters, native value and\n  relevant token information.\n</p>\n\n<h2>Checks</h2>\n<ul>\n  <li>Chain verification</li>\n  <li>Contract verification</li>\n  <li>Protocol verification</li>\n  <li>Function-selector verification</li>\n  <li>Parameter verification</li>\n  <li>Native-value verification</li>\n  <li>Token verification</li>\n  <li>Amount verification</li>\n</ul>\n', 'security-model': '\n<div class="eyebrow">VERIFICATION / SECURITY</div>\n<h1>Verification security model</h1>\n<p>\n  Phorva treats security-critical execution claims as data that must be\n  validated. A caller cannot make an execution authorized simply by placing\n  an authorization claim in the request.\n</p>\n\n<h2>Trust boundaries</h2>\n<ul>\n  <li>Agent and application inputs</li>\n  <li>Wallet and signing systems</li>\n  <li>Phorva verification engine</li>\n  <li>Protocol adapters</li>\n  <li>External proving or verification providers</li>\n  <li>Blockchain execution environment</li>\n</ul>\n', 'failure-states': '\n<div class="eyebrow">VERIFICATION</div>\n<h1>Failure and rejection states</h1>\n<p>\n  Verification can reject an execution when required authorization or\n  execution conditions are not satisfied.\n</p>\n\n<div class="cards">\n  <div class="card"><h3>Intent mismatch</h3><p>Actual execution differs from the declared intent.</p></div>\n  <div class="card"><h3>Policy violation</h3><p>The execution exceeds a configured policy condition.</p></div>\n  <div class="card"><h3>Unexpected contract</h3><p>The destination does not satisfy the allowed contract condition.</p></div>\n  <div class="card"><h3>Wrong chain</h3><p>The execution occurs on an unauthorized chain.</p></div>\n  <div class="card"><h3>Parameter mismatch</h3><p>Relevant calldata or execution parameters differ from expectations.</p></div>\n  <div class="card"><h3>Risk rejection</h3><p>Risk conditions do not satisfy the applicable authorization requirements.</p></div>\n</div>\n', 'transfers': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Transfers</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Native transfers</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>ERC-20 transfers</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Token spending</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'approvals': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Approvals</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>ERC-20 approvals</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Permit / signature-based approvals</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Allowance changes</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Approval risk</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'swaps': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Swaps</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Token swaps</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Amount verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Slippage conditions</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Protocol verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Route validation</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'withdrawals': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Withdrawals</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Vault withdrawals</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Protocol withdrawals</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Asset and amount verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Final-state verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'defi': '\n<div class="eyebrow">USE CASES</div>\n<h1>DeFi</h1>\n<p>Verify autonomous interactions with decentralized finance protocols.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n', 'bridges': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Bridges</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Cross-chain transfers</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Cross-chain swaps</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Source validation</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Destination validation</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Destination-state verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'custom-calls': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Custom Contract Calls</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Arbitrary calldata</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Function selectors</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Contract interactions</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Batch transactions</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Multicall</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Multi-contract execution</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'multi-step': '\n<div class="eyebrow">ACTIONS</div>\n<h1>Multi-Step Execution</h1>\n<p>\n  Phorva\'s execution model is intentionally broader than a single transaction\n  type. The same verification semantics can be applied to different\n  autonomous execution actions.\n</p>\n<div class="cards">\n<div class="card"><h3>Execution graphs</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Step ordering</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Intermediate conditions</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Cross-contract execution</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div><div class="card"><h3>Final-state verification</h3><p>Verification conditions can be applied according to the integration and implementation status.</p></div>\n</div>\n', 'prediction-markets': '\n<div class="eyebrow">USE CASES</div>\n<h1>Prediction Markets</h1>\n<p>Verify market participation, orders, positions, collateral and settlement-related execution.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Potential action model</h2>\n<ul>\n  <li>Market creation</li>\n  <li>Market participation</li>\n  <li>Buy or sell outcome</li>\n  <li>Position management</li>\n  <li>Order placement and cancellation</li>\n  <li>Settlement</li>\n  <li>Claim winnings</li>\n  <li>Redeem positions</li>\n  <li>Collateral movement</li>\n  <li>Maximum position and exposure limits</li>\n</ul>\n<p>Potential integrations include prediction-market infrastructure such as Polymarket and Kalshi, subject to actual integration and availability.</p>\n', 'autonomous-trading': '\n<div class="eyebrow">USE CASES</div>\n<h1>Autonomous Trading</h1>\n<p>Apply authorization and verification controls to trading agents and automated strategies.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Trading controls</h2>\n<ul>\n  <li>Strategy authorization</li>\n  <li>Maximum trade size</li>\n  <li>Daily exposure</li>\n  <li>Token restrictions</li>\n  <li>Protocol restrictions</li>\n  <li>Slippage limits</li>\n  <li>Position limits</li>\n  <li>Multi-step strategy verification</li>\n  <li>Unexpected transaction detection</li>\n  <li>Final-state verification</li>\n</ul>\n', 'agent-payments': '\n<div class="eyebrow">USE CASES</div>\n<h1>Agent Payments</h1>\n<p>Verify agent-to-agent, agent-to-user, merchant and stablecoin payment execution.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Payment controls</h2>\n<ul>\n  <li>Payment limits</li>\n  <li>Spending limits</li>\n  <li>Payment authorization</li>\n  <li>Stablecoin payments</li>\n  <li>Cross-chain payments</li>\n  <li>Payment verification</li>\n  <li>Payment receipts</li>\n  <li>Payment policy</li>\n</ul>\n', 'virtual-cards': '\n<div class="eyebrow">USE CASES</div>\n<h1>Virtual Cards</h1>\n<p>Provide the verification and control layer around virtual-card transaction authorization.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Virtual-card verification</h2>\n<ul>\n  <li>Payment intent</li>\n  <li>Merchant and category policy</li>\n  <li>Transaction amount limits</li>\n  <li>Daily and monthly limits</li>\n  <li>Merchant restrictions</li>\n  <li>Authorization</li>\n  <li>Risk evaluation</li>\n  <li>Approved / blocked decisions</li>\n  <li>Evidence and receipts</li>\n</ul>\n<p>\n  Phorva provides the verification and control layer. It does not need to be\n  the card issuer or card network.\n</p>\n', 'gaming': '\n<div class="eyebrow">USE CASES</div>\n<h1>Gaming</h1>\n<p>Verify agent-controlled game actions, purchases, assets and marketplace execution.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Potential gaming actions</h2>\n<ul>\n  <li>In-game purchases</li>\n  <li>Asset purchases and transfers</li>\n  <li>NFT purchases and transfers</li>\n  <li>Marketplace transactions</li>\n  <li>Game rewards</li>\n  <li>Agent-controlled game actions</li>\n  <li>Asset approvals</li>\n  <li>Trading of game assets</li>\n  <li>Spending limits and game/contract allowlists</li>\n</ul>\n', 'agent-wallets': '\n<div class="eyebrow">USE CASES</div>\n<h1>Agent Wallets</h1>\n<p>Integrate with wallets that hold or control assets while Phorva verifies whether intended execution is authorized.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Integration boundary</h2>\n<div class="architecture">\n  <div>AGENT</div><span>→</span>\n  <div>WALLET</div><span>→</span>\n  <div class="accent">PHORVA</div><span>→</span>\n  <div>PROTOCOL</div><span>→</span>\n  <div>CHAIN</div>\n</div>\n<p>\n  Agent wallets hold or control assets. Phorva verifies whether an agent\'s\n  intended execution is authorized.\n</p>\n', 'daos-treasuries': '\n<div class="eyebrow">USE CASES</div>\n<h1>DAOs & Treasuries</h1>\n<p>Apply execution verification and spending policies to treasury operations.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n\n<h2>Treasury controls</h2>\n<ul>\n  <li>Treasury transactions</li>\n  <li>Spending policies</li>\n  <li>Multisignature workflows</li>\n  <li>Protocol and contract allowlists</li>\n  <li>Spending limits</li>\n  <li>Asset restrictions</li>\n  <li>Proposal execution</li>\n  <li>Automated treasury operations</li>\n  <li>Execution verification</li>\n  <li>Audit trail and evidence</li>\n</ul>\n', 'onchain-automation': '\n<div class="eyebrow">USE CASES</div>\n<h1>On-chain Automation</h1>\n<p>Verify automated on-chain operations against declared intent and policy.</p>\n\n<h2>Common controls</h2>\n<div class="cards">\n  <div class="card"><h3>Intent</h3><p>Define the expected action.</p></div>\n  <div class="card"><h3>Policy</h3><p>Set limits and restrictions.</p></div>\n  <div class="card"><h3>Risk</h3><p>Evaluate execution conditions.</p></div>\n  <div class="card"><h3>Verification</h3><p>Compare actual execution with authorization.</p></div>\n  <div class="card"><h3>Evidence</h3><p>Record the resulting verification information.</p></div>\n</div>\n\n<h2>Implementation status</h2>\n<div class="notice">\n  <strong>Documentation boundary</strong>\n  <p>\n    Individual protocols and rails are documented as implemented, testnet,\n    planned or ecosystem targets according to their actual integration status.\n  </p>\n</div>\n', 'chains': '\n<div class="eyebrow">INFRASTRUCTURE / CHAINS</div>\n<h1>Chains</h1>\n<p>\n  Phorva is designed for multi-chain execution verification rather than a\n  single-chain product.\n</p>\n\n<h2>Current development environments</h2>\n<div class="cards">\n  <div class="card"><h3>Base Sepolia</h3><p>Chain ID 84532.</p></div>\n  <div class="card"><h3>Ethereum Sepolia</h3><p>Chain ID 11155111.</p></div>\n  <div class="card"><h3>Arbitrum Sepolia</h3><p>Chain ID 421614.</p></div>\n</div>\n\n<h2>Chain verification</h2>\n<ul>\n  <li>Chain identity</li>\n  <li>Chain matching</li>\n  <li>RPC providers</li>\n  <li>Block verification</li>\n  <li>Transaction lookup</li>\n  <li>Multi-chain execution</li>\n</ul>\n\n<p>\n  Ethereum, Base, Arbitrum and additional EVM environments can be supported\n  through the architecture. Future non-EVM support is possible where the\n  verification model can be implemented appropriately.\n</p>\n', 'protocols': '\n<div class="eyebrow">INFRASTRUCTURE / PROTOCOLS</div>\n<h1>Protocol integrations</h1>\n<p>\n  Phorva uses protocol and execution adapters so its verification semantics\n  are not hardcoded around one application.\n</p>\n\n<div class="architecture">\n  <div>PHORVA CORE</div><span>→</span>\n  <div class="accent">PROTOCOL / EXECUTION ADAPTER</div><span>→</span>\n  <div>UNDERLYING PROTOCOL</div>\n</div>\n\n<div class="cards">\n  <div class="card"><h3>Uniswap</h3><p>Protocol integration target.</p></div>\n  <div class="card"><h3>Aave</h3><p>Protocol integration target.</p></div>\n  <div class="card"><h3>Morpho</h3><p>Protocol integration target.</p></div>\n  <div class="card"><h3>Curve</h3><p>Protocol integration target.</p></div>\n  <div class="card"><h3>Aerodrome</h3><p>Protocol integration target.</p></div>\n  <div class="card"><h3>Sky</h3><p>Protocol integration target.</p></div>\n</div>\n\n<p>\n  Prediction-market, bridge, gaming and payment infrastructure can follow the\n  same adapter architecture. Individual integrations should not be presented\n  as live until implemented.\n</p>\n', 'providers': '\n<div class="eyebrow">INFRASTRUCTURE / PROVIDERS</div>\n<h1>Provider and prover infrastructure</h1>\n\n<p>\n  Phorva defines the verification semantics; providers supply the\n  proving/verification machinery.\n</p>\n\n<div class="cards">\n  <div class="card"><h3>Provider abstraction</h3><p>Keep Phorva semantics independent from a particular infrastructure provider.</p></div>\n  <div class="card"><h3>Provider adapters</h3><p>Connect external proving or verification systems.</p></div>\n  <div class="card"><h3>Provider selection</h3><p>Select infrastructure appropriate to a verification workload.</p></div>\n  <div class="card"><h3>Failure handling</h3><p>Account for provider failures and availability conditions.</p></div>\n  <div class="card"><h3>Fallback</h3><p>Support alternative infrastructure where the deployment architecture requires it.</p></div>\n  <div class="card"><h3>Proof lifecycle</h3><p>Manage proof generation and verification as infrastructure concerns.</p></div>\n</div>\n\n<div class="notice">\n  <strong>Positioning</strong>\n  <p>\n    Phorva is not building its own prover network. External providers can\n    supply proving and verification infrastructure while Phorva owns the\n    verification semantics and control-plane experience.\n  </p>\n</div>\n', 'infrastructure-security': '\n<div class="eyebrow">VERIFICATION / SECURITY</div>\n<h1>Verification security model</h1>\n<p>\n  Phorva treats security-critical execution claims as data that must be\n  validated. A caller cannot make an execution authorized simply by placing\n  an authorization claim in the request.\n</p>\n\n<h2>Trust boundaries</h2>\n<ul>\n  <li>Agent and application inputs</li>\n  <li>Wallet and signing systems</li>\n  <li>Phorva verification engine</li>\n  <li>Protocol adapters</li>\n  <li>External proving or verification providers</li>\n  <li>Blockchain execution environment</li>\n</ul>\n', 'api-reference': '\n<div class="eyebrow">GET STARTED / API</div>\n<h1>Phorva API</h1>\n<p>\n  The API is the programmatic interface between applications and the Phorva\n  verification engine.\n</p>\n\n<h2>Verification</h2>\n<pre><code>POST /v1/verify</code></pre>\n\n<h2>Health</h2>\n<pre><code>GET /v1/health</code></pre>\n\n<h2>Authentication</h2>\n<p>\n  API requests use a Phorva API key supplied as a Bearer credential.\n</p>\n\n<pre><code>Authorization: Bearer YOUR_PHORVA_API_KEY</code></pre>\n', 'api-keys': '\n<div class="eyebrow">DEVELOPER / API KEYS</div>\n<h1>API keys</h1>\n<p>\n  API keys provide authenticated access to Phorva projects.\n</p>\n\n<h2>Developer Console flow</h2>\n<div class="steps">\n  <div class="step"><strong>1. Account</strong><span>Create an account and organization.</span></div>\n  <div class="step"><strong>2. Project</strong><span>Create a project for an agent or application.</span></div>\n  <div class="step"><strong>3. Key</strong><span>Create a test or production API key.</span></div>\n  <div class="step"><strong>4. Integrate</strong><span>Store the key securely and connect the SDK or API.</span></div>\n</div>\n\n<h2>Lifecycle</h2>\n<pre><code>Account\n  → Organization\n  → Project\n  → API Key\n  → Agent\n  → Verification Requests\n  → Logs\n  → Usage\n  → Billing (later)</code></pre>\n\n<div class="notice">\n  <strong>Secret handling</strong>\n  <p>\n    A newly created secret should be displayed once. The server should retain\n    only the representation required to authenticate and manage the key.\n  </p>\n</div>\n', 'integration': '\n<div class="eyebrow">DEVELOPER / INTEGRATION</div>\n<h1>Integration guide</h1>\n\n<h2>Recommended architecture</h2>\n<div class="architecture">\n  <div>AGENT</div><span>→</span>\n  <div>YOUR APPLICATION</div><span>→</span>\n  <div class="accent">PHORVA API</div><span>→</span>\n  <div>VERIFICATION</div><span>→</span>\n  <div>EXECUTION</div>\n</div>\n\n<h2>Integration patterns</h2>\n<ul>\n  <li>Pre-execution verification</li>\n  <li>Wallet-provider integration</li>\n  <li>Automated trading verification</li>\n  <li>Agent payment verification</li>\n  <li>Protocol execution verification</li>\n  <li>Post-execution verification where final-state validation is required</li>\n</ul>\n', 'errors': '\n<div class="eyebrow">DEVELOPER / ERRORS</div>\n<h1>Error handling</h1>\n<p>\n  Integrations should distinguish infrastructure errors from verification\n  rejections.\n</p>\n\n<div class="cards">\n  <div class="card"><h3>Authentication error</h3><p>The API credential cannot be authenticated.</p></div>\n  <div class="card"><h3>Validation error</h3><p>The request does not satisfy the API input contract.</p></div>\n  <div class="card"><h3>Verification rejection</h3><p>The execution does not satisfy authorization conditions.</p></div>\n  <div class="card"><h3>Provider error</h3><p>External verification infrastructure failed or was unavailable.</p></div>\n  <div class="card"><h3>Execution error</h3><p>The underlying execution system reported an execution failure.</p></div>\n</div>\n', 'threat-model': '\n<div class="eyebrow">SECURITY</div>\n<h1>Threat model</h1>\n<p>\n  Phorva is designed around the assumption that autonomous execution can be\n  manipulated, misrepresented or unexpectedly changed between intent and\n  execution.\n</p>\n\n<div class="cards">\n  <div class="card"><h3>Caller manipulation</h3><p>Untrusted caller fields must not establish authorization.</p></div>\n  <div class="card"><h3>Calldata manipulation</h3><p>Encoded execution parameters can differ from declared intent.</p></div>\n  <div class="card"><h3>Approval risk</h3><p>Unexpected or excessive token approvals can create downstream risk.</p></div>\n  <div class="card"><h3>Wrong chain</h3><p>An execution may occur on an unauthorized network.</p></div>\n  <div class="card"><h3>Wrong token</h3><p>The actual asset may differ from the intended asset.</p></div>\n  <div class="card"><h3>Amount manipulation</h3><p>Actual transaction amounts can differ from intended amounts.</p></div>\n  <div class="card"><h3>Intent manipulation</h3><p>Declared intent itself must be handled within an authorization model.</p></div>\n  <div class="card"><h3>Execution graph integrity</h3><p>Multi-step execution must preserve the relationship between verified steps.</p></div>\n</div>\n', 'security-architecture': '\n<div class="eyebrow">SECURITY</div>\n<h1>Security architecture</h1>\n\n<h2>Trust boundaries</h2>\n<ul>\n  <li>Autonomous agent</li>\n  <li>Application</li>\n  <li>Wallet or signer</li>\n  <li>Phorva verification layer</li>\n  <li>Protocol adapter</li>\n  <li>External provider</li>\n  <li>Blockchain</li>\n</ul>\n\n<h2>Security properties</h2>\n<ul>\n  <li>Canonical authorization verification</li>\n  <li>Transaction parameter verification</li>\n  <li>Execution graph integrity</li>\n  <li>Final-state verification</li>\n  <li>Verification traceability</li>\n  <li>Evidence and auditability</li>\n</ul>\n', 'verification-integrity': '\n<div class="eyebrow">SECURITY</div>\n<h1>Verification integrity</h1>\n<p>\n  Authorization decisions should be derived from verifiable execution\n  conditions rather than accepted from untrusted request claims.\n</p>\n\n<h2>Integrity concerns</h2>\n<ul>\n  <li>Caller-input security</li>\n  <li>Authorization integrity</li>\n  <li>Calldata manipulation</li>\n  <li>Parameter manipulation</li>\n  <li>Unexpected contracts</li>\n  <li>Wrong-chain execution</li>\n  <li>Wrong-token execution</li>\n  <li>Amount manipulation</li>\n  <li>Replay considerations</li>\n  <li>Execution-graph integrity</li>\n  <li>Final-state verification</li>\n</ul>\n', 'auditability': '\n<div class="eyebrow">SECURITY / AUDITABILITY</div>\n<h1>Auditability</h1>\n<p>\n  Verification should produce enough structured information for developers,\n  operators and authorized reviewers to understand why an execution was\n  allowed or rejected.\n</p>\n\n<ul>\n  <li>Verification logs</li>\n  <li>Execution traces</li>\n  <li>Verification history</li>\n  <li>Audit trail</li>\n  <li>Evidence</li>\n  <li>Receipts</li>\n  <li>Commitments</li>\n  <li>Transaction status</li>\n  <li>Rejected transactions</li>\n  <li>Risk events</li>\n  <li>Developer debugging</li>\n</ul>\n\n<h2>Audit roadmap</h2>\n<p>\n  Independent security review and formal audit are production roadmap items\n  and should not be represented as completed until actually performed.\n</p>\n', 'roadmap': '\n<div class="eyebrow">ROADMAP</div>\n<h1>Phorva roadmap</h1>\n\n<h2>Current / MVP</h2>\n<div class="cards">\n  <div class="card"><h3>Verification engine</h3><p>Core verification and authorization infrastructure.</p></div>\n  <div class="card"><h3>Multi-chain testnet</h3><p>Development environments across supported testnets.</p></div>\n  <div class="card"><h3>API surface</h3><p>Developer-facing verification API foundation.</p></div>\n  <div class="card"><h3>SDK</h3><p>Application integration layer.</p></div>\n  <div class="card"><h3>Execution graph</h3><p>Execution structure and verification representation.</p></div>\n  <div class="card"><h3>Verification trace</h3><p>Traceable verification conditions.</p></div>\n  <div class="card"><h3>Provider abstraction</h3><p>Provider-independent architecture.</p></div>\n  <div class="card"><h3>Proof / evidence model</h3><p>Structured verification evidence and commitments.</p></div>\n</div>\n\n<h2>Production</h2>\n<ul>\n  <li>Mainnet deployment</li>\n  <li>External provider integrations</li>\n  <li>Wallet integrations</li>\n  <li>Persistent verification records</li>\n  <li>Production SDK</li>\n  <li>Expanded protocol adapters</li>\n  <li>Monitoring</li>\n  <li>Security audit</li>\n</ul>\n\n<h2>Ecosystem</h2>\n<ul>\n  <li>DeFi integrations</li>\n  <li>Prediction-market integrations</li>\n  <li>Agent-payment integrations</li>\n  <li>DAO and treasury integrations</li>\n  <li>Virtual-card execution rails</li>\n  <li>Additional gaming and automation integrations</li>\n</ul>\n', 'use-cases': '\n<div class="eyebrow">USE CASES</div>\n<h1>One verification model. Many autonomous systems.</h1>\n<p>\n  Phorva is designed to remain horizontal. The action changes, but the core\n  verification model remains: intent → policy → risk → authorization →\n  execution verification → result.\n</p>\n\n<div class="cards">\n  <div class="card"><h3>DeFi</h3><p>Protocol and asset execution verification.</p></div>\n  <div class="card"><h3>Prediction Markets</h3><p>Orders, positions, collateral and settlement actions.</p></div>\n  <div class="card"><h3>Autonomous Trading</h3><p>Strategy and transaction authorization.</p></div>\n  <div class="card"><h3>Agent Payments</h3><p>Programmatic payment verification.</p></div>\n  <div class="card"><h3>Virtual Cards</h3><p>Transaction policy and authorization.</p></div>\n  <div class="card"><h3>Gaming</h3><p>Agent-controlled game and asset actions.</p></div>\n  <div class="card"><h3>Agent Wallets</h3><p>Pre-execution verification for wallet infrastructure.</p></div>\n  <div class="card"><h3>DAOs & Treasuries</h3><p>Institutional execution controls.</p></div>\n  <div class="card"><h3>On-chain Automation</h3><p>Verification for automated blockchain operations.</p></div>\n</div>\n', 'phorva-vs-infrastructure': '\n<div class="eyebrow">OVERVIEW / INFRASTRUCTURE BOUNDARIES</div>\n<h1>Phorva vs. infrastructure</h1>\n\n<div class="architecture vertical">\n  <div>AGENT<br><small>decides what it wants to do</small></div>\n  <span>↓</span>\n  <div>WALLET<br><small>controls / signs execution</small></div>\n  <span>↓</span>\n  <div class="accent">PHORVA<br><small>verifies whether execution is authorized</small></div>\n  <span>↓</span>\n  <div>PROTOCOL<br><small>executes the operation</small></div>\n  <span>↓</span>\n  <div>BLOCKCHAIN<br><small>records execution</small></div>\n</div>\n\n<h2>Provider boundary</h2>\n<p>\n  Providers can supply proving or verification machinery. Phorva defines the\n  verification semantics and integrates that infrastructure into its control\n  plane.\n</p>\n'};

/* PHORVA DOCS — navigator completion pages */

PHORVA_PAGES["what-is-phorva"] = `
<div class="eyebrow">OVERVIEW / WHAT IS PHORVA</div>
<h1>What is Phorva?</h1>
<p>
  Phorva is a verification and control layer between autonomous agents
  and blockchain execution.
</p>

<div class="notice">
  <strong>Core principle</strong>
  <p>
    Phorva verifies whether the execution that is about to occur matches
    the intent, policy and authorization conditions established for the agent.
  </p>
</div>

<h2>What Phorva verifies</h2>
<ul>
  <li>Agent and project context</li>
  <li>Declared intent</li>
  <li>Policy constraints</li>
  <li>Transaction and calldata parameters</li>
  <li>Protocol and contract conditions</li>
  <li>Chain and asset conditions</li>
  <li>Execution graph integrity</li>
  <li>Final execution state where supported</li>
</ul>

<h2>What Phorva produces</h2>
<p>
  A structured verification result containing the authorization decision
  and supporting verification information such as traces, commitments,
  evidence and receipts where applicable.
</p>
`;

PHORVA_PAGES["trust-boundaries"] = `
<div class="eyebrow">OVERVIEW / TRUST BOUNDARIES</div>
<h1>Trust boundaries</h1>
<p>
  Phorva treats information supplied by an agent or caller as input that
  must be evaluated, not as an authoritative authorization fact.
</p>

<div class="architecture">
  <div>AGENT</div><span>→</span>
  <div>CLAIMS</div><span>→</span>
  <div class="accent">PHORVA VERIFICATION</div><span>→</span>
  <div>VERDICT</div><span>→</span>
  <div>EXECUTION</div>
</div>

<h2>Boundary principles</h2>
<ul>
  <li>Caller-provided authorization claims are validated.</li>
  <li>Transaction parameters are independently evaluated.</li>
  <li>Policy decisions are derived from configured controls.</li>
  <li>Execution evidence is evaluated against the authorized conditions.</li>
</ul>
`;

PHORVA_PAGES["evidence"] = `
<div class="eyebrow">VERIFICATION / EVIDENCE</div>
<h1>Evidence</h1>
<p>
  Evidence is the structured information produced to explain and support
  a Phorva verification result.
</p>

<h2>Evidence can include</h2>
<div class="cards">
  <div class="card"><h3>Intent</h3><p>The declared action and constraints.</p></div>
  <div class="card"><h3>Policy</h3><p>The authorization conditions evaluated.</p></div>
  <div class="card"><h3>Execution</h3><p>The transaction and execution data analyzed.</p></div>
  <div class="card"><h3>Trace</h3><p>The verification checks performed.</p></div>
  <div class="card"><h3>Commitment</h3><p>A commitment to the verified statement or result.</p></div>
  <div class="card"><h3>Receipt</h3><p>A structured record of the verification outcome.</p></div>
</div>
`;

PHORVA_PAGES["proof-statements"] = `
<div class="eyebrow">VERIFICATION / PROOF STATEMENTS</div>
<h1>Proof statements</h1>
<p>
  A proof statement describes the conditions Phorva has verified about
  an execution.
</p>

<h2>Statement model</h2>
<pre><code>{
  "version": "phorva-proof-v1",
  "decision": "AUTHORIZED",
  "intent": "...",
  "policy": "...",
  "execution": "...",
  "commitment": "..."
}</code></pre>

<div class="notice">
  <strong>Important</strong>
  <p>
    A proof statement represents a verification claim. The proving machinery
    used to establish or verify that claim can be supplied by external
    infrastructure providers.
  </p>
</div>
`;

PHORVA_PAGES["commitments"] = `
<div class="eyebrow">VERIFICATION / COMMITMENTS</div>
<h1>Commitments</h1>
<p>
  Commitments provide a deterministic cryptographic reference to the
  verified execution statement and associated verification material.
</p>

<h2>Purpose</h2>
<ul>
  <li>Bind evidence to a specific verification result.</li>
  <li>Support auditability.</li>
  <li>Detect changes to committed verification data.</li>
  <li>Provide a stable reference for downstream systems.</li>
</ul>
`;

PHORVA_PAGES["projects"] = `
<div class="eyebrow">DEVELOPER / PROJECTS</div>
<h1>Projects</h1>
<p>
  A project represents an application or integration using Phorva.
  Projects provide the organizational boundary for agents, policies,
  API credentials and verification activity.
</p>

<div class="architecture">
  <div>ORGANIZATION</div><span>→</span>
  <div class="accent">PROJECT</div><span>→</span>
  <div>API KEY</div><span>→</span>
  <div>AGENT</div><span>→</span>
  <div>VERIFICATION</div>
</div>
`;

PHORVA_PAGES["agents"] = `
<div class="eyebrow">DEVELOPER / AGENTS</div>
<h1>Agents</h1>
<p>
  Agent identity connects verification requests to the autonomous system
  responsible for initiating an execution.
</p>

<h2>Agent context</h2>
<ul>
  <li>Project identity</li>
  <li>Agent identity</li>
  <li>Requested action</li>
  <li>Policy context</li>
  <li>Execution context</li>
</ul>
`;

PHORVA_PAGES["examples"] = `
<div class="eyebrow">DEVELOPER / EXAMPLES</div>
<h1>Examples</h1>
<p>
  Examples demonstrate common ways to integrate verification into an
  autonomous execution flow.
</p>

<h2>Basic verification</h2>
<pre><code>const result = await phorva.verify({
  agent: "TradingAgent-01",
  intent: {
    action: "swap",
    amount: "300",
    token: "USDC"
  },
  execution: {
    chain: "baseSepolia",
    protocol: "Uniswap"
  }
});</code></pre>
`;

PHORVA_PAGES["provider-architecture"] = `
<div class="eyebrow">INFRASTRUCTURE / PROVIDER ARCHITECTURE</div>
<h1>Provider architecture</h1>
<p>
  Phorva separates verification semantics from the infrastructure used
  to perform proving or verification operations.
</p>

<div class="architecture">
  <div>PHORVA SEMANTICS</div><span>→</span>
  <div class="accent">PROVIDER ADAPTER</div><span>→</span>
  <div>PROVING / VERIFICATION INFRASTRUCTURE</div>
</div>

<div class="notice">
  <strong>Boundary</strong>
  <p>
    Phorva defines the verification semantics; providers supply the
    proving or verification machinery where required.
  </p>
</div>
`;

PHORVA_PAGES["provers"] = `
<div class="eyebrow">INFRASTRUCTURE / PROVER INFRASTRUCTURE</div>
<h1>Prover infrastructure</h1>
<p>
  Phorva is designed to work with external proving and verification
  infrastructure through provider adapters.
</p>

<h2>Provider responsibilities</h2>
<ul>
  <li>Proof generation where required</li>
  <li>Proof verification where required</li>
  <li>Provider-specific execution</li>
  <li>Provider availability and lifecycle handling</li>
</ul>

<p>
  Phorva does not position itself as a prover network.
</p>
`;

PHORVA_PAGES["adapters"] = `
<div class="eyebrow">INFRASTRUCTURE / EXECUTION ADAPTERS</div>
<h1>Execution adapters</h1>
<p>
  Execution adapters connect Phorva's verification model to specific
  chains, protocols and execution environments.
</p>

<h2>Adapter responsibilities</h2>
<ul>
  <li>Decode protocol-specific execution data.</li>
  <li>Normalize execution into Phorva verification semantics.</li>
  <li>Connect chain and protocol context to verification.</li>
  <li>Preserve provider and protocol independence at the core layer.</li>
</ul>
`;

PHORVA_PAGES["security-trust-boundaries"] = `
<div class="eyebrow">SECURITY / TRUST BOUNDARIES</div>
<h1>Security trust boundaries</h1>
<p>
  Phorva's security model separates untrusted execution claims from
  independently evaluated authorization and verification state.
</p>

<h2>Security boundary</h2>
<div class="cards">
  <div class="card"><h3>Caller</h3><p>Supplies execution claims and context.</p></div>
  <div class="card"><h3>Phorva</h3><p>Validates policy, intent and execution conditions.</p></div>
  <div class="card"><h3>Provider</h3><p>Supplies proving or verification machinery where required.</p></div>
  <div class="card"><h3>Protocol</h3><p>Performs the underlying blockchain operation.</p></div>
</div>
`;

PHORVA_PAGES["security-testing"] = `
<div class="eyebrow">SECURITY / SECURITY TESTING</div>
<h1>Security testing</h1>
<p>
  Phorva's verification engine is developed with adversarial execution
  cases covering authorization, transaction integrity and execution
  verification.
</p>

<h2>Test categories</h2>
<ul>
  <li>Intent mismatch</li>
  <li>Policy limit violations</li>
  <li>Wrong protocol or contract</li>
  <li>Wrong chain</li>
  <li>Unexpected native value</li>
  <li>Token and amount manipulation</li>
  <li>Unlimited approval detection</li>
  <li>Execution graph integrity</li>
  <li>Final-state verification</li>
  <li>Proof and verification integrity</li>
</ul>

<div class="notice">
  <strong>Current engineering checkpoint</strong>
  <p>
    The current development security suite contains 87 passing security
    tests. Production readiness remains dependent on additional
    infrastructure, security review and deployment controls.
  </p>
</div>
`;

PHORVA_PAGES["changelog"] = `
<div class="eyebrow">RESOURCES / CHANGELOG</div>
<h1>Changelog</h1>
<p>
  Phorva's changelog records changes to the verification engine,
  developer platform, documentation and infrastructure.
</p>

<h2>Current development direction</h2>
<ul>
  <li>Verification control plane</li>
  <li>Multi-chain EVM architecture</li>
  <li>Provider abstraction</li>
  <li>Execution graph verification</li>
  <li>Proof statements and receipts</li>
  <li>Developer API and SDK</li>
</ul>
`;

PHORVA_PAGES["status"] = `
<div class="eyebrow">RESOURCES / STATUS</div>
<h1>Phorva status</h1>
<p>
  This page describes the current implementation state of the Phorva
  development platform.
</p>

<div class="cards">
  <div class="card"><h3>Verification Engine</h3><p>Enabled in the current development environment.</p></div>
  <div class="card"><h3>Security Tests</h3><p>87 / 87 passing at the current engineering checkpoint.</p></div>
  <div class="card"><h3>Chains</h3><p>Base Sepolia, Ethereum Sepolia and Arbitrum Sepolia are used in the current test environment.</p></div>
  <div class="card"><h3>Production</h3><p>Production capabilities are being developed and should not be inferred from testnet functionality.</p></div>
</div>
`;



PHORVA_PAGES["trading"] = `
<div class="eyebrow">USE CASES / TRADING</div>
<h1>Autonomous trading</h1>
<p>Trading agents execute swaps, routes, and multi-step strategies. Phorva verifies that what actually runs matches declared intent and policy.</p>
<div class="notice"><strong>Boundary</strong><p>Strategy stays with the agent. Phorva does not choose trades — it verifies authorization of the resulting execution.</p></div>
<h2>What Phorva verifies</h2>
<div class="cards">
  <div class="card"><h3>Trade size</h3><p>Amount within max trade and exposure limits.</p></div>
  <div class="card"><h3>Assets</h3><p>Only allowed tokens.</p></div>
  <div class="card"><h3>Venues</h3><p>Only allowlisted protocols and contracts.</p></div>
  <div class="card"><h3>Intent match</h3><p>Calldata matches declared trade intent.</p></div>
  <div class="card"><h3>Slippage</h3><p>Within configured bounds where supplied.</p></div>
  <div class="card"><h3>Multi-step paths</h3><p>Approve → swap → settle verified as a graph.</p></div>
</div>
<h2>Typical controls</h2>
<ul>
  <li>Maximum trade size</li>
  <li>Daily or rolling exposure limits</li>
  <li>Token allowlists / denylists</li>
  <li>Protocol and contract allowlists</li>
  <li>Slippage constraints</li>
  <li>Chain restrictions</li>
</ul>
<h2>Example intent</h2>
<pre><code>{
  "type": "swap",
  "tokenIn": "USDC",
  "tokenOut": "ETH",
  "amount": "300",
  "protocol": "Uniswap",
  "chain": "baseSepolia"
}</code></pre>
<div class="notice"><strong>Status</strong><p>Supported in current development/testnet for swap-style and multi-step patterns. Production depends on the infrastructure roadmap.</p></div>
`;

PHORVA_PAGES["autonomous-trading"] = PHORVA_PAGES["trading"];


PHORVA_PAGES["prediction-markets"] = `
<div class="eyebrow">USE CASES / PREDICTION MARKETS</div>
<h1>Prediction markets</h1>
<p>Agents can trade outcome shares, provide liquidity, and manage positions. Phorva verifies those actions against intent and policy.</p>
<div class="notice"><strong>Boundary</strong><p>Market strategy stays with the agent. Phorva verifies whether the market action is authorized.</p></div>
<h2>What Phorva verifies</h2>
<div class="cards">
  <div class="card"><h3>Position size</h3><p>Amounts within configured limits.</p></div>
  <div class="card"><h3>Market scope</h3><p>Only allowed markets/contracts.</p></div>
  <div class="card"><h3>Action type</h3><p>Trade, mint, redeem, or LP matches intent.</p></div>
  <div class="card"><h3>Collateral path</h3><p>Collateral and outcome tokens match authorization.</p></div>
</div>
<ul>
  <li>Max notional per trade</li>
  <li>Per-market exposure limits</li>
  <li>Allowed market/contract lists</li>
  <li>Allowed collateral assets</li>
  <li>Chain restrictions</li>
</ul>
<pre><code>{
  "type": "prediction_trade",
  "market": "election-2026",
  "side": "yes",
  "amount": "100",
  "collateral": "USDC",
  "chain": "baseSepolia"
}</code></pre>
`;

PHORVA_PAGES["agent-payments"] = `
<div class="eyebrow">USE CASES / AGENT PAYMENTS</div>
<h1>Agent payments</h1>
<p>Machine-to-machine payments need hard limits. Phorva verifies that payment execution matches the agent’s authorized payment intent and policy.</p>
<div class="notice"><strong>Boundary</strong><p>Phorva is not a payment rail or wallet. It verifies whether a payment action is authorized.</p></div>
<div class="cards">
  <div class="card"><h3>Amount</h3><p>Payment within max and period limits.</p></div>
  <div class="card"><h3>Recipient</h3><p>Destination matches allowlist where required.</p></div>
  <div class="card"><h3>Asset</h3><p>Only permitted tokens.</p></div>
  <div class="card"><h3>Intent match</h3><p>Actual transfer matches declared payment intent.</p></div>
</div>
<ul>
  <li>Per-payment maximum</li>
  <li>Daily/monthly spend caps</li>
  <li>Recipient allowlists</li>
  <li>Token allowlists</li>
  <li>Chain restrictions</li>
</ul>
<pre><code>{
  "type": "transfer",
  "token": "USDC",
  "amount": "50",
  "recipient": "0x...",
  "chain": "baseSepolia"
}</code></pre>
`;

PHORVA_PAGES["daos-treasuries"] = `
<div class="eyebrow">USE CASES / DAOS & TREASURIES</div>
<h1>DAOs & treasuries</h1>
<p>Treasury agents can move capital under governance constraints. Phorva verifies that treasury execution matches authorized intent and policy.</p>
<div class="notice"><strong>Boundary</strong><p>Governance remains with the DAO. Phorva verifies whether a treasury action is consistent with declared authorization conditions.</p></div>
<div class="cards">
  <div class="card"><h3>Amount</h3><p>Within treasury spending limits.</p></div>
  <div class="card"><h3>Destination</h3><p>Recipient/protocol matches policy.</p></div>
  <div class="card"><h3>Action type</h3><p>Transfer, swap, or allocation matches intent.</p></div>
  <div class="card"><h3>Multi-step paths</h3><p>Complex treasury routes verified as a graph.</p></div>
</div>
<ul>
  <li>Max transfer size</li>
  <li>Recipient allowlists</li>
  <li>Protocol allowlists</li>
  <li>Role/agent-scoped limits</li>
</ul>
`;

PHORVA_PAGES["onchain-automation"] = `
<div class="eyebrow">USE CASES / ON-CHAIN AUTOMATION</div>
<h1>On-chain automation</h1>
<p>Automation agents trigger recurring or conditional on-chain actions. Phorva verifies each execution attempt against intent and policy.</p>
<div class="notice"><strong>Boundary</strong><p>Schedulers and keepers still trigger work. Phorva verifies whether each triggered execution is authorized.</p></div>
<div class="cards">
  <div class="card"><h3>Action scope</h3><p>Only allowed automated action types.</p></div>
  <div class="card"><h3>Size limits</h3><p>Within configured operational limits.</p></div>
  <div class="card"><h3>Targets</h3><p>Only allowlisted contracts/protocols.</p></div>
  <div class="card"><h3>Intent match</h3><p>Each run matches the authorized automation intent.</p></div>
</div>
<ul>
  <li>Allowed action types</li>
  <li>Per-run amount limits</li>
  <li>Contract allowlists</li>
  <li>Chain restrictions</li>
</ul>
`;

PHORVA_PAGES["virtual-cards"] = `
<div class="eyebrow">USE CASES / VIRTUAL CARDS</div>
<h1>Virtual cards</h1>
<p>Virtual cards can be a future execution rail for agent spend. Phorva’s role remains verification — not card issuance.</p>
<div class="notice"><strong>Boundary</strong><p>Phorva is not a card issuer. If card rails are connected later, Phorva verifies whether the spend action matches intent and policy.</p></div>
<div class="cards">
  <div class="card"><h3>Spend amount</h3><p>Within configured caps.</p></div>
  <div class="card"><h3>Merchant / category</h3><p>Where policy provides restrictions.</p></div>
  <div class="card"><h3>Agent scope</h3><p>Spend attributed to the correct agent policy.</p></div>
  <div class="card"><h3>Evidence</h3><p>Verification record for auditability.</p></div>
</div>
<div class="notice"><strong>Status</strong><p>Virtual Card is on the longer-term roadmap. It is not a current Phorva product.</p></div>
`;


PHORVA_PAGES["verification-model"]=`<div class="eyebrow">VERIFICATION MODEL</div><h1>Onchain Verification Model</h1><p>Phorva verifies authority, conditions, objectives, execution, final state and evidence.</p><div class="architecture vertical"><div>AUTHORITY</div><span>↓</span><div>CONDITIONS</div><span>↓</span><div>OBJECTIVE</div><span>↓</span><div>AUTHORIZATION</div><span>↓</span><div>EXECUTION</div><span>↓</span><div>FINAL STATE</div><span>↓</span><div class="accent">EVIDENCE</div></div>`;

PHORVA_PAGES["conditional-authorization"]=`<div class="eyebrow">VERIFICATION MODEL</div><h1>Conditional Authorization</h1><p>Authorization depends on identity, intent, policy, risk and execution conditions.</p>`;

PHORVA_PAGES["state-transition"]=`<div class="eyebrow">VERIFICATION MODEL</div><h1>State-Transition Verification</h1><p>Phorva verifies the transition from the expected pre-state through execution to the resulting post-state.</p>`;

PHORVA_PAGES["objective-verification"]=`<div class="eyebrow">VERIFICATION MODEL</div><h1>Objective Verification</h1><p>Phorva compares the intended objective with the actual execution outcome.</p>`;

PHORVA_PAGES["evidence-graph"]=`<div class="eyebrow">VERIFICATION MODEL</div><h1>Evidence Graph</h1><p>Identity, intent, policy, transaction and outcome evidence are connected to the verification decision.</p>`;


PHORVA_PAGES["security-invariants"]=`<div class="eyebrow">SECURITY PRIMITIVES</div><h1>Security Invariants</h1><p>Phorva enforces security properties that should remain true across applications, protocols and execution rails.</p>`;

PHORVA_PAGES["dependency-aware"]=`<div class="eyebrow">SECURITY PRIMITIVES</div><h1>Dependency-Aware Authorization</h1><p>Phorva can evaluate dependencies such as protocols, oracles, bridges, tokens and other components that affect execution security.</p>`;

PHORVA_PAGES["semantic-drift"]=`<div class="eyebrow">SECURITY PRIMITIVES</div><h1>Semantic &amp; Policy Drift</h1><p>Phorva detects changes in application execution surfaces and policy assumptions without silently widening authority.</p>`;

PHORVA_PAGES["uncertainty"]=`<div class="eyebrow">SECURITY PRIMITIVES</div><h1>Uncertainty &amp; Verification States</h1><p>Phorva distinguishes verified, blocked, review-required and unknown states instead of treating uncertainty as approval.</p>`;


PHORVA_PAGES["products"] = `
<div class="eyebrow">PHORVA / PRODUCTS</div>
<h1>Phorva Product Ecosystem</h1>

<p>
Phorva is building an execution-security ecosystem for autonomous and
AI-driven on-chain activity. The products share the same verification
semantics while serving different layers of the stack.
</p>

<div class="cards">
  <div class="card">
    <h3>Phorva Core</h3>
    <p>
      Verification and authorization infrastructure for autonomous
      economic execution.
    </p>
  </div>

  <div class="card">
    <h3>Phorva OnchainAI</h3>
    <p>
      A consumer AI application for interacting with crypto applications
      through natural language.
    </p>
  </div>

  <div class="card">
    <h3>Phorva SDK / API</h3>
    <p>
      Developer interfaces for integrating Phorva verification into
      applications, agents, wallets and protocols.
    </p>
  </div>

  <div class="card">
    <h3>Phorva MCP</h3>
    <p>
      A standardized tool interface through which AI systems can invoke
      Phorva verification capabilities.
    </p>
  </div>

  <div class="card">
    <h3>Developer Console</h3>
    <p>
      Projects, credentials, agents, policies, verification logs,
      usage and integration management.
    </p>
  </div>
</div>

<h2>Product architecture</h2>

<div class="architecture">
  <div>ONCHAIN AI</div>
  <span>→</span>
  <div>CRYPTO APPS</div>
  <span>→</span>
  <div class="accent">PHORVA CORE</div>
  <span>→</span>
  <div>WALLET / SIGNER</div>
  <span>→</span>
  <div>BLOCKCHAIN</div>
</div>

<h2>The separation</h2>

<p>
The AI interface owns the user experience. Crypto applications provide
execution capabilities. Wallets and signers execute transactions.
Phorva independently determines whether an action is authorized and
whether execution matches the authorized intent.
</p>

<div class="notice">
  <strong>Core boundary</strong>
  <p>
    Phorva is not a wallet, exchange, protocol, AI agent, blockchain,
    prover marketplace or execution environment.
  </p>
</div>
`;

PHORVA_PAGES["onchain-ai"] = `
<div class="eyebrow">PHORVA / ONCHAIN AI</div>
<h1>Phorva OnchainAI</h1>

<p>
Phorva OnchainAI is a consumer AI application designed around one
interface for interacting with many on-chain applications.
</p>

<p>
Its model is similar to a general AI assistant, except the connected
application ecosystem is crypto-native.
</p>

<h2>What users experience</h2>

<div class="architecture">
  <div>USER</div>
  <span>→</span>
  <div class="accent">ONCHAIN AI</div>
  <span>→</span>
  <div>CRYPTO APP</div>
  <span>→</span>
  <div>PHORVA</div>
  <span>→</span>
  <div>EXECUTION</div>
</div>

<p>Examples:</p>

<ul>
  <li>@uniswap swap $1,000 USDC for ETH</li>
  <li>@polymarket buy $500 YES</li>
  <li>@aave deposit $5,000 USDC</li>
  <li>@metamask send $200 to an address</li>
  <li>@opensea mint this NFT</li>
</ul>

<h2>Technical architecture</h2>

<p>
OnchainAI is an orchestration layer. It does not become the security
boundary and does not directly decide whether an action may execute.
</p>

<div class="cards">
  <div class="card">
    <h3>1. Natural-language request</h3>
    <p>
      The user describes an intended on-chain action using normal language.
    </p>
  </div>

  <div class="card">
    <h3>2. Intent extraction</h3>
    <p>
      The AI converts the request into structured action semantics such as
      protocol, action, assets, amount, market, recipient and chain.
    </p>
  </div>

  <div class="card">
    <h3>3. Capability discovery</h3>
    <p>
      OnchainAI identifies the appropriate connected application and
      selects the capability required to fulfill the request.
    </p>
  </div>

  <div class="card">
    <h3>4. Action construction</h3>
    <p>
      The selected application produces a quote, API request,
      transaction or other execution payload.
    </p>
  </div>

  <div class="card">
    <h3>5. Phorva verification</h3>
    <p>
      Phorva independently evaluates identity, intent, capability,
      policy, risk, transaction parameters and authorization.
    </p>
  </div>

  <div class="card">
    <h3>6. Authorization</h3>
    <p>
      Phorva returns an authorization decision. The AI cannot override
      a BLOCK decision.
    </p>
  </div>

  <div class="card">
    <h3>7. Execution</h3>
    <p>
      If authorized, the existing wallet, signer, protocol or execution
      system performs the action.
    </p>
  </div>

  <div class="card">
    <h3>8. Execution verification</h3>
    <p>
      Phorva compares the resulting execution against the authorized
      action and verifies the resulting state.
    </p>
  </div>
</div>

<h2>Security boundary</h2>

<div class="architecture">
  <div>AI PROPOSES</div>
  <span>→</span>
  <div class="accent">PHORVA DECIDES</div>
  <span>→</span>
  <div>WALLET EXECUTES</div>
  <span>→</span>
  <div>PHORVA VERIFIES</div>
</div>

<h2>Example: protected swap</h2>

<p>
A user requests:
</p>

<div class="notice">
  <strong>@uniswap swap $1,000 USDC for ETH</strong>
</div>

<p>
OnchainAI constructs the intended action and asks the Uniswap integration
to construct the corresponding execution.
</p>

<p>
Phorva then independently checks:
</p>

<ul>
  <li>Agent or application identity</li>
  <li>Declared intent</li>
  <li>Allowed protocol</li>
  <li>Allowed chain</li>
  <li>Requested amount</li>
  <li>Actual transaction amount</li>
  <li>Contract and function</li>
  <li>Transaction parameters</li>
  <li>Policy limits</li>
  <li>Risk conditions</li>
</ul>

<p>
If the intended amount is $1,000 but the actual transaction attempts
$5,000 and the policy maximum is $2,000, Phorva returns:
</p>

<div class="notice">
  <strong>BLOCKED</strong>
  <p>
    Transaction exceeds the authorized amount and policy maximum.
  </p>
</div>

<h2>Why the AI is not the security boundary</h2>

<p>
The AI can be highly capable without being trusted to authorize its own
actions. Its responsibility is to understand the user's request and
construct an execution plan.
</p>

<p>
Phorva independently evaluates that proposed execution against
authorization semantics and policy.
</p>

<h2>Multi-application workflows</h2>

<p>
OnchainAI can eventually coordinate multiple applications in one
conversation.
</p>

<div class="architecture">
  <div>UNISWAP</div>
  <span>→</span>
  <div>PHORVA</div>
  <span>→</span>
  <div>AAVE</div>
  <span>→</span>
  <div>PHORVA</div>
  <span>→</span>
  <div>FINAL STATE</div>
</div>

<p>
For example:
</p>

<div class="notice">
  <strong>
    Swap $1,000 USDC for ETH, then deposit the ETH into Aave.
  </strong>
</div>

<p>
The AI can construct the multi-step plan, while Phorva evaluates the
individual actions and, where supported, the relationships between them
and the expected final state.
</p>

<h2>MCP integration</h2>

<p>
MCP provides a standardized interface through which AI systems can call
Phorva verification capabilities. MCP is an integration mechanism, not
the security mechanism itself.
</p>

<div class="architecture">
  <div>AI</div>
  <span>→</span>
  <div>MCP</div>
  <span>→</span>
  <div class="accent">PHORVA CORE</div>
  <span>→</span>
  <div>ALLOW / BLOCK</div>
</div>

<h2>Core principle</h2>

<div class="notice">
  <strong>
    AI decides what it wants to do.
    Phorva decides whether it is allowed to happen.
  </strong>
</div>
`;

const PHORVA_ROUTES = {
  '/docs/products': 'products',
  '/docs/products/onchain-ai': 'onchain-ai',

  '/docs/verification-model':'verification-model',
  '/docs/verification/conditional-authorization':'conditional-authorization',
  '/docs/verification/state-transition':'state-transition',
  '/docs/verification/objective':'objective-verification',
  '/docs/verification/evidence-graph':'evidence-graph',
  '/docs/security/invariants':'security-invariants',
  '/docs/security/dependency-aware':'dependency-aware',
  '/docs/security/semantic-drift':'semantic-drift',
  '/docs/security/uncertainty':'uncertainty',


  '/docs/what-is-phorva': 'what-is-phorva',
  '/docs/trust-boundaries': 'trust-boundaries',
  '/docs/verification/evidence': 'evidence',
  '/docs/verification/proof-statements': 'proof-statements',
  '/docs/verification/commitments': 'commitments',
  '/docs/use-cases/trading': 'trading',
  '/docs/developer/projects': 'projects',
  '/docs/developer/agents': 'agents',
  '/docs/developer/examples': 'examples',
  '/docs/infrastructure/provider-architecture': 'provider-architecture',
  '/docs/infrastructure/provers': 'provers',
  '/docs/infrastructure/adapters': 'adapters',
  '/docs/security/trust-boundaries': 'security-trust-boundaries',
  '/docs/security/testing': 'security-testing',
  '/docs/changelog': 'changelog',
  '/docs/status': 'status',
'/docs': 'introduction', '/docs/': 'introduction', '/docs/introduction': 'introduction', '/docs/architecture': 'architecture', '/docs/core-concepts': 'core-concepts', '/docs/what-is': 'what-is', '/docs/phorva-vs-infrastructure': 'phorva-vs-infrastructure', '/docs/quickstart': 'quickstart', '/docs/sdk': 'sdk', '/docs/api': 'api', '/docs/authentication': 'authentication', '/docs/connect': 'connect', '/docs/verification/intent': 'intent', '/docs/verification/policy': 'policy', '/docs/verification/risk': 'risk', '/docs/verification/authorization': 'authorization', '/docs/verification/transaction': 'transaction', '/docs/verification/transaction-analysis': 'transaction-analysis', '/docs/verification/execution-graph': 'execution-graph', '/docs/verification/final-state': 'final-state', '/docs/verification/trace': 'trace', '/docs/verification/proof': 'proof', '/docs/verification/commitment': 'commitment', '/docs/verification/receipts': 'receipts', '/docs/verification/semantics': 'verification-semantics', '/docs/verification/security-model': 'security-model', '/docs/verification/failure-states': 'failure-states', '/docs/actions/transfers': 'transfers', '/docs/actions/approvals': 'approvals', '/docs/actions/swaps': 'swaps', '/docs/actions/withdrawals': 'withdrawals', '/docs/actions/defi': 'defi', '/docs/actions/bridges': 'bridges', '/docs/actions/custom-calls': 'custom-calls', '/docs/actions/multi-step': 'multi-step', '/docs/use-cases': 'use-cases', '/docs/use-cases/defi': 'defi', '/docs/use-cases/prediction-markets': 'prediction-markets', '/docs/use-cases/autonomous-trading': 'autonomous-trading', '/docs/use-cases/agent-payments': 'agent-payments', '/docs/use-cases/virtual-cards': 'virtual-cards', '/docs/use-cases/gaming': 'gaming', '/docs/use-cases/agent-wallets': 'agent-wallets', '/docs/use-cases/daos-treasuries': 'daos-treasuries', '/docs/use-cases/onchain-automation': 'onchain-automation', '/docs/infrastructure/chains': 'chains', '/docs/infrastructure/protocols': 'protocols', '/docs/infrastructure/providers': 'providers', '/docs/infrastructure/security': 'infrastructure-security', '/docs/developer/sdk': 'sdk', '/docs/developer/api': 'api-reference', '/docs/developer/api-keys': 'api-keys', '/docs/developer/integration': 'integration', '/docs/developer/errors': 'errors', '/docs/security/threat-model': 'threat-model', '/docs/security/architecture': 'security-architecture', '/docs/security/verification-integrity': 'verification-integrity', '/docs/security/auditability': 'auditability', '/docs/roadmap': 'roadmap'};
const PHORVA_NAV = [

  ['PRODUCTS', [
    ['Product Ecosystem', '/docs/products'],
    ['Phorva OnchainAI', '/docs/products/onchain-ai']
  ]],

  ['OVERVIEW', [
    ['Introduction', '/docs'],
    ['What is Phorva', '/docs/what-is-phorva'],
    ["What Phorva Is / Isn't", '/docs/what-is'],
    ['Architecture', '/docs/architecture'],
    ['Core Concepts', '/docs/core-concepts'],
    ['Trust Boundaries', '/docs/trust-boundaries']
  ]],

  ['VERIFICATION', [
    ['Intent', '/docs/verification/intent'],
    ['Policy', '/docs/verification/policy'],
    ['Risk', '/docs/verification/risk'],
    ['Authorization', '/docs/verification/authorization'],
    ['Transaction Verification', '/docs/verification/transaction'],
    ['Execution Graph', '/docs/verification/execution-graph'],
    ['Final-State Verification', '/docs/verification/final-state'],
    ['Verification Trace', '/docs/verification/trace'],
    ['Evidence', '/docs/verification/evidence'],
    ['Proof Statements', '/docs/verification/proof-statements'],
    ['Commitments', '/docs/verification/commitments'],
    ['Verification Receipts', '/docs/verification/receipts']
  ]],

  ['ACTIONS', [
    ['Transfers', '/docs/actions/transfers'],
    ['Approvals', '/docs/actions/approvals'],
    ['Swaps', '/docs/actions/swaps'],
    ['DeFi', '/docs/actions/defi'],
    ['Bridges', '/docs/actions/bridges'],
    ['Custom Contract Calls', '/docs/actions/custom-calls'],
    ['Multi-Step Execution', '/docs/actions/multi-step']
  ]],

  ['USE CASES', [
    ['DeFi', '/docs/use-cases/defi'],
    ['Trading', '/docs/use-cases/trading'],
    ['Prediction Markets', '/docs/use-cases/prediction-markets'],
    ['Agent Payments', '/docs/use-cases/agent-payments'],
    ['Gaming', '/docs/use-cases/gaming'],
    ['Agent Wallets', '/docs/use-cases/agent-wallets'],
    ['DAOs & Treasuries', '/docs/use-cases/daos-treasuries'],
    ['On-chain Automation', '/docs/use-cases/onchain-automation']
  ]],

  ['DEVELOPER', [
    ['Quickstart', '/docs/quickstart'],
    ['API', '/docs/developer/api'],
    ['SDK', '/docs/developer/sdk'],
    ['Authentication', '/docs/authentication'],
    ['API Keys', '/docs/developer/api-keys'],
    ['Projects', '/docs/developer/projects'],
    ['Agents', '/docs/developer/agents'],
    ['Integration Guide', '/docs/developer/integration'],
    ['Error Handling', '/docs/developer/errors'],
    ['Examples', '/docs/developer/examples']
  ]],

  ['INFRASTRUCTURE', [
    ['Chains', '/docs/infrastructure/chains'],
    ['Protocol Integrations', '/docs/infrastructure/protocols'],
    ['Provider Architecture', '/docs/infrastructure/provider-architecture'],
    ['Prover Infrastructure', '/docs/infrastructure/provers'],
    ['Execution Adapters', '/docs/infrastructure/adapters']
  ]],

  ['SECURITY', [
    ['Threat Model', '/docs/security/threat-model'],
    ['Security Architecture', '/docs/security/architecture'],
    ['Verification Integrity', '/docs/security/verification-integrity'],
    ['Trust Boundaries', '/docs/security/trust-boundaries'],
    ['Auditability', '/docs/security/auditability'],
    ['Security Testing', '/docs/security/testing']
  ]],

  ['RESOURCES', [
    ['Architecture', '/docs/architecture'],
    ['Roadmap', '/docs/roadmap'],
    ['Changelog', '/docs/changelog'],
    ['Status', '/docs/status']
  ]]
];


function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/docs";
}

function renderNav() {
  const navRoot = document.getElementById("docs-nav");
  if (!navRoot) return;

  navRoot.innerHTML = PHORVA_NAV.map(([group, items]) => `
    <div class="nav-group">
      <div class="nav-group-title">${group}</div>
      ${items.map(([label, href]) => `
        <a href="${href}" class="nav-link" data-doc-link="${href}">
          <span>${label}</span>
        </a>
      `).join("")}
    </div>
  `).join("");
}


function renderPage(path) {
  const root = document.getElementById("docs-content");
  if (!root) return;

  const orderedIds = [];
  const addPage = id => {
    if (id && Object.prototype.hasOwnProperty.call(PHORVA_PAGES, id)
        && !orderedIds.includes(id)) {
      orderedIds.push(id);
    }
  };

  // Preserve the intended order of topics in the existing documentation.
  PHORVA_NAV.forEach(([, items]) => {
    items.forEach(([, href]) => addPage(PHORVA_ROUTES[href]));
  });

  // Include every additional documentation page as well.
  Object.keys(PHORVA_PAGES).forEach(addPage);

  root.innerHTML = orderedIds.map(id => {
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `<section class="docs-section" id="doc-${safeId}">
      ${PHORVA_PAGES[id]}
    </section>`;
  }).join("");

  document.title = "Phorva Documentation";
}

function openSidebar() {
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  document.body.classList.remove("sidebar-open");
}

function setupSearch() {
  const input = document.getElementById("docs-search");
  if (!input) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    document.querySelectorAll(".nav-link").forEach(link => {
      const visible = !query ||
        link.textContent.toLowerCase().includes(query);

      link.style.display = visible ? "" : "none";
    });
  });
}

function setup() {
  renderNav();
  renderPage(currentPath());
  setupSearch();

  const navRoot = document.getElementById("docs-nav");
  navRoot?.addEventListener("click", event => {
    const link = event.target.closest("a[data-doc-link]");
    if (!link || !navRoot.contains(link)) return;

    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/docs")) return;

    event.preventDefault();
    if (currentPath() !== href) {
      window.history.pushState({}, "", href);
    }
    renderPage(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeSidebar();
  });

  document.getElementById("docs-menu")?.addEventListener("click", openSidebar);
  document.getElementById("docs-close")?.addEventListener("click", closeSidebar);

  const themeButton = document.getElementById("docs-theme");

  function applyDocsTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("phorva-docs-theme", next);
    if (themeButton) {
      themeButton.setAttribute("aria-pressed", String(next === "light"));
      themeButton.textContent = next === "light" ? "Dark theme" : "Light theme";
    }
  }

  applyDocsTheme(
    localStorage.getItem("phorva-docs-theme") ||
    document.documentElement.getAttribute("data-theme") ||
    "dark"
  );

  themeButton?.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    applyDocsTheme(current === "dark" ? "light" : "dark");
  });

  window.addEventListener("popstate", () => {
    renderPage(currentPath());
  });

  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      document.getElementById("docs-search")?.focus();
    }

    if (event.key === "Escape") {
      closeSidebar();
    }
  });
}

const savedTheme = localStorage.getItem("phorva-docs-theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

document.addEventListener("DOMContentLoaded", setup);

/* ============================================================
   PHORVA — AUTONOMOUS EXECUTION SECURITY
   NEW DOCUMENTATION OVERRIDE
   ============================================================ */

PHORVA_PAGES["threat-model"] = `
<div class="eyebrow">SECURITY / AUTONOMOUS EXECUTION</div>

<h1>The Autonomous-Agent Threat Model</h1>

<p>
Phorva is the verification and authorization layer for autonomous agents
executing in the real world. The security boundary cannot exist only inside
the model because agents can be manipulated through prompts, tools, memory,
APIs, delegated agents and external systems.
</p>

<div class="notice">
<strong>CORE PRINCIPLE</strong>
<p>
An agent may propose anything. Phorva determines what it is authorized
to execute.
</p>
</div>

<div class="architecture vertical">

<div>
UNTRUSTED WORLD
<br>
<small>web · X · email · documents · APIs</small>
</div>

<span>↓</span>

<div>
AGENT
<br>
<small>reasoning · planning · memory</small>
</div>

<span>↓</span>

<div class="accent">
PHORVA CONTROL PLANE
<br>
<small>
identity · intent · capability · policy · risk
</small>
</div>

<span>↓</span>

<div>
WALLET / SIGNER / API
<br>
<small>protected execution boundary</small>
</div>

<span>↓</span>

<div>
BLOCKCHAIN / WORLD
<br>
<small>irreversible effects</small>
</div>

</div>


<h2>01 · Agent Identity & Privilege</h2>

<p>
Phorva treats agent identity as more than a wallet address.
An agent's authorization context can include ownership, wallets,
chains, protocols, capabilities and policy scope.
</p>

<pre><code>Agent Identity
├── agent ID
├── project / owner
├── wallet(s)
├── permitted chains
├── permitted protocols
├── permitted actions
├── spending limits
├── policy version
└── authorization scope</code></pre>


<h2>02 · Goal Hijacking / Prompt Injection</h2>

<p>
Phorva does not need to become a prompt-injection filter.
Instead, the execution boundary assumes that an agent can be manipulated
and independently verifies the resulting action.
</p>

<pre><code>DECLARED INTENT

Swap $300 USDC → ETH


ACTUAL TRANSACTION

Transfer $15,000 USDC
→ unknown recipient


PHORVA

Intent mismatch
Destination violation

VERDICT: BLOCK</code></pre>


<h2>03 · Tool Misuse & Excessive Agency</h2>

<p>
Agents should not automatically receive unrestricted execution capabilities.
Phorva can associate tools and actions with explicit capability policies.
</p>

<div class="cards">

<div class="card">
<h3>ALLOWED</h3>
<p>swap<br>quote<br>balance</p>
</div>

<div class="card">
<h3>RESTRICTED</h3>
<p>bridge<br>approve</p>
</div>

<div class="card">
<h3>FORBIDDEN</h3>
<p>
arbitrary contract call<br>
wallet ownership change<br>
raw calldata execution
</p>
</div>

</div>


<h2>04 · Supply Chain & Tool Security</h2>

<p>
An autonomous execution path may contain MCP servers, APIs, plugins,
external tools or other agents. A compromised dependency can therefore
become an execution risk.
</p>

<pre><code>AGENT
  ↓
MCP / TOOL
  ↓
API
  ↓
PROTOCOL
  ↓
EXECUTION</code></pre>

<p>
A future Phorva capability registry can associate sensitive capabilities
with tool identity, permissions, version, integrity or attestation.
</p>


<h2>05 · Memory & Context Poisoning</h2>

<pre><code>AGENT MEMORY

"Preferred treasury address:
0xATTACKER"


PHORVA TRUSTED STATE

Approved recipient:
0xABC...

Policy:
v17

Maximum:
$5,000


Agent memory can suggest.

Phorva policy decides.</code></pre>


<h2>06 · Insecure Agent-to-Agent Communication</h2>

<p>
Natural-language communication between autonomous agents should not
automatically become authorization.
</p>

<pre><code>Agent A
   ↓
Signed Intent
   ↓
Agent B
   ↓
Phorva Verification
   ↓
Execution</code></pre>

<p>
Sensitive delegated execution can include identity, authorization scope,
expiration and nonce.
</p>


<h2>07 · Cascading Failures & Blast Radius</h2>

<pre><code>Agent A
   ↓
Agent B
   ↓
Agent C
   ↓
Payment Agent
   ↓
Multiple executions</code></pre>

<p>
Delegation must not automatically expand the original authorization envelope.
</p>

<pre><code>ORIGINAL AUTHORIZATION

$500 / transaction
$2,000 / day
10 executions / hour
approved counterparties only


Agent A → Agent B → Agent C

Authorization does not expand.</code></pre>


<h2>08 · Execution Risk Classification</h2>

<p>
Not every operation has the same consequence. Phorva can classify execution
according to the effect it can create.
</p>

<pre><code>READ
  ↓
SIMULATE
  ↓
WRITE
  ↓
FINANCIAL
  ↓
IRREVERSIBLE</code></pre>

<p>
Higher-impact operations can require stronger authorization.
</p>


<h2>09 · Human-Agent Trust Exploitation</h2>

<p>
Instead of asking humans to trust an agent's explanation, Phorva can expose
deterministic verification evidence.
</p>

<pre><code>DECLARED INTENT

Swap 300 USDC → ETH


ACTUAL TRANSACTION

Swap 4,000 USDC → ETH


VERDICT

BLOCK — INTENT MISMATCH

Amount deviation: +1,233%</code></pre>


<h2>10 · Rogue-Agent Behavior</h2>

<p>
Phorva does not need to determine whether an AI is philosophically "rogue."
It can detect execution behavior outside the agent's authorization envelope.
</p>

<pre><code>NORMAL

$50–$500
Base
Uniswap
3 transactions/day


OBSERVED

$15,000
Unknown contract
New chain
27 transactions


PHORVA

Behavioral deviation
        ↓
HIGH RISK
        ↓
QUARANTINE
        ↓
BLOCK</code></pre>


<h2>11 · Key Compromise</h2>

<p>
Key compromise is a separate security class. Phorva can reduce the blast
radius when protected execution is required to pass through the Phorva
authorization boundary.
</p>

<div class="notice">
<strong>IMPORTANT SECURITY BOUNDARY</strong>
<p>
If an attacker independently obtains a raw private key and bypasses the
Phorva-controlled execution path, Phorva cannot stop that external signing
operation.
</p>
</div>

<pre><code>NORMAL
   ↓
ANOMALY
   ↓
RISK THRESHOLD
   ↓
QUARANTINE
   ↓
BLOCK NEW PROTECTED EXECUTIONS
   ↓
INDEPENDENT REVIEW</code></pre>


<h2>12 · Approval & Allowance Abuse</h2>

<p>
Transaction value alone is not enough to determine risk.
Some transactions grant future authority over assets.
</p>

<pre><code>approve(
    maliciousSpender,
    unlimited
)


Immediate transfer value:
$0


Potential future authority:
VERY LARGE


PHORVA → HIGH RISK / BLOCK</code></pre>

<p>
Sensitive operations include:
</p>

<pre><code>approve
permit
setApprovalForAll
increaseAllowance
delegate
setOperator</code></pre>


<h2>13 · Bridge Security</h2>

<p>
Cross-chain actions must be evaluated as complete execution paths rather
than isolated transactions.
</p>

<pre><code>SOURCE CHAIN
      ↓
BRIDGE PROTOCOL
      ↓
TOKEN MAPPING
      ↓
DESTINATION CHAIN
      ↓
DESTINATION CONTRACT
      ↓
FINAL RECIPIENT
      ↓
MESSAGE / SLIPPAGE
</code></pre>


<h2>14 · Agent-to-Agent Payment Security</h2>

<p>
Autonomous payments require more than checking an amount.
Phorva can bind the payment to the complete authorization context.
</p>

<pre><code>Payment Intent
      +
Counterparty Identity
      +
Amount
      +
Destination
      +
Service
      +
Expiration
      +
Nonce
      ↓
PHORVA AUTHORIZATION</code></pre>


<h2>THE PHORVA SECURITY MODEL</h2>

<div class="cards">

<div class="card">
<h3>01 · AGENT IDENTITY</h3>
<p>
Identity, ownership, wallets, capabilities and authorization scope.
</p>
</div>

<div class="card">
<h3>02 · INTENT + POLICY</h3>
<p>
Declared intent, project policy and agent-specific restrictions.
</p>
</div>

<div class="card">
<h3>03 · TOOL VERIFICATION</h3>
<p>
MCP, tools, APIs and delegated-agent capabilities.
</p>
</div>

<div class="card">
<h3>04 · EXECUTION RISK</h3>
<p>
Contracts, functions, parameters, destinations, approvals,
velocity and behavioral deviation.
</p>
</div>

<div class="card">
<h3>05 · QUARANTINE</h3>
<p>
Blast-radius controls, anomaly response and protected execution shutdown.
</p>
</div>

</div>


<h2>THE EXECUTION SECURITY LOOP</h2>

<pre><code>
AGENT
  ↓
IDENTITY
  ↓
DECLARED INTENT
  ↓
CAPABILITY CHECK
  ↓
POLICY
  ↓
TOOL / API VERIFICATION
  ↓
TRANSACTION ANALYSIS
  ↓
RISK ENGINE
  ↓
┌─────────┬─────────┬───────────┐
│  ALLOW  │  BLOCK  │ ESCALATE  │
└─────────┴─────────┴───────────┘
      ↓
SIGNING / EXECUTION
      ↓
FINAL-STATE VERIFICATION
      ↓
PROOF / RECEIPT
      ↓
AUDIT TRAIL
</code></pre>


<div class="notice">

<strong>PHORVA'S ARCHITECTURAL BOUNDARY</strong>

<p>
Phorva defines verification and authorization semantics.
Wallets, MPC systems, smart accounts, relayers, card issuers and
other infrastructure provide execution machinery.
</p>

<p>
The protected integration must enforce the Phorva decision before
signing or executing.
</p>

</div>
`;


/* ============================================================
   VIRTUAL CARD / FINTECH INTEGRATION
   ============================================================ */

PHORVA_PAGES["virtual-cards"] = `

<div class="eyebrow">USE CASE / FINANCIAL EXECUTION</div>

<h1>Virtual Card Security</h1>

<p>
Autonomous agents are not limited to blockchain transactions.
They can also initiate payments through virtual cards and other
financial execution rails.
</p>

<div class="notice">

<strong>ONE AUTHORIZATION MODEL. MULTIPLE EXECUTION RAILS.</strong>

<p>
Phorva can apply identity, intent, policy, risk and authorization
before an autonomous payment reaches an external financial rail.
</p>

</div>


<div class="architecture vertical">

<div>
AGENT
<br>
<small>"Buy $50 of cloud infrastructure"</small>
</div>

<span>↓</span>

<div class="accent">
PHORVA
<br>
<small>
identity · intent · policy · risk · authorization
</small>
</div>

<span>↓</span>

<div>
CARD / PAYMENT PROVIDER
<br>
<small>existing financial infrastructure</small>
</div>

<span>↓</span>

<div>
MERCHANT
</div>

</div>


<h2>Example Policy</h2>

<pre><code>Project: Autonomous Finance

maxTransaction:
  $100

monthlyLimit:
  $2,000

allowedCategories:
  - cloud infrastructure
  - software
  - developer tools

blockedCategories:
  - gambling
  - cash withdrawal
  - restricted merchants</code></pre>


<h2>Authorized Purchase</h2>

<pre><code>AGENT INTENT

Buy $50 of cloud compute


PHORVA

Transaction:
$50

Maximum:
$100

Category:
Allowed

Agent:
Authorized

Risk:
LOW


VERDICT: ALLOW


        ↓

CARD PAYMENT

        ↓

MERCHANT</code></pre>


<h2>Blocked Purchase</h2>

<pre><code>AGENT INTENT

Buy $50 of cloud compute


ACTUAL REQUEST

$900


PROJECT LIMIT

$100


PHORVA

VERDICT: BLOCK

Reason:
TRANSACTION LIMIT EXCEEDED</code></pre>


<h2>Compromised-Agent Example</h2>

<pre><code>NORMAL

$20–$100
Known merchants
Low frequency


SUDDENLY

$900
New merchant
Multiple attempts
Unusual category


PHORVA

Behavioral anomaly
       ↓
Risk increase
       ↓
QUARANTINE
       ↓
BLOCK</code></pre>


<h2>Integration Architecture</h2>

<pre><code>
EXISTING APPLICATION
        ↓
AUTONOMOUS AGENT
        ↓
PHORVA SDK / API
        ↓
IDENTITY
        ↓
INTENT
        ↓
POLICY
        ↓
RISK
        ↓
AUTHORIZATION
        ↓
CARD / PAYMENT RAIL
        ↓
MERCHANT
</code></pre>


<h2>Phorva Is Not The Card Issuer</h2>

<p>
Phorva does not replace the card issuer, card network, regulated payment
provider or PCI environment.
</p>

<p>
The financial infrastructure continues to perform the actual payment.
Phorva provides the autonomous execution authorization layer.
</p>


<h2>Cross-Rail Security</h2>

<p>
The same project-level authorization model can eventually govern multiple
execution environments.
</p>

<pre><code>
                    PHORVA
                       │
          ┌────────────┼────────────┐
          ↓            ↓            ↓
      BLOCKCHAIN     CARD        API
      EXECUTION    PAYMENT     EXECUTION
          │            │            │
          ↓            ↓            ↓
       WALLET       ISSUER       SERVICE
</code></pre>


<div class="notice">

<strong>INTEGRATION STATUS</strong>

<p>
This documentation describes the Phorva integration architecture.
It does not claim that Phorva currently issues virtual cards or
processes card payments directly.
</p>

<p>
Specific provider integrations should use that provider's documented
API and authorization capabilities.
</p>

</div>

`;


/* ============================================================
   PHORVA SECURITY OVERVIEW
   ============================================================ */

PHORVA_PAGES["security"] = `

<div class="eyebrow">PHORVA / SECURITY</div>

<h1>Autonomous Execution Security</h1>

<p>
Phorva is designed around a simple security boundary:
the agent can propose an action, but it cannot decide whether that
action is authorized.
</p>

<div class="notice">

<strong>THE SECURITY BOUNDARY</strong>

<p>
Do not try to make the autonomous agent perfectly trustworthy.
Make the execution environment capable of safely handling an
untrusted or compromised agent.
</p>

</div>


<h2>What Phorva Verifies</h2>

<div class="cards">

<div class="card">
<h3>IDENTITY</h3>
<p>Who is attempting the execution?</p>
</div>

<div class="card">
<h3>INTENT</h3>
<p>What was the agent supposed to do?</p>
</div>

<div class="card">
<h3>CAPABILITY</h3>
<p>Is this action within the agent's capabilities?</p>
</div>

<div class="card">
<h3>POLICY</h3>
<p>Does the action satisfy project and agent policy?</p>
</div>

<div class="card">
<h3>RISK</h3>
<p>Does the execution look anomalous or dangerous?</p>
</div>

<div class="card">
<h3>EXECUTION</h3>
<p>Did the final state match the authorized action?</p>
</div>

</div>


<h2>Authorization Decision</h2>

<pre><code>
IDENTITY
   +
INTENT
   +
CAPABILITY
   +
POLICY
   +
TRANSACTION
   +
RISK
   ↓

PHORVA

ALLOW
BLOCK
ESCALATE
QUARANTINE
</code></pre>


<h2>Why This Matters</h2>

<p>
Autonomous agents operate across systems that were not designed to trust
their reasoning blindly. Phorva moves the security decision outside the
agent's reasoning process and into an independently enforceable execution
boundary.
</p>

`;
 
console.log("PHORVA: expanded autonomous execution security docs loaded.");
