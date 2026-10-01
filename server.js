const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { createProductionApi } = require("./api/production-api");
const db = require("./api/database");
const { createApiKeyStore } = require("./api/api-keys");
const { createAgentStore } = require("./api/agents");
const {
  createExecutionRecordStore
} = require("./api/execution-records");
const {
  createSecurityAlertStore
} = require("./api/security-alerts");
const { createDeveloperStore } = require("./api/developers");
const {
  corsOrigin,
  createDeveloperRateLimiter,
  createAuthRateLimiter,
  createApiRateLimiter,
  requireTrustedOrigin
} = require("./api/security");

const apiKeyStore = createApiKeyStore(db);
const agentStore = createAgentStore(db);
const developerStore = createDeveloperStore(db);
const executionRecordStore =
  createExecutionRecordStore(db);

const securityAlertStore =
  createSecurityAlertStore(db);

const {
  getUseCases,
  isValidUseCase,
  getUseCase
} = require("./api/use-cases");

const {
  createSecurityProfile
} = require("./api/security-profile");



const chains = {
  baseSepolia: {
    name: "Base Sepolia",
    chainId: Number(process.env.BASE_SEPOLIA_CHAIN_ID || 84532),
    rpc: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org"
  },

  ethereumSepolia: {
    name: "Ethereum Sepolia",
    chainId: Number(process.env.ETHEREUM_SEPOLIA_CHAIN_ID || 11155111),
    rpc:
      process.env.ETHEREUM_SEPOLIA_RPC ||
      "https://ethereum-sepolia-rpc.publicnode.com"
  },

  arbitrumSepolia: {
    name: "Arbitrum Sepolia",
    chainId: Number(process.env.ARBITRUM_SEPOLIA_CHAIN_ID || 421614),
    rpc:
      process.env.ARBITRUM_SEPOLIA_RPC ||
      "https://sepolia-rollup.arbitrum.io/rpc"
  }
};

const app = express();
const PORT = Number(
  process.env.PORT || 3000
);

app.disable("x-powered-by");

app.use(
  require("helmet")({
    contentSecurityPolicy: false
  })
);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With"
    ]
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);


app.use(express.static(path.join(__dirname, "public")));

app.get("/api/chains", (req, res) => {
  res.json(
    Object.entries(chains).map(([key, chain]) => ({
      key,
      name: chain.name,
      chainId: chain.chainId
    }))
  );
});


const knownAssets = {
  baseSepolia: {
    "0x5555555555555555555555555555555555555555": {
      type: "erc20",
      name: "AgentGuard Test USDC",
      symbol: "USDC",
      protocol: null
    }
  }
};

const knownContracts = {
  baseSepolia: {
    "0x492e6456d9528771018deb9e87ef7750ef184104": {
      name: "Uniswap Universal Router",
      protocol: "Uniswap"
    },
    "0x05e73354cfdd6745c338b50bcfdfa3aa6fa03408": {
      name: "Uniswap v4 PoolManager",
      protocol: "Uniswap"
    },
    "0x4b2c77d209d3405f41a037ec6c77f7f5b8e2ca80": {
      name: "Uniswap v4 PositionManager",
      protocol: "Uniswap"
    }
  },

  ethereumSepolia: {
    "0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b": {
      name: "Uniswap Universal Router",
      protocol: "Uniswap"
    },
    "0xe03a1074c86cfedd5c142c4f04f1a1536e203543": {
      name: "Uniswap v4 PoolManager",
      protocol: "Uniswap"
    },
    "0x429ba70129df741b2ca2a85bc3a2a3328e5c09b4": {
      name: "Uniswap v4 PositionManager",
      protocol: "Uniswap"
    }
  },

  arbitrumSepolia: {
    "0xefd1d4bd4cf1e86da286bb4cb1b8bced9c10ba47": {
      name: "Uniswap Universal Router",
      protocol: "Uniswap"
    },
    "0xfb3e0c6f74eb1a21cc1da29aec80d2dfe6c9a317": {
      name: "Uniswap v4 PoolManager",
      protocol: "Uniswap"
    },
    "0xac631556d3d4019c95769033b5e719dd77124bac": {
      name: "Uniswap v4 PositionManager",
      protocol: "Uniswap"
    }
  }
};

app.get("/api/protocols", (req, res) => {
  const result = {};

  for (const [chainKey, contracts] of Object.entries(knownContracts)) {
    const protocols = [...new Set(
      Object.values(contracts)
        .map(contract => contract.protocol)
        .filter(Boolean)
    )];

    result[chainKey] = protocols;
  }

  res.json(result);
});

app.get("/api/assets", (req, res) => {
  const result = {};

  for (const [chainKey, chain] of Object.entries(chains)) {
    const registeredAssets = Object.entries(
      knownAssets[chainKey] || {}
    ).map(([address, asset]) => ({
      address,
      type: asset.type,
      name: asset.name,
      symbol: asset.symbol || null,
      protocol: asset.protocol || null
    }));

    result[chainKey] = [
      {
        address: null,
        type: "native",
        name: chain.name + " Native Asset",
        symbol: null,
        protocol: null
      },
      ...registeredAssets
    ];
  }

  res.json(result);
});

const functionSelectors = {
  "0x3593564c": {
    name: "execute",
    category: "universalRouter"
  },

  "0x38ed1739": {
    name: "swapExactTokensForTokens",
    category: "swap"
  },
  "0x095ea7b3": {
    name: "approve",
    category: "approval"
  },
  "0xa22cb465": {
    name: "setApprovalForAll",
    category: "approval"
  },
  "0xa9059cbb": {
    name: "transfer",
    category: "transfer"
  },
  "0x23b872dd": {
    name: "transferFrom",
    category: "transfer"
  },
  "0xf2fde38b": {
    name: "transferOwnership",
    category: "administration"
  },
  "0x8456cb59": {
    name: "pause",
    category: "administration"
  }
};

const MAX_UINT256 =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

function normalizeAddress(address) {
  return String(address || "").toLowerCase();
}

function resolveChainKey(tx) {
  const chainId = Number(
    tx.chainId ??
    tx.expectedChainId
  );

  if (chainId === chains.baseSepolia.chainId) {
    return "baseSepolia";
  }

  if (chainId === chains.ethereumSepolia.chainId) {
    return "ethereumSepolia";
  }

  if (chainId === chains.arbitrumSepolia.chainId) {
    return "arbitrumSepolia";
  }

  return null;
}

function resolveKnownContract(tx) {
  const chainKey = resolveChainKey(tx);

  if (!chainKey || !tx.to) {
    return null;
  }

  const address =
    normalizeAddress(tx.to);

  return (
    knownContracts[chainKey]?.[address] ??
    knownAssets[chainKey]?.[address] ??
    null
  );
}

function decodeFunction(calldata) {
  if (!calldata || calldata.length < 10) {
    return {
      selector: null,
      name: "Unknown function",
      category: "unknown"
    };
  }

  const selector = calldata.slice(0, 10).toLowerCase();
  const known = functionSelectors[selector];

  if (!known) {
    return {
      selector,
      name: "Unknown function",
      category: "unknown"
    };
  }

  return {
    selector,
    name: known.name,
    category: known.category
  };
}

function decodeWord(calldata, index) {
  if (!calldata) {
    return null;
  }

  const clean = calldata.slice(10);
  const start = index * 64;
  const word = clean.slice(start, start + 64);

  if (word.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(word)) {
    return null;
  }

  return word.toLowerCase();
}

function decodeAddressWord(word) {
  if (!word || word.length !== 64) {
    return null;
  }

  return "0x" + word.slice(24);
}

function decodeUintWord(word) {
  if (!word || !/^[0-9a-fA-F]{64}$/.test(word)) {
    return null;
  }

  if (word.toLowerCase() === MAX_UINT256) {
    return "MAX_UINT256";
  }

  try {
    return BigInt("0x" + word).toString();
  } catch {
    return null;
  }
}

function decodeBoolWord(word) {
  if (!word) {
    return null;
  }

  if (word === "0".repeat(64)) {
    return false;
  }

  if (
    word.slice(0, 63) === "0".repeat(63) &&
    word.slice(63) === "1"
  ) {
    return true;
  }

  return null;
}


function decodeUniversalRouterExecute(calldata) {
  const selector =
    calldata.slice(0, 10).toLowerCase();

  /*
   * execute(bytes,bytes[])
   *
   * We initially support the common single-command
   * Universal Router V2 exact-input swap:
   *
   * command 0x08 = V2_SWAP_EXACT_IN
   *
   * The command input is:
   *   address recipient
   *   uint256 amountIn
   *   uint256 amountOutMin
   *   address[] path
   *   bool payerIsUser
   *   uint256[] minHopPriceX36
   *
   * This decoder intentionally rejects malformed or
   * unsupported multi-command payloads instead of
   * guessing.
   */

  if (
    selector !== "0x3593564c"
  ) {
    return null;
  }

  const words = [];

  for (let i = 0; i < 8; i++) {
    const word = decodeWord(calldata, i);

    if (!word) {
      break;
    }

    words.push(word);
  }

  if (words.length < 2) {
    return {
      valid: false,
      router: true,
      error: "Incomplete Universal Router execute calldata."
    };
  }

  const commandsOffset =
    decodeUintWord(words[0]);

  const inputsOffset =
    decodeUintWord(words[1]);

  if (
    commandsOffset === null ||
    inputsOffset === null ||
    commandsOffset === "MAX_UINT256" ||
    inputsOffset === "MAX_UINT256"
  ) {
    return {
      valid: false,
      router: true,
      error: "Invalid Universal Router ABI offsets."
    };
  }

  const body = calldata.slice(10);

  const commandsStart =
    Number(commandsOffset) * 2;

  const inputsStart =
    Number(inputsOffset) * 2;

  if (
    !Number.isSafeInteger(commandsStart) ||
    !Number.isSafeInteger(inputsStart) ||
    commandsStart < 0 ||
    inputsStart < 0 ||
    commandsStart + 64 > body.length ||
    inputsStart + 64 > body.length
  ) {
    return {
      valid: false,
      router: true,
      error: "Universal Router dynamic data is out of bounds."
    };
  }

  const commandsLengthHex =
    body.slice(
      commandsStart,
      commandsStart + 64
    );

  const commandsLength =
    Number(BigInt("0x" + commandsLengthHex));

  if (
    !Number.isSafeInteger(commandsLength) ||
    commandsLength < 1 ||
    commandsLength > 32
  ) {
    return {
      valid: false,
      router: true,
      error: "Invalid Universal Router command count."
    };
  }

  const commandsHex =
    body.slice(
      commandsStart + 64,
      commandsStart + 64 + commandsLength * 2
    );

  if (
    commandsHex.length !== commandsLength * 2 ||
    !/^[0-9a-fA-F]+$/.test(commandsHex)
  ) {
    return {
      valid: false,
      router: true,
      error: "Universal Router commands are incomplete."
    };
  }

  /*
   * inputs is a dynamic bytes[].
   *
   * The first word at inputsStart is the array length.
   * Each following word is an offset to an individual
   * bytes element relative to the start of the array's
   * element-offset area.
   */
  const inputCountHex =
    body.slice(
      inputsStart,
      inputsStart + 64
    );

  const inputCount =
    Number(BigInt("0x" + inputCountHex));

  if (!Number.isSafeInteger(inputCount)) {
    return {
      valid: false,
      router: true,
      error: "Invalid Universal Router input count."
    };
  }

  if (inputCount !== commandsLength) {
    return {
      valid: false,
      router: true,
      error:
        "Universal Router command/input count mismatch: " +
        "commands=" + commandsLength +
        ", inputs=" + inputCount +
        ", commandsOffset=" + commandsOffset +
        ", inputsOffset=" + inputsOffset
    };
  }

  /*
   * For the first milestone we only authorize a
   * single V2 exact-input command.
   */
  if (commandsLength !== 1) {
    return {
      valid: false,
      router: true,
      command: null,
      error:
        "Multi-command Universal Router transactions require explicit command-by-command verification."
    };
  }

  const commandByte =
    parseInt(commandsHex.slice(0, 2), 16);

  const commandType =
    commandByte & 0x7f;

  const allowRevert =
    (commandByte & 0x80) !== 0;

  if (commandType !== 0x08) {
    return {
      valid: false,
      router: true,
      command: "0x" +
        commandType.toString(16).padStart(2, "0"),
      allowRevert,
      error:
        "Universal Router command is not yet supported."
    };
  }

  /*
   * inputs[] offsets begin immediately after the
   * array length word.
   */
  const firstInputOffsetWord =
    body.slice(
      inputsStart + 64,
      inputsStart + 128
    );

  if (firstInputOffsetWord.length !== 64) {
    return {
      valid: false,
      router: true,
      error: "Universal Router input offset is missing."
    };
  }

  const firstInputOffset =
    Number(BigInt("0x" + firstInputOffsetWord));

  if (
    !Number.isSafeInteger(firstInputOffset) ||
    firstInputOffset < 0
  ) {
    return {
      valid: false,
      router: true,
      error: "Invalid Universal Router input offset."
    };
  }

  /*
   * ABI bytes[] offsets are measured from the beginning
   * of the array's element-offset/data region, immediately
   * after the array length word.
   */
  const inputBase =
    inputsStart + 64;

  // The first offset is relative to inputBase.
  const inputStart =
    inputBase + firstInputOffset * 2;

  if (
    inputStart + 64 > body.length
  ) {
    return {
      valid: false,
      router: true,
      error: "Universal Router command input is missing."
    };
  }

  const inputLength =
    Number(
      BigInt(
        "0x" +
        body.slice(
          inputStart,
          inputStart + 64
        )
      )
    );

  if (
    !Number.isSafeInteger(inputLength) ||
    inputLength < 192 ||
    inputLength > 8192
  ) {
    return {
      valid: false,
      router: true,
      error: "Invalid V2 swap command input length."
    };
  }

  const inputDataStart =
    inputStart + 64;

  const inputDataEnd =
    inputDataStart + inputLength * 2;

  if (
    inputDataEnd > body.length
  ) {
    return {
      valid: false,
      router: true,
      error: "V2 swap command input is truncated."
    };
  }

  const input =
    body.slice(
      inputDataStart,
      inputDataEnd
    );

  function inputWord(index) {
    const start = index * 64;
    const word = input.slice(start, start + 64);

    if (
      word.length !== 64 ||
      !/^[0-9a-fA-F]{64}$/.test(word)
    ) {
      return null;
    }

    return word.toLowerCase();
  }

  const recipient =
    decodeAddressWord(inputWord(0));

  const amountIn =
    decodeUintWord(inputWord(1));

  const amountOutMin =
    decodeUintWord(inputWord(2));

  const pathOffset =
    decodeUintWord(inputWord(3));

  const payerIsUser =
    decodeBoolWord(inputWord(4));

  if (
    !recipient ||
    amountIn === null ||
    amountOutMin === null ||
    pathOffset === null ||
    payerIsUser === null
  ) {
    return {
      valid: false,
      router: true,
      command: "V2_SWAP_EXACT_IN",
      error:
        "Invalid V2 swap command parameters."
    };
  }

  const pathOffsetBytes =
    Number(pathOffset);

  if (
    !Number.isSafeInteger(pathOffsetBytes) ||
    pathOffsetBytes % 32 !== 0
  ) {
    return {
      valid: false,
      router: true,
      command: "V2_SWAP_EXACT_IN",
      error: "Invalid V2 swap path offset."
    };
  }

  const pathStart =
    pathOffsetBytes * 2;

  if (
    pathStart + 64 > input.length
  ) {
    return {
      valid: false,
      router: true,
      command: "V2_SWAP_EXACT_IN",
      error: "V2 swap path is missing."
    };
  }

  const pathLength =
    Number(
      BigInt(
        "0x" +
        input.slice(
          pathStart,
          pathStart + 64
        )
      )
    );

  if (
    !Number.isSafeInteger(pathLength) ||
    pathLength < 2 ||
    pathLength > 32
  ) {
    return {
      valid: false,
      router: true,
      command: "V2_SWAP_EXACT_IN",
      error: "Invalid V2 swap path length."
    };
  }

  const path = [];

  for (let i = 0; i < pathLength; i++) {
    const position =
      pathStart + 64 + i * 64;

    if (
      position + 64 > input.length
    ) {
      return {
        valid: false,
        router: true,
        command: "V2_SWAP_EXACT_IN",
        error: "V2 swap path is incomplete."
      };
    }

    const address =
      decodeAddressWord(
        input.slice(
          position,
          position + 64
        )
      );

    if (!address) {
      return {
        valid: false,
        router: true,
        command: "V2_SWAP_EXACT_IN",
        error: "V2 swap path contains an invalid address."
      };
    }

    path.push(address);
  }

  return {
    valid: true,
    router: true,
    function: "execute",
    command: "V2_SWAP_EXACT_IN",
    commandByte:
      "0x" +
      commandByte.toString(16).padStart(2, "0"),
    commandType,
    allowRevert,
    amountIn,
    amountOutMin,
    path,
    recipient,
    payerIsUser,
    actualAmount: amountIn
  };
}


function decodeParameters(calldata, category) {
  calldata =
    typeof calldata === "string" && calldata.length > 0
      ? calldata
      : "0x";

  if (category === "universalRouter") {
    const decoded =
      decodeUniversalRouterExecute(calldata);

    if (!decoded.valid) {
      return {
        valid: false,
        protocol: "Uniswap",
        category: "universalRouter",
        actualAmount: null,
        error:
          decoded.error ||
          "Universal Router decoding failed."
      };
    }

    return {
      valid: true,
      protocol: "Uniswap",
      category: "universalRouter",
      command: decoded.command,
      commandType: decoded.commandType,
      allowRevert: decoded.allowRevert,
      recipient: decoded.recipient,
      amountIn: decoded.amountIn,
      amountOutMin: decoded.amountOutMin,
      path: decoded.path,
      payerIsUser: decoded.payerIsUser,
      actualAmount: decoded.actualAmount
    };
  }


  const words = [];

  for (let i = 0; i < 32; i++) {
    const word = decodeWord(calldata, i);

    if (!word) {
      break;
    }

    words.push(word);
  }

  const selector =
    calldata.slice(0, 10).toLowerCase();

  /*
   * approve(address,uint256)
   */
  if (
    category === "approval" &&
    selector === "0x095ea7b3"
  ) {
    const spender = decodeAddressWord(words[0]);
    const amount = decodeUintWord(words[1]);

    return {
      spender,
      amount,
      unlimited: amount === "MAX_UINT256"
    };
  }

  /*
   * setApprovalForAll(address,bool)
   */
  if (
    category === "approval" &&
    selector === "0xa22cb465"
  ) {
    return {
      operator: decodeAddressWord(words[0]),
      approved: decodeBoolWord(words[1])
    };
  }

  /*
   * transfer(address,uint256)
   */
  if (
    category === "transfer" &&
    selector === "0xa9059cbb"
  ) {
    return {
      recipient: decodeAddressWord(words[0]),
      amount: decodeUintWord(words[1])
    };
  }

  /*
   * transferFrom(address,address,uint256)
   */
  if (
    category === "transfer" &&
    selector === "0x23b872dd"
  ) {
    return {
      from: decodeAddressWord(words[0]),
      recipient: decodeAddressWord(words[1]),
      amount: decodeUintWord(words[2])
    };
  }

  /*
   * swapExactTokensForTokens(
   *   uint256 amountIn,
   *   uint256 amountOutMin,
   *   address[] path,
   *   address to,
   *   uint256 deadline
   * )
   *
   * Static ABI words:
   *   word 0 = amountIn
   *   word 1 = amountOutMin
   *   word 2 = offset to path
   *   word 3 = recipient
   *   word 4 = deadline
   *
   * The path is dynamic and begins at the byte offset
   * stored in word 2.
   */
  if (
    category === "swap" &&
    selector === "0x38ed1739"
  ) {
    if (words.length < 5) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error:
          "Incomplete swap calldata. Full ABI encoding is required."
      };
    }

    const amountIn = decodeUintWord(words[0]);
    const amountOutMin = decodeUintWord(words[1]);
    const pathOffsetValue = decodeUintWord(words[2]);
    const recipient = decodeAddressWord(words[3]);
    const deadline = decodeUintWord(words[4]);

    if (
      amountIn === null ||
      amountOutMin === null ||
      pathOffsetValue === null ||
      recipient === null ||
      deadline === null ||
      pathOffsetValue === "MAX_UINT256"
    ) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Invalid swap ABI parameters."
      };
    }

    const pathOffset = Number(pathOffsetValue);

    if (
      !Number.isSafeInteger(pathOffset) ||
      pathOffset % 32 !== 0 ||
      pathOffset < 160
    ) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Invalid swap path offset."
      };
    }

    const calldataBody = calldata.slice(10);

    if (calldataBody.length % 64 !== 0) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Invalid ABI calldata length."
      };
    }

    const pathStart = pathOffset * 2;

    if (pathStart + 64 > calldataBody.length) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Swap path data is missing."
      };
    }

    const pathLengthHex =
      calldataBody.slice(
        pathStart,
        pathStart + 64
      );

    const pathLength =
      Number(BigInt("0x" + pathLengthHex));

    if (
      !Number.isSafeInteger(pathLength) ||
      pathLength < 2 ||
      pathLength > 32
    ) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Invalid swap path length."
      };
    }

    const path = [];

    for (let i = 0; i < pathLength; i++) {
      const position =
        pathStart + 64 + i * 64;

      if (position + 64 > calldataBody.length) {
        return {
          rawWords: words,
          valid: false,
          actualAmount: null,
          error: "Swap path is incomplete."
        };
      }

      const addressWord =
        calldataBody.slice(
          position,
          position + 64
        );

      path.push(
        decodeAddressWord(addressWord)
      );
    }

    if (path.some((address) => !address)) {
      return {
        rawWords: words,
        valid: false,
        actualAmount: null,
        error: "Swap path contains an invalid address."
      };
    }

    return {
      valid: true,
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline,
      actualAmount: amountIn
    };
  }

  return {
    rawWords: words
  };
}

function normalizeDecodedAction(decodedFunction, decodedParameters) {

  if (
    decodedFunction.category === "universalRouter"
  ) {
    return {
      action: "swap",
      amount:
        decodedParameters.amountIn ??
        null,
      amountOutMin:
        decodedParameters.amountOutMin ??
        null,
      path:
        decodedParameters.path ??
        [],
      recipient:
        decodedParameters.recipient ??
        null,
      protocolAction:
        decodedParameters.command ??
        "swap"
    };
  }

  if (
    decodedFunction.category === "swap"
  ) {
    return {
      action: "swap",
      amount:
        decodedParameters.amountIn ??
        decodedParameters.amount ??
        null,
      amountOutMin:
        decodedParameters.amountOutMin ??
        null,
      path:
        decodedParameters.path ??
        [],
      recipient:
        decodedParameters.recipient ??
        null,
      deadline:
        decodedParameters.deadline ??
        null,
      protocolAction: "swap"
    };
  }

  if (
    decodedFunction.category === "approval"
  ) {
    return {
      action: "approval",
      amount:
        decodedParameters.amount ??
        null,
      spender:
        decodedParameters.spender ??
        decodedParameters.operator ??
        null,
      approved:
        decodedParameters.approved ??
        null,
      protocolAction: "approval"
    };
  }

  if (
    decodedFunction.category === "transfer"
  ) {
    return {
      action: "transfer",
      amount:
        decodedParameters.amount ??
        null,
      recipient:
        decodedParameters.recipient ??
        null,
      from:
        decodedParameters.from ??
        null,
      protocolAction: "transfer"
    };
  }

  if (
    decodedFunction.category === "administration"
  ) {
    return {
      action: "administration",
      amount: null,
      protocolAction:
        decodedFunction.name
    };
  }

  return {
    action: "unknown",
    amount: null,
    protocolAction: "unknown"
  };
}


/*
 * Step 19 — Execution-Type Authorization
 *
 * Verifies that the actual decoded blockchain operation
 * matches the operation authorized by the agent intent.
 *
 * Uses the completed transaction analysis object so this
 * helper does not depend on route-local decoder variables.
 */
const VERIFIED_EXECUTION_TYPES = {
  swap: ["swap", "universalRouter"],
  approval: ["approval"],
  send: ["nativeTransfer"],
  transfer: ["transfer"]
};

function getVerifiedExecutionCapability(actionType) {
  const aliases = {
    approve: "approval",
    approval: "approval",
    send: "send",
    transfer: "transfer",
    swap: "swap"
  };

  const canonicalType =
    aliases[String(actionType || "").toLowerCase()] ||
    String(actionType || "").toLowerCase();

  const categories =
    VERIFIED_EXECUTION_TYPES[canonicalType];

  if (!categories) {
    return {
      supported: false,
      type: canonicalType,
      categories: []
    };
  }

  return {
    supported: true,
    type: canonicalType,
    categories: [...categories]
  };
}

function verifyExecutionType(intent, analysis) {
  const decodedFunction =
    analysis?.decodedFunction || {};

  const decodedParameters =
    analysis?.decodedParameters || {};

  const aliases = {
    approve: "approval",
    approval: "approval",
    send: "send",
    transfer: "transfer",
    swap: "swap"
  };

  const requestedType =
    String(intent?.type || "").toLowerCase();

  const canonicalType =
    aliases[requestedType] || requestedType;

  const capability =
    getVerifiedExecutionCapability(canonicalType);

  if (!capability.supported) {
    return false;
  }

  if (canonicalType === "swap") {
    if (decodedFunction.category === "swap") {
      return (
        VERIFIED_EXECUTION_TYPES.swap.includes(
          decodedFunction.category
        ) &&
        decodedParameters.valid !== false
      );
    }

    if (
      VERIFIED_EXECUTION_TYPES.swap.includes(
        decodedFunction.category
      ) &&
      decodedParameters.valid === true &&
      decodedParameters.commandType === 0x08 &&
      decodedParameters.allowRevert === false
    ) {
      return true;
    }

    return false;
  }

  if (canonicalType === "approval") {
    return (
      VERIFIED_EXECUTION_TYPES.approval.includes(
        decodedFunction.category
      )
    );
  }

  if (canonicalType === "send") {
    return (
      VERIFIED_EXECUTION_TYPES.send.includes(
        decodedFunction.category
      ) &&
      decodedParameters.valid === true
    );
  }

  if (canonicalType === "transfer") {
    if (decodedFunction.category === "nativeTransfer") {
      return decodedParameters.valid === true;
    }

    return (
      VERIFIED_EXECUTION_TYPES.transfer.includes(
        decodedFunction.category
      ) &&
      (
        decodedFunction.selector === "0xa9059cbb" ||
        decodedFunction.selector === "0x23b872dd"
      )
    );
  }

  return false;
}

const AGENT_CAPABILITIES = new Set([
  "send",
  "transfer",
  "approve",
  "approval",
  "swap",
  "permit",
  "bridge",
  "deposit",
  "withdraw",
  "supply",
  "redeem",
  "lend",
  "borrow",
  "repay",
  "stake",
  "unstake",
  "lp-add",
  "lp-remove",
  "claim",
  "mint",
  "burn",
  "liquidate",
  "rebalance",
  "contract-call",
  "contractCall",
  "custom-action",
  "customAction",

  "buy-position",
  "sell-position",
  "add-position",
  "reduce-position",
  "close-position",
  "deposit-collateral",
  "withdraw-collateral",
  "claim-winnings",
  "redeem-position",
  "split-position",
  "merge-position",
  "trade",

  "purchase",
  "sell",
  "upgrade",
  "craft",
  "equip",
  "unequip",
  "marketplace-listing",
  "marketplace-bid",
  "marketplace-offer",

  "delegate",
  "undelegate",
  "propose",
  "vote",
  "queue",
  "execute",
  "cancel-proposal",
  "stream",
  "create-grant",
  "fund-grant",

  "pay",
  "request-payment",
  "split-payment",
  "recurring-payment",
  "refund",

  "authorize",
  "capture",
  "void",
  "partial-refund",
  "payment",
  "fund-card",
  "withdraw-card-balance",
  "deploy"
]);

function isAgentCapabilityAllowed(actionType) {
  const normalized =
    String(actionType || "").toLowerCase();

  return AGENT_CAPABILITIES.has(normalized);
}

function isPolicyCapabilityAllowed(actionType, policy) {
  const normalized =
    String(actionType || "").toLowerCase();

  const capabilities =
    Array.isArray(policy?.capabilities)
      ? policy.capabilities.map(
          value => String(value || "").toLowerCase()
        )
      : null;

  if (!capabilities) {
    return isAgentCapabilityAllowed(normalized);
  }

  return (
    isAgentCapabilityAllowed(normalized) &&
    capabilities.includes(normalized)
  );
}

function isPolicyTargetAllowed(transaction, policy) {
  const allowedTargets =
    Array.isArray(policy?.allowedTargets)
      ? policy.allowedTargets
          .map(value =>
            String(value || "").toLowerCase()
          )
      : null;

  if (!allowedTargets) {
    return true;
  }

  const target =
    String(transaction?.to || "").toLowerCase();

  return (
    target !== "" &&
    allowedTargets.includes(target)
  );
}

function isPolicySelectorAllowed(transaction, policy) {
  const allowedSelectors =
    Array.isArray(policy?.allowedSelectors)
      ? policy.allowedSelectors
          .map(value =>
            String(value || "").toLowerCase()
          )
      : null;

  if (!allowedSelectors) {
    return true;
  }

  const calldata =
    String(transaction?.calldata || "").toLowerCase();

  const selector =
    calldata.length >= 10
      ? calldata.slice(0, 10)
      : "";

  return (
    selector !== "" &&
    allowedSelectors.includes(selector)
  );
}

const EXECUTION_ADAPTERS = {
  send: "nativeTransfer",
  transfer: "erc20Transfer",
  approve: "erc20Approval",
  approval: "erc20Approval",
  swap: "verifiedSwap"
};

function getExecutionAdapter(actionType) {
  const normalized =
    String(actionType || "").toLowerCase();

  const adapter =
    EXECUTION_ADAPTERS[normalized];

  if (!adapter) {
    return {
      supported: false,
      actionType: normalized,
      adapter: null
    };
  }

  return {
    supported: true,
    actionType: normalized,
    adapter
  };
}

function isPolicyApprovalAllowed(decodedFunction, decodedParameters, policy) {
  if (decodedFunction?.category !== "approval") {
    return true;
  }

  const allowedSpenders =
    Array.isArray(policy?.allowedSpenders)
      ? policy.allowedSpenders
          .map(value => String(value || "").toLowerCase())
      : null;

  const spender =
    decodedParameters?.spender ??
    decodedParameters?.operator ??
    null;

  if (
    allowedSpenders &&
    (
      !spender ||
      !allowedSpenders.includes(
        String(spender).toLowerCase()
      )
    )
  ) {
    return false;
  }

  const approved =
    decodedParameters?.approved === true;

  const unlimited =
    decodedParameters?.unlimited === true;

  if (
    (approved || unlimited) &&
    policy?.allowUnlimitedApprovals === false
  ) {
    return false;
  }

  const maxApprovalRaw =
    policy?.maxApprovalAmount;

  if (
    maxApprovalRaw !== undefined &&
    maxApprovalRaw !== null &&
    maxApprovalRaw !== ""
  ) {
    const maxApproval =
      BigInt(String(maxApprovalRaw));

    const amount =
      decodedParameters?.amount;

    if (
      amount !== undefined &&
      amount !== null &&
      amount !== "MAX_UINT256" &&
      BigInt(String(amount)) > maxApproval
    ) {
      return false;
    }
  }

  return true;
}


function buildExecutionTransaction({
  intent,
  transaction
}) {
  const actionType =
    String(intent?.type || "").toLowerCase();

  if (!isAgentCapabilityAllowed(actionType)) {
    throw new Error(
      `Agent capability is not authorized for action type: ${actionType || "unknown"}`
    );
  }

  const executionAdapter =
    getExecutionAdapter(actionType);

  const verifiedExecution =
    getVerifiedExecutionCapability(actionType);

  if (
    !executionAdapter.supported ||
    !verifiedExecution.supported
  ) {
    throw new Error(
      `Execution construction is not yet verified for action type: ${actionType || "unknown"}`
    );
  }

  if (executionAdapter.adapter === "nativeTransfer") {
    const recipient =
      transaction?.to ||
      intent?.recipient ||
      null;

    const value =
      transaction?.value ??
      intent?.nativeValue ??
      intent?.value ??
      "0";

    if (!recipient) {
      throw new Error(
        "Native send requires a recipient."
      );
    }

    const normalizedRecipient =
      String(recipient).toLowerCase();

    if (
      !/^0x[0-9a-f]{40}$/.test(
        normalizedRecipient
      )
    ) {
      throw new Error(
        "Native send requires a valid recipient address."
      );
    }

    let nativeValue;

    try {
      nativeValue = BigInt(String(value));
    } catch {
      throw new Error(
        "Native send value must be an integer."
      );
    }

    if (nativeValue <= 0n) {
      throw new Error(
        "Native send requires a non-zero native value."
      );
    }

    if (
      nativeValue >
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
    ) {
      throw new Error(
        "Native send value exceeds uint256."
      );
    }

    return {
      type: "send",
      transaction: {
        chainId:
          transaction?.chainId ??
          intent?.chainId ??
          null,
        from:
          transaction?.from ??
          intent?.wallet ??
          null,
        to: normalizedRecipient,
        value: nativeValue.toString(),
        calldata: "0x"
      }
    };
  }

  if (executionAdapter.adapter === "erc20Transfer") {
    const token =
      intent?.asset?.address ||
      intent?.token ||
      transaction?.token ||
      null;

    const recipient =
      intent?.recipient ||
      transaction?.recipient ||
      null;

    const amount =
      intent?.amount ??
      intent?.value ??
      null;

    if (!token) {
      throw new Error(
        "ERC-20 transfer requires a token contract."
      );
    }

    const normalizedToken =
      String(token).toLowerCase();

    if (
      !/^0x[0-9a-f]{40}$/.test(
        normalizedToken
      )
    ) {
      throw new Error(
        "ERC-20 transfer requires a valid token contract address."
      );
    }

    if (!recipient) {
      throw new Error(
        "ERC-20 transfer requires a recipient."
      );
    }

    if (
      amount === null ||
      amount === undefined
    ) {
      throw new Error(
        "ERC-20 transfer requires an amount."
      );
    }

    const normalizedRecipient =
      String(recipient).toLowerCase();

    if (
      !/^0x[0-9a-f]{40}$/.test(
        normalizedRecipient
      )
    ) {
      throw new Error(
        "ERC-20 transfer requires a valid recipient address."
      );
    }

    let transferAmount;

    try {
      transferAmount = BigInt(String(amount));
    } catch {
      throw new Error(
        "ERC-20 transfer amount must be an integer."
      );
    }

    if (transferAmount <= 0n) {
      throw new Error(
        "ERC-20 transfer amount must be greater than zero."
      );
    }

    if (
      transferAmount >
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
    ) {
      throw new Error(
        "ERC-20 transfer amount exceeds uint256."
      );
    }

    const recipientWord =
      normalizedRecipient
        .replace(/^0x/, "")
        .padStart(64, "0");

    const amountWord =
      transferAmount
        .toString(16)
        .padStart(64, "0");

    return {
      type: "transfer",
      transaction: {
        chainId:
          transaction?.chainId ??
          intent?.chainId ??
          null,
        from:
          transaction?.from ??
          intent?.wallet ??
          null,
        to: normalizedToken,
        value: "0",
        calldata:
          "0xa9059cbb" +
          recipientWord +
          amountWord
      }
    };
  }

  if (executionAdapter.adapter === "erc20Approval") {
    const token =
      intent?.asset?.address ||
      intent?.token ||
      transaction?.token ||
      null;

    const spender =
      intent?.spender ||
      transaction?.spender ||
      null;

    const allowance =
      intent?.amount ??
      intent?.allowance ??
      null;

    if (!token) {
      throw new Error(
        "Approval requires a token contract."
      );
    }

    const normalizedToken =
      String(token).toLowerCase();

    if (
      !/^0x[0-9a-f]{40}$/.test(
        normalizedToken
      )
    ) {
      throw new Error(
        "Approval requires a valid token contract address."
      );
    }

    if (!spender) {
      throw new Error(
        "Approval requires a spender."
      );
    }

    const normalizedSpender =
      String(spender).toLowerCase();

    if (
      !/^0x[0-9a-f]{40}$/.test(
        normalizedSpender
      )
    ) {
      throw new Error(
        "Approval requires a valid spender address."
      );
    }

    if (
      allowance === null ||
      allowance === undefined
    ) {
      throw new Error(
        "Approval requires an allowance."
      );
    }

    let approvalAmount;

    try {
      approvalAmount = BigInt(String(allowance));
    } catch {
      throw new Error(
        "Approval allowance must be an integer."
      );
    }

    if (approvalAmount < 0n) {
      throw new Error(
        "Approval allowance cannot be negative."
      );
    }

    if (
      approvalAmount >
      0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
    ) {
      throw new Error(
        "Approval allowance exceeds uint256."
      );
    }

    const spenderWord =
      normalizedSpender
        .replace(/^0x/, "")
        .padStart(64, "0");

    const allowanceWord =
      approvalAmount
        .toString(16)
        .padStart(64, "0");

    return {
      type: "approval",
      transaction: {
        chainId:
          transaction?.chainId ??
          intent?.chainId ??
          null,
        from:
          transaction?.from ??
          intent?.wallet ??
          null,
        to: normalizedToken,
        value: "0",
        calldata:
          "0x095ea7b3" +
          spenderWord +
          allowanceWord
      }
    };
  }

  if (executionAdapter.adapter === "verifiedSwap") {
    const chainKey =
      intent?.chain ||
      transaction?.chain ||
      null;

    const chainContracts =
      knownContracts[chainKey] || {};

    const universalRouter =
      Object.entries(chainContracts).find(
        ([, contract]) =>
          contract?.name === "Uniswap Universal Router"
      );

    if (!universalRouter) {
      throw new Error(
        `Verified Uniswap Universal Router is not configured for chain: ${chainKey || "unknown"}`
      );
    }

    const target =
      String(universalRouter[0]).toLowerCase();

    if (!/^0x[0-9a-f]{40}$/.test(target)) {
      throw new Error(
        "Configured Uniswap Universal Router address is invalid."
      );
    }

    const tokenIn =
      intent?.tokenIn ||
      null;

    const tokenOut =
      intent?.tokenOut ||
      null;

    const amountIn =
      intent?.amount ??
      null;

    const amountOutMin =
      intent?.amountOutMin ??
      0;

    const nativeValue =
      transaction?.value ??
      intent?.nativeValue ??
      "0";

    let parsedNativeValue;

    try {
      parsedNativeValue = BigInt(String(nativeValue));
    } catch {
      throw new Error(
        "Swap native value must be an integer."
      );
    }

    if (parsedNativeValue !== 0n) {
      throw new Error(
        "Verified ERC-20 swap does not permit native value."
      );
    }

    const recipient =
      intent?.recipient ||
      intent?.wallet ||
      null;

    if (!tokenIn || !tokenOut) {
      throw new Error(
        "Swap requires tokenIn and tokenOut addresses."
      );
    }

    if (!recipient) {
      throw new Error(
        "Swap requires a recipient."
      );
    }

    if (
      amountIn === null ||
      amountIn === undefined
    ) {
      throw new Error(
        "Swap requires an input amount."
      );
    }

    const addressWord = value => {
      const normalized =
        String(value)
          .toLowerCase()
          .replace(/^0x/, "");

      if (!/^[0-9a-f]{40}$/.test(normalized)) {
        throw new Error(
          `Invalid address: ${value}`
        );
      }

      return normalized.padStart(64, "0");
    };

    const uintWord = (value, label) => {
      try {
        const parsed =
          BigInt(String(value));

        if (
          parsed < 0n ||
          parsed >
          0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
        ) {
          throw new Error();
        }

        return parsed
          .toString(16)
          .padStart(64, "0");
      } catch {
        throw new Error(
          `Invalid ${label}.`
        );
      }
    };

    const recipientWord =
      addressWord(recipient);

    const amountInWord =
      uintWord(amountIn, "swap input amount");

    if (BigInt(String(amountIn)) <= 0n) {
      throw new Error(
        "Swap input amount must be greater than zero."
      );
    }

    const amountOutMinWord =
      uintWord(
        amountOutMin,
        "minimum output amount"
      );

    const path =
      addressWord(tokenIn) +
      addressWord(tokenOut);

    const pathBytesLength =
      (path.length / 2)
        .toString(16)
        .padStart(64, "0");

    const pathPadded =
      path.padEnd(
        Math.ceil(path.length / 64) * 64,
        "0"
      );

    const payerIsUserWord =
      "1".padStart(64, "0");

    const swapInput =
      recipientWord +
      amountInWord +
      amountOutMinWord +
      "a0".padStart(64, "0") +
      payerIsUserWord +
      pathBytesLength +
      pathPadded;

    const commands =
      "08";

    /*
     * execute(bytes commands, bytes[] inputs)
     *
     * The two dynamic offsets are measured from the start
     * of the ABI argument block.
     */
    const commandsOffset =
      64n;

    const commandsData =
      "01".padStart(64, "0") +
      commands.padEnd(64, "0");

    const inputsOffset =
      commandsOffset +
      BigInt(commandsData.length / 2);

    const inputOffset =
      32n;

    const swapInputLength =
      (swapInput.length / 2)
        .toString(16)
        .padStart(64, "0");

    const inputData =
      swapInputLength +
      swapInput;

    const inputsData =
      "01".padStart(64, "0") +
      inputOffset
        .toString(16)
        .padStart(64, "0") +
      inputData;

    const calldata =
      "0x3593564c" +
      commandsOffset
        .toString(16)
        .padStart(64, "0") +
      inputsOffset
        .toString(16)
        .padStart(64, "0") +
      commandsData +
      inputsData;

    return {
      type: "swap",
      transaction: {
        chainId:
          transaction?.chainId ??
          intent?.chainId ??
          null,
        from:
          transaction?.from ??
          intent?.wallet ??
          null,
        to: target,
        value: "0",
        calldata
      }
    };
  }

  throw new Error(
    `Execution construction is not yet supported for action type: ${actionType || "unknown"}`
  );
}

function analyzeTransaction(tx, intent) {
  const securityFlags = [];
  const parameterFlags = [];

  const contract = resolveKnownContract(tx);
  const decodedFunction = decodeFunction(tx.calldata);
  const decodedParameters =
    decodeParameters(
      tx.calldata,
      decodedFunction.category
    );

  const isNativeTransfer =
    (intent?.type === "send" || intent?.type === "transfer") &&
    (!tx.calldata || tx.calldata === "0x") &&
    tx.to &&
    tx.value !== undefined &&
    tx.value !== null &&
    String(tx.value) !== "0";

  if (isNativeTransfer) {
    decodedFunction.category = "nativeTransfer";
    decodedFunction.name = "native transfer";

    decodedParameters.valid = true;
    decodedParameters.recipient = tx.to;
    decodedParameters.actualAmount = Number(tx.value);
    decodedParameters.nativeValue = String(tx.value);
  }

  const normalizedAction =
    isNativeTransfer
      ? {
          action: "send",
          amount: Number(tx.value),
          recipient: tx.to,
          protocolAction: "native transfer"
        }
      : normalizeDecodedAction(
          decodedFunction,
          decodedParameters
        );

  if (
    decodedFunction.category === "universalRouter" &&
    !decodedParameters.valid
  ) {
    securityFlags.push(
      "Universal Router transaction could not be safely decoded."
    );
  }

  if (
    decodedFunction.category === "universalRouter" &&
    decodedParameters.allowRevert === true
  ) {
    securityFlags.push(
      "Universal Router command allows revert."
    );
  }

  const decodedAmount =
    normalizedAction.amount ??
    decodedParameters.rawWords?.[0] ??
    null;

  if (
    !contract &&
    decodedFunction.category !== "nativeTransfer"
  ) {
    securityFlags.push("Unknown contract");
  }

  if (
    decodedFunction.category === "unknown"
  ) {
    securityFlags.push("Unknown contract function");
  }

  if (
    decodedFunction.category === "approval" &&
    (
      decodedAmount === "MAX_UINT256" ||
      decodedParameters.unlimited === true ||
      decodedParameters.approved === true
    )
  ) {
    securityFlags.push("Dangerous token approval");
  }

  if (decodedFunction.category === "administration") {
    securityFlags.push("Dangerous administrative function");
  }

  if (tx.destinationAllowed === false) {
    securityFlags.push("Destination is not authorized");
  }

  if (
    Number(tx.chainId) !== Number(tx.expectedChainId)
  ) {
    securityFlags.push("Unexpected blockchain");
  }

  let parameterMatched = true;

  if (decodedFunction.category === "swap") {
    if (decodedParameters.valid === false) {
      parameterMatched = false;

      parameterFlags.push(
        decodedParameters.error ||
        "Swap parameters could not be verified"
      );
    } else if (
      decodedAmount !== null &&
      decodedAmount !== "MAX_UINT256"
    ) {
      const actual = Number(decodedAmount);
      const declared = Number(intent.amount);

      parameterMatched =
        Number.isFinite(actual) &&
        Number.isFinite(declared) &&
        actual === declared;

      if (!parameterMatched) {
        parameterFlags.push(
          "Actual transaction amount does not match declared intent"
        );
      }
    }
  }

  const malformedSwap =
    decodedFunction.category === "swap" &&
    decodedParameters.valid === false;

  if (malformedSwap) {
    securityFlags.push(
      decodedParameters.error ||
      "Invalid swap calldata"
    );
  }

  const transactionSecuritySafe =
    securityFlags.length === 0;

  const risk =
    securityFlags.includes("Dangerous token approval") ||
    securityFlags.includes("Dangerous administrative function")
      ? "CRITICAL"
      : securityFlags.length > 0 || parameterFlags.length > 0
        ? "HIGH"
        : "LOW";

  return {
    contractKnown: Boolean(contract),
    contractName: contract ? contract.name : "Unknown",
    protocol:
      decodedFunction.category === "universalRouter"
        ? "Uniswap"
        : decodedFunction.category === "nativeTransfer"
          ? "Native"
          : (
              decodedFunction.category === "approval" ||
              decodedFunction.category === "transfer"
            )
            ? "ERC20"
            : (contract ? contract.protocol : "Unknown"),

    decodedFunction,

    decodedParameters: {
      ...decodedParameters,
      firstUint256: decodedAmount,
      actualAmount:
        decodedAmount !== null &&
        decodedAmount !== "MAX_UINT256"
          ? Number(decodedAmount)
          : decodedAmount,
      declaredIntentAmount: Number(intent.amount),
      parameterMatched
    },

    normalizedAction,

    parameterFlags,
    securityFlags,
    transactionSecuritySafe,
    risk
  };
}


/*
 * AgentGuard Proof Specification Engine
 *
 * Converts an authorization decision into a deterministic,
 * prover-agnostic statement.
 *
 * This defines what the future ZK circuit must prove.
 */

function canonicalizeProofValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(canonicalizeProofValue);
  }

  if (typeof value === "object") {
    const result = {};

    for (const key of Object.keys(value).sort()) {
      result[key] = canonicalizeProofValue(value[key]);
    }

    return result;
  }

  return value;
}

function buildAuthorizationProofSpec({
  agent = null,
  transaction,
  intent,
  policy,
  analysis,
  decision
}) {
  const normalizedAction =
    analysis.normalizedAction || {};

  const decodedParameters =
    analysis.decodedParameters || {};

  const proofStatement = {
    version: "phorva-proof-v1",

    subject: {
      agent:
        agent ??
        intent?.agent ??
        transaction?.agent ??
        null
    },

    intent: {
      type: intent.type ?? null,
      chain: intent.chain ?? null,
      protocol: intent.protocol ?? null,
      asset: intent.asset ?? null,
      amount:
        intent.amount !== undefined
          ? String(intent.amount)
          : null
    },

    policy: {
      maxTransactionAmount:
        policy.maxTransactionAmount ??
        policy.maxTransaction ??
        null,

      dailyLimit:
        policy.dailyLimit ??
        null
    },

    action: {
      type:
        normalizedAction.action ??
        null,

      protocolAction:
        normalizedAction.protocolAction ??
        null,

      amount:
        decodedParameters.actualAmount ??
        normalizedAction.amount ??
        null,

      amountOutMin:
        normalizedAction.amountOutMin ??
        null,

      recipient:
        normalizedAction.recipient ??
        null,

      path:
        normalizedAction.path ??
        [],

      spender:
        normalizedAction.spender ??
        null
    },

    transaction: {
      chainId:
        transaction.chainId ??
        transaction.expectedChainId ??
        null,

      from:
        transaction.from ??
        null,

      to:
        transaction.to ??
        null,

      value:
        transaction.value ??
        "0",

      function:
        analysis.decodedFunction?.name ??
        null,

      selector:
        analysis.decodedFunction?.selector ??
        null
    },

    security: {
      policyPassed:
        decision.policyPassed === true,

      approvalAllowed:
        decision.approvalAllowed === true,

      velocityAllowed:
        decision.velocityAllowed === true,

      quarantineAllowed:
        decision.quarantineAllowed === true,

      intentMatched:
        decision.intentMatched === true,

      parameterMatched:
        decision.parameterMatched === true,

      executionTypeMatched:
        decision.executionTypeMatched === true,

      nativeValueMatched:
        decision.nativeValueMatched === true,

      protocolMatched:
        decision.protocolMatched === true,

      transactionSecuritySafe:
        decision.transactionSecuritySafe === true
    },

    decision:
      decision.authorized === true
        ? "AUTHORIZED"
        : "BLOCKED"
  };

  return canonicalizeProofValue(proofStatement);
}


/*
 * Phorva Execution Graph v1
 *
 * Represents an autonomous execution as an ordered,
 * hashable sequence of authorization decisions.
 *
 * This is intentionally prover-agnostic.
 * Future provers can prove properties over this graph.
 */

function buildExecutionNode({
  executionId,
  parentExecutionId = null,
  sequence,
  agent,
  intent,
  transaction,
  analysis,
  decision
}) {
  return canonicalizeProofValue({
    version: "agentguard-execution-v1",

    executionId:
      executionId ?? null,

    parentExecutionId:
      parentExecutionId ?? null,

    sequence:
      Number(sequence ?? 0),

    subject: {
      agent:
        agent ??
        intent?.agent ??
        transaction?.agent ??
        null
    },

    intent: {
      type:
        intent?.type ?? null,

      chain:
        intent?.chain ?? null,

      protocol:
        intent?.protocol ?? null,

      asset:
        intent?.asset ?? null,

      amount:
        intent?.amount !== undefined
          ? String(intent.amount)
          : null
    },

    action: {
      type:
        analysis?.normalizedAction?.action ??
        null,

      protocolAction:
        analysis?.normalizedAction?.protocolAction ??
        null,

      amount:
        analysis?.decodedParameters?.actualAmount ??
        analysis?.normalizedAction?.amount ??
        null,

      amountOutMin:
        analysis?.normalizedAction?.amountOutMin ??
        null,

      recipient:
        analysis?.normalizedAction?.recipient ??
        null,

      path:
        analysis?.normalizedAction?.path ??
        [],

      spender:
        analysis?.normalizedAction?.spender ??
        null
    },

    transaction: {
      chainId:
        transaction?.chainId ??
        transaction?.expectedChainId ??
        null,

      from:
        transaction?.from ??
        null,

      to:
        transaction?.to ??
        null,

      value:
        transaction?.value ??
        "0",

      function:
        analysis?.decodedFunction?.name ??
        null,

      selector:
        analysis?.decodedFunction?.selector ??
        null
    },

    authorization: {
      authorized:
        decision?.authorized === true,

      policyPassed:
        decision?.policyPassed === true,

      intentMatched:
        decision?.intentMatched === true,

      parameterMatched:
        decision?.parameterMatched === true,

      executionTypeMatched:
        decision?.executionTypeMatched === true,

      nativeValueMatched:
        decision?.nativeValueMatched === true,

      protocolMatched:
        decision?.protocolMatched === true,

      transactionSecuritySafe:
        decision?.transactionSecuritySafe === true
    }
  });
}


/*
 * Phorva Pure Execution Verification v1
 *
 * This function is the authoritative verifier for a
 * single raw execution record.
 *
 * It deliberately returns the same authorization
 * semantics used by /execution-graph.
 *
 * No verification receipt is consumed here.
 */

const AGENT_EXECUTION_WINDOWS = new Map();

function getAgentExecutionWindow(agentId, windowMs) {
  const now = Date.now();
  const key = String(agentId || "unknown");
  const existing = AGENT_EXECUTION_WINDOWS.get(key);

  if (
    !existing ||
    existing.windowMs !== windowMs ||
    now - existing.startedAt >= windowMs
  ) {
    const window = {
      startedAt: now,
      windowMs,
      count: 0,
      totalValue: 0
    };

    AGENT_EXECUTION_WINDOWS.set(key, window);
    return window;
  }

  return existing;
}


const AGENT_QUARANTINES = new Map();

function getAgentQuarantine(agentId) {
  const key = String(agentId || "unknown");
  return AGENT_QUARANTINES.get(key) || {
    quarantined: false,
    reason: null,
    triggeredAt: null
  };
}

function quarantineAgent(agentId, reason) {
  const key = String(agentId || "unknown");

  const state = {
    quarantined: true,
    reason: String(reason || "Security policy violation"),
    triggeredAt: Date.now()
  };

  AGENT_QUARANTINES.set(key, state);
  return state;
}

function clearAgentQuarantine(agentId) {
  const key = String(agentId || "unknown");
  AGENT_QUARANTINES.delete(key);
}

function verifyExecutionAuthorization({
  agent,
  action,
  intent,
  policy,
  transaction
}) {
  if (!agent || !action || !intent || !policy || !transaction) {
    throw new Error(
      "agent, action, intent, policy and transaction are required"
    );
  }

  const agentId =
    agent.id ?? agent.agentId ?? agent.name;

  if (agent.revoked_at) {
    throw new Error(
      "Agent is revoked"
    );
  }

  const quarantineState =
    getAgentQuarantine(agentId);

  const analysis = analyzeTransaction(transaction, intent);
  const decodedParameters = analysis.decodedParameters || {};
  const normalizedAction = analysis.normalizedAction || {};

  const effectiveAction = {
    ...action,
    type:
      normalizedAction.action ??
      action.type,
    chain:
      action.chain ??
      transaction.chainId ??
      transaction.expectedChainId,
    protocol:
      action.protocol ??
      analysis.protocol,
    asset:
      action.asset ??
      normalizedAction.asset ??
      normalizedAction.assetAddress ??
      normalizedAction.tokenIn
  };

  const decodedActualAmount =
    decodedParameters.actualAmount ??
    decodedParameters.amount;

  const actualTransactionAmount =
    Number.isFinite(Number(decodedActualAmount))
      ? Number(decodedActualAmount)
      : Number(transaction.amount);

  const maximum =
    Number(
      policy.maxTransactionAmount ??
      policy.maxTransaction
    );

  const dailyLimitRaw = policy.dailyLimit;

  const dailyLimit =
    dailyLimitRaw === undefined ||
    dailyLimitRaw === null ||
    dailyLimitRaw === ""
      ? Infinity
      : Number(dailyLimitRaw);

  const maxTransactionsPerWindowRaw =
    policy.maxTransactionsPerWindow;

  const maxTransactionsPerWindow =
    maxTransactionsPerWindowRaw === undefined ||
    maxTransactionsPerWindowRaw === null ||
    maxTransactionsPerWindowRaw === ""
      ? Infinity
      : Number(maxTransactionsPerWindowRaw);

  const maxValuePerWindowRaw =
    policy.maxValuePerWindow;

  const maxValuePerWindow =
    maxValuePerWindowRaw === undefined ||
    maxValuePerWindowRaw === null ||
    maxValuePerWindowRaw === ""
      ? Infinity
      : Number(maxValuePerWindowRaw);

  const velocityWindowMsRaw =
    policy.velocityWindowMs;

  const velocityWindowMs =
    velocityWindowMsRaw === undefined ||
    velocityWindowMsRaw === null ||
    velocityWindowMsRaw === ""
      ? 60000
      : Number(velocityWindowMsRaw);

  const velocityConfigured =
    (
      Number.isFinite(maxTransactionsPerWindow) &&
      maxTransactionsPerWindow !== Infinity
    ) ||
    (
      Number.isFinite(maxValuePerWindow) &&
      maxValuePerWindow !== Infinity
    );

  const executionWindow =
    velocityConfigured &&
    Number.isFinite(velocityWindowMs) &&
    velocityWindowMs > 0
      ? getAgentExecutionWindow(
          agent.id ?? agent.agentId ?? agent.name,
          velocityWindowMs
        )
      : null;

  const velocityValueAllowed =
    !executionWindow ||
    !Number.isFinite(maxValuePerWindow) ||
    (
      Number.isFinite(actualTransactionAmount) &&
      executionWindow.totalValue + actualTransactionAmount <=
        maxValuePerWindow
    );

  const velocityAllowed =
    (!executionWindow ||
      executionWindow.count < maxTransactionsPerWindow) &&
    velocityValueAllowed;

  const quarantineOnVelocityViolation =
    policy.quarantineOnVelocityViolation === true;

  if (
    quarantineOnVelocityViolation &&
    !velocityAllowed
  ) {
    quarantineAgent(
      agentId,
      "Velocity policy violation"
    );
  }

  const quarantineOnCriticalRisk =
    policy.quarantineOnCriticalRisk === true;

  if (
    quarantineOnCriticalRisk &&
    analysis.risk === "CRITICAL"
  ) {
    quarantineAgent(
      agentId,
      "Critical transaction risk"
    );
  }

  const policyPassed =
    Number.isFinite(actualTransactionAmount) &&
    Number.isFinite(maximum) &&
    actualTransactionAmount <= maximum &&
    actualTransactionAmount <= dailyLimit;

  const hasRegisteredCapabilities =
    Array.isArray(agent.capabilities);

  const registeredCapabilities =
    hasRegisteredCapabilities
      ? agent.capabilities.map(
          value => String(value || "").toLowerCase()
        )
      : [];

  const capabilityAllowed =
    hasRegisteredCapabilities
      ? (
          isAgentCapabilityAllowed(intent.type) &&
          registeredCapabilities.includes(
            String(intent.type || "").toLowerCase()
          )
        )
      : isAgentCapabilityAllowed(intent.type);

  const targetAllowed =
    isPolicyTargetAllowed(
      transaction,
      policy
    );

  const selectorAllowed =
    isPolicySelectorAllowed(
      transaction,
      policy
    );

  const approvalAllowed =
    isPolicyApprovalAllowed(
      analysis.decodedFunction,
      decodedParameters,
      policy
    );

  const isNativeTransfer =
    analysis.decodedFunction?.category ===
    "nativeTransfer";

  const actionTypeMatches =
    effectiveAction.type === intent.type ||
    (
      isNativeTransfer &&
      (
        (effectiveAction.type === "send" &&
          intent.type === "transfer") ||
        (effectiveAction.type === "transfer" &&
          intent.type === "send")
      )
    );

  const chainMatches =
    intent.chain === undefined ||
    intent.chain === null ||
    intent.chain === "" ||
    String(effectiveAction.chain) === String(intent.chain);

  const protocolMatches =
    intent.protocol === undefined ||
    intent.protocol === null ||
    intent.protocol === "" ||
    effectiveAction.protocol === intent.protocol;

  const assetMatches =
    intent.asset === undefined ||
    intent.asset === null ||
    intent.asset === "" ||
    effectiveAction.asset === intent.asset;

  const intentMatched =
    actionTypeMatches &&
    chainMatches &&
    protocolMatches &&
    assetMatches;

  const protocolMatched =
    analysis.protocol === intent.protocol ||
    (
      analysis.decodedFunction?.category === "nativeTransfer" &&
      (intent.protocol === undefined ||
        intent.protocol === null ||
        intent.protocol === "")
    );

  const normalizeVerifierAddress = value =>
    typeof value === "string"
      ? value.toLowerCase()
      : value;

  const expectedRecipient =
    intent.recipient ??
    intent.destination;

  const actualRecipient =
    decodedParameters.recipient ??
    normalizedAction.recipient ??
    null;

  const recipientMatched =
    expectedRecipient === undefined ||
    expectedRecipient === null ||
    expectedRecipient === "" ||
    (
      actualRecipient &&
      normalizeVerifierAddress(actualRecipient) ===
        normalizeVerifierAddress(expectedRecipient)
    );

  const expectedPath =
    Array.isArray(intent.path)
      ? intent.path.map(normalizeVerifierAddress)
      : null;

  const actualPath =
    Array.isArray(decodedParameters.path)
      ? decodedParameters.path.map(normalizeVerifierAddress)
      : (
          Array.isArray(normalizedAction.path)
            ? normalizedAction.path.map(normalizeVerifierAddress)
            : null
        );

  const pathMatched =
    expectedPath === null ||
    (
      actualPath &&
      actualPath.length === expectedPath.length &&
      actualPath.every(
        (address, index) =>
          address === expectedPath[index]
      )
    );

  const expectedAssetAddress =
    intent.assetAddress;

  const actualAssetAddress =
    action.type === "approval" ||
    action.type === "transfer"
      ? transaction.to
      : (
          Array.isArray(decodedParameters.path) &&
          decodedParameters.path.length > 0
            ? decodedParameters.path[0]
            : (
                decodedParameters.tokenIn ??
                decodedParameters.assetAddress ??
                normalizedAction.assetAddress ??
                normalizedAction.tokenIn ??
                null
              )
        );

  const assetAddressMatched =
    expectedAssetAddress === undefined ||
    expectedAssetAddress === null ||
    expectedAssetAddress === "" ||
    (
      actualAssetAddress &&
      normalizeVerifierAddress(actualAssetAddress) ===
        normalizeVerifierAddress(expectedAssetAddress)
    );

  const expectedSpender =
    intent.spender;

  const actualSpender =
    decodedParameters.spender ??
    normalizedAction.spender ??
    null;

  const spenderMatched =
    expectedSpender === undefined ||
    expectedSpender === null ||
    expectedSpender === "" ||
    (
      actualSpender &&
      normalizeVerifierAddress(actualSpender) ===
        normalizeVerifierAddress(expectedSpender)
    );

  const expectedAmountOutMin =
    intent.amountOutMin;

  const actualAmountOutMin =
    decodedParameters.amountOutMin ??
    normalizedAction.amountOutMin;

  const amountOutMinMatched =
    expectedAmountOutMin === undefined ||
    expectedAmountOutMin === null ||
    (
      actualAmountOutMin !== undefined &&
      actualAmountOutMin !== null &&
      Number(actualAmountOutMin) ===
        Number(expectedAmountOutMin)
    );

  const expectedPayerIsUser =
    intent.payerIsUser;

  const actualPayerIsUser =
    decodedParameters.payerIsUser ??
    normalizedAction.payerIsUser;

  const payerIsUserMatched =
    expectedPayerIsUser === undefined ||
    expectedPayerIsUser === null ||
    actualPayerIsUser === expectedPayerIsUser;

  const expectedAllowRevert =
    intent.allowRevert;

  const actualAllowRevert =
    decodedParameters.allowRevert ??
    normalizedAction.allowRevert;

  const allowRevertMatched =
    expectedAllowRevert === undefined ||
    expectedAllowRevert === null ||
    actualAllowRevert === expectedAllowRevert;

  const isApprovalAction =
    action.type === "approval";

  const isTransferAction =
    action.type === "transfer";

  const decodedParameterAmount =
    Number(
      decodedParameters.actualAmount ??
      decodedParameters.amount
    );

  const intentParameterAmount =
    Number(intent.amount);

  const amountParameterMatched =
    Number.isFinite(decodedParameterAmount) &&
    Number.isFinite(intentParameterAmount) &&
    decodedParameterAmount === intentParameterAmount;

  const parameterMatched =
    amountParameterMatched &&
    assetAddressMatched &&
    (
      isApprovalAction
        ? spenderMatched
        : isTransferAction
          ? recipientMatched
          : (
              spenderMatched &&
              recipientMatched &&
              pathMatched &&
              amountOutMinMatched &&
              payerIsUserMatched &&
              allowRevertMatched
            )
    );

  const transactionSecuritySafe =
    analysis.transactionSecuritySafe;

  const executionCapability =
    getVerifiedExecutionCapability(intent.type);

  const executionTypeMatched =
    verifyExecutionType(intent, analysis);

  const actualNativeValue =
    String(transaction.value ?? "0");

  const expectedNativeValue =
    String(
      intent.nativeValue ??
      intent.value ??
      "0"
    );

  const nativeValueMatched =
    actualNativeValue === expectedNativeValue;

  const quarantineAllowed =
    quarantineState.quarantined !== true;

  const authorized =
    policyPassed &&
    velocityAllowed &&
    quarantineAllowed &&
    capabilityAllowed &&
    targetAllowed &&
    selectorAllowed &&
    approvalAllowed &&
    intentMatched &&
    parameterMatched &&
    executionTypeMatched &&
    nativeValueMatched &&
    protocolMatched &&
    transactionSecuritySafe;

  if (authorized && executionWindow) {
    executionWindow.count += 1;
    executionWindow.totalValue += actualTransactionAmount;
  }

  return {
    authorized,
    policyPassed,
    velocityAllowed,
    quarantineAllowed,
    quarantineState,
    capabilityAllowed,
    targetAllowed,
    selectorAllowed,
    approvalAllowed,
    intentMatched,
    parameterMatched,
    executionTypeMatched,
    executionCapability,
    nativeValueMatched,
    protocolMatched,
    transactionSecuritySafe,

    analysis,
    actualTransactionAmount,

    parameterChecks: {
      amountParameterMatched,
      recipientMatched,
      pathMatched,
      assetAddressMatched,
      spenderMatched,
      amountOutMinMatched,
      payerIsUserMatched,
      allowRevertMatched
    },

    expectedNativeValue,
    actualNativeValue,

    expectedAssetAddress:
      expectedAssetAddress ?? null,

    actualAssetAddress:
      actualAssetAddress ?? null
  };
}

function buildVerificationTrace({
  verification
}) {
  if (!verification) {
    throw new Error(
      "verification is required"
    );
  }

  const checks =
    verification.parameterChecks || {};

  const analysis =
    verification.analysis || {};

  const trace = [
    {
      id: "agent_identity",
      category: "identity",
      passed: true,
      message:
        "Agent identity supplied to the verification request."
    },

    {
      id: "intent",
      category: "intent",
      passed:
        verification.intentMatched === true,
      message:
        verification.intentMatched === true
          ? "Action matches the declared intent."
          : "Action does not match the declared intent."
    },

    {
      id: "policy",
      category: "policy",
      passed:
        verification.policyPassed === true,
      message:
        verification.policyPassed === true
          ? "Transaction satisfies the configured spending policy."
          : "Transaction exceeds the configured spending policy."
    },

    {
      id: "amount",
      category: "parameters",
      passed:
        checks.amountParameterMatched === true,
      message:
        checks.amountParameterMatched === true
          ? "Decoded transaction amount matches the declared intent amount."
          : "Decoded transaction amount does not match the declared intent amount."
    },

    {
      id: "asset_identity",
      category: "parameters",
      passed:
        checks.assetAddressMatched === true,
      message:
        checks.assetAddressMatched === true
          ? "Transaction asset matches the authorized asset."
          : "Transaction asset does not match the authorized asset."
    },

    {
      id: "spender",
      category: "parameters",
      passed:
        checks.spenderMatched === true,
      message:
        checks.spenderMatched === true
          ? "Spender matches the authorized spender."
          : "Spender does not match the authorized spender."
    },

    {
      id: "recipient",
      category: "parameters",
      passed:
        checks.recipientMatched === true,
      message:
        checks.recipientMatched === true
          ? "Recipient matches the authorized recipient."
          : "Recipient does not match the authorized recipient."
    },

    {
      id: "path",
      category: "parameters",
      passed:
        checks.pathMatched === true,
      message:
        checks.pathMatched === true
          ? "Token path matches the authorized path."
          : "Token path does not match the authorized path."
    },

    {
      id: "amount_out_min",
      category: "parameters",
      passed:
        checks.amountOutMinMatched === true,
      message:
        checks.amountOutMinMatched === true
          ? "Minimum output amount matches the authorized constraint."
          : "Minimum output amount does not match the authorized constraint."
    },

    {
      id: "payer",
      category: "parameters",
      passed:
        checks.payerIsUserMatched === true,
      message:
        checks.payerIsUserMatched === true
          ? "Payer matches the authorized payer constraint."
          : "Payer does not match the authorized payer constraint."
    },

    {
      id: "allow_revert",
      category: "parameters",
      passed:
        checks.allowRevertMatched === true,
      message:
        checks.allowRevertMatched === true
          ? "Execution revert behavior matches the authorized constraint."
          : "Execution revert behavior does not match the authorized constraint."
    },

    {
      id: "execution_type",
      category: "execution",
      passed:
        verification.executionTypeMatched === true,
      message:
        verification.executionTypeMatched === true
          ? "Actual blockchain execution type matches the authorized intent."
          : "Actual blockchain execution type does not match the authorized intent."
    },

    {
      id: "native_value",
      category: "execution",
      passed:
        verification.nativeValueMatched === true,
      message:
        verification.nativeValueMatched === true
          ? "Attached native value matches the authorized value."
          : "Attached native value does not match the authorized value."
    },

    {
      id: "protocol",
      category: "protocol",
      passed:
        verification.protocolMatched === true,
      message:
        verification.protocolMatched === true
          ? "Transaction targets the authorized protocol."
          : "Transaction targets a different protocol."
    },

    {
      id: "transaction_security",
      category: "security",
      passed:
        verification.transactionSecuritySafe === true,
      message:
        verification.transactionSecuritySafe === true
          ? "No transaction-security threat was detected."
          : "Transaction-security analysis detected a threat."
    }
  ];

  /*
   * Approval actions intentionally do not require the
   * swap-only checks to determine authorization.
   *
   * Mark those checks as not applicable rather than
   * incorrectly presenting them as failed.
   */
  const isApproval =
    analysis.normalizedAction?.action === "approval";

  const isTransfer =
    analysis.normalizedAction?.action === "transfer";

  if (isApproval || isTransfer) {
    const notApplicableChecks = isApproval
      ? [
          "recipient",
          "path",
          "amount_out_min",
          "payer",
          "allow_revert"
        ]
      : [
          "spender",
          "path",
          "amount_out_min",
          "payer",
          "allow_revert"
        ];

    for (const id of notApplicableChecks) {
      const check =
        trace.find(item => item.id === id);

      if (check) {
        check.applicable = false;
        check.passed = true;
        check.message =
          "Not applicable to approval execution.";
      }
    }
  }

  for (const check of trace) {
    if (check.applicable === undefined) {
      check.applicable = true;
    }
  }

  const passedChecks =
    trace.filter(
      check =>
        check.applicable &&
        check.passed
    ).length;

  const failedChecks =
    trace.filter(
      check =>
        check.applicable &&
        !check.passed
    ).length;

  const applicableChecks =
    trace.filter(
      check =>
        check.applicable
    ).length;

  return canonicalizeProofValue({
    version:
      "phorva-verification-trace-v1",

    checks: trace,

    summary: {
      total:
        applicableChecks,

      passed:
        passedChecks,

      failed:
        failedChecks
    },

    decision:
      verification.authorized
        ? "AUTHORIZED"
        : "BLOCKED"
  });
}

function verifyRawExecution({
  execution,
  index = 0,
  previousExecutionId = null
}) {
  const {
    executionId,
    parentExecutionId,
    agent,
    action,
    intent,
    policy,
    transaction
  } = execution || {};

  const verification =
    verifyExecutionAuthorization({
      agent,
      action,
      intent,
      policy,
      transaction
    });

  const decision = {
    authorized:
      verification.authorized,

    policyPassed:
      verification.policyPassed,

    intentMatched:
      verification.intentMatched,

    parameterMatched:
      verification.parameterMatched,

    executionTypeMatched:
      verification.executionTypeMatched,

    nativeValueMatched:
      verification.nativeValueMatched,

    protocolMatched:
      verification.protocolMatched,

    transactionSecuritySafe:
      verification.transactionSecuritySafe,

    parameterChecks:
      verification.parameterChecks
  };

  return {
    executionId:
      executionId ??
      `execution-${index + 1}`,

    parentExecutionId:
      parentExecutionId ??
      (
        index === 0
          ? null
          : previousExecutionId
      ),

    sequence:
      execution.sequence ??
      index,

    agent,
    intent,
    transaction,

    analysis:
      verification.analysis,

    decision
  };
}


function verifyRawExecutions({
  executions
}) {
  if (
    !Array.isArray(executions) ||
    executions.length === 0
  ) {
    throw new Error(
      "executions must be a non-empty array"
    );
  }

  const nodes = [];

  for (let i = 0; i < executions.length; i++) {
    const node =
      verifyRawExecution({
        execution:
          executions[i],
        index: i,
        previousExecutionId:
          nodes[i - 1]?.executionId ??
          null
      });

    nodes.push(node);
  }

  const graph =
    buildExecutionGraph({
      executions: nodes
    });

  const commitment =
    createExecutionGraphCommitment(
      graph
    );

  const allExecutionsAuthorized =
    nodes.every(
      node =>
        node.decision.authorized === true
    );

  const sequenceValid =
    nodes.every(
      (node, index) =>
        node.sequence === index &&
        (
          index === 0
            ? node.parentExecutionId === null
            : node.parentExecutionId ===
              nodes[index - 1]?.executionId
        )
    );

  const graphInvariants =
    verifyExecutionGraphInvariants(
      nodes
    );

  return {
    nodes,
    graph,
    commitment,

    authorization: {
      decision:
        allExecutionsAuthorized &&
        sequenceValid &&
        graphInvariants.valid
          ? "AUTHORIZED"
          : "BLOCKED",

      allExecutionsAuthorized,
      sequenceValid,
      graphInvariantsValid:
        graphInvariants.valid,

      violations:
        graphInvariants.violations
    }
  };
}


function buildExecutionGraph({
  executions = []
}) {
  const nodes = executions.map((execution, index) =>
    buildExecutionNode({
      ...execution,
      sequence:
        execution.sequence ??
        index
    })
  );

  return canonicalizeProofValue({
    version: "agentguard-execution-graph-v1",
    nodes
  });
}

function createExecutionGraphCommitment(graph) {
  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(graph)
    );

  const commitment =
    crypto
      .createHash("sha256")
      .update(canonicalJson, "utf8")
      .digest("hex");

  return {
    algorithm: "SHA-256",
    commitment: "0x" + commitment,
    canonicalJson
  };
}

function buildProofClaims(proofStatement) {
  return {
    version:
      proofStatement.version,

    claim:
      "AGENT_ACTION_AUTHORIZED",

    decision:
      proofStatement.decision,

    policySatisfied:
      proofStatement.security.policyPassed,

    approvalSatisfied:
      proofStatement.security.approvalAllowed,

    velocitySatisfied:
      proofStatement.security.velocityAllowed === true,

    quarantineSatisfied:
      proofStatement.security.quarantineAllowed === true,

    intentSatisfied:
      proofStatement.security.intentMatched,

    parametersSatisfied:
      proofStatement.security.parameterMatched,

    executionTypeSatisfied:
      proofStatement.security.executionTypeMatched,

    nativeValueSatisfied:
      proofStatement.security.nativeValueMatched,

    protocolSatisfied:
      proofStatement.security.protocolMatched,

    transactionSecuritySatisfied:
      proofStatement.security.transactionSecuritySafe,

    action:
      proofStatement.action,

    transaction:
      proofStatement.transaction
  };
}



function createProofCommitment(proofStatement) {
  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(proofStatement)
    );

  const commitment =
    crypto
      .createHash("sha256")
      .update(canonicalJson, "utf8")
      .digest("hex");

  return {
    algorithm: "SHA-256",
    commitment: "0x" + commitment,
    canonicalJson
  };
}



/*
 * Phorva Execution Graph API
 *
 * Builds a deterministic graph from a sequence of
 * autonomous execution records.
 *
 * This does not replace /authorize.
 * Each execution can still be evaluated independently.
 */


/*
 * Execution Graph Security Invariants v1
 *
 * These rules verify the integrity of the autonomous
 * execution sequence itself, rather than only individual
 * transactions.
 */

function buildExecutionIntentFingerprint(intent) {
  return JSON.stringify(
    canonicalizeProofValue({
      type: intent?.type ?? null,
      chain: intent?.chain ?? null,
      protocol: intent?.protocol ?? null,
      asset: intent?.asset ?? null,
      amount:
        intent?.amount !== undefined
          ? String(intent.amount)
          : null
    })
  );
}

function verifyExecutionGraphInvariants(nodes) {
  const violations = [];

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      valid: false,
      violations: ["Execution graph is empty"]
    };
  }

  const first = nodes[0];

  const expectedAgent =
    first.agent ??
    first.intent?.agent ??
    first.transaction?.agent ??
    null;

  const expectedIntent =
    buildExecutionIntentFingerprint(
      first.intent
    );

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    /*
     * 1. Sequence continuity
     */
    if (node.sequence !== i) {
      violations.push(
        `Invalid sequence at execution ${i}`
      );
    }

    /*
     * 2. Agent continuity
     */
    const nodeAgent =
      node.agent ??
      node.intent?.agent ??
      node.transaction?.agent ??
      null;

    if (nodeAgent !== expectedAgent) {
      violations.push(
        `Agent continuity violation at execution ${i}`
      );
    }

    /*
     * 3. Intent continuity
     */
    const nodeIntent =
      buildExecutionIntentFingerprint(
        node.intent
      );

    if (nodeIntent !== expectedIntent) {
      violations.push(
        `Intent continuity violation at execution ${i}`
      );
    }

    /*
     * 4. Parent continuity
     */
    const expectedParent =
      i === 0
        ? null
        : nodes[i - 1].executionId;

    if (
      node.parentExecutionId !==
      expectedParent
    ) {
      violations.push(
        `Parent continuity violation at execution ${i}`
      );
    }

    /*
     * 5. Blocked execution cannot be followed
     *    by another execution.
     */
    if (
      i > 0 &&
      nodes[i - 1].decision?.authorized !== true
    ) {
      violations.push(
        `Execution ${i} follows a blocked execution`
      );
    }
  }

  return {
    valid:
      violations.length === 0,

    violations
  };
}


/*
 * Phorva Final-State Verification v1
 *
 * Verifies that an execution graph reaches the state
 * required by the original autonomous objective.
 *
 * V1 uses explicit declared final-state claims.
 * Future versions can derive these claims from
 * blockchain state and execution receipts.
 */

function buildFinalStateClaim(finalState) {
  return canonicalizeProofValue({
    asset:
      finalState?.asset ?? null,

    assetAddress:
      finalState?.assetAddress ?? null,

    amount:
      finalState?.amount !== undefined
        ? String(finalState.amount)
        : null,

    destination:
      finalState?.destination ?? null,

    protocol:
      finalState?.protocol ?? null,

    status:
      finalState?.status ?? null
  });
}

function verifyFinalState({
  intent,
  finalState,
  expectedFinalState
}) {
  const violations = [];

  if (!finalState) {
    return {
      satisfied: false,
      violations: [
        "Final state is missing"
      ]
    };
  }

  if (!expectedFinalState) {
    return {
      satisfied: false,
      violations: [
        "Expected final state is missing"
      ]
    };
  }

  const actual =
    buildFinalStateClaim(
      finalState
    );

  const expected =
    buildFinalStateClaim(
      expectedFinalState
    );

  /*
   * Asset verification
   */
  if (
    expected.asset !== null &&
    actual.asset !== expected.asset
  ) {
    violations.push(
      "Final-state asset does not match the authorized objective"
    );
  }

  /*
   * Asset identity verification
   */
  if (
    expected.assetAddress !== null &&
    actual.assetAddress !==
      expected.assetAddress
  ) {
    violations.push(
      "Final-state asset address does not match the authorized objective"
    );
  }

  /*
   * Destination verification
   */
  if (
    expected.destination !== null &&
    actual.destination !==
      expected.destination
  ) {
    violations.push(
      "Final-state destination does not match the authorized objective"
    );
  }

  /*
   * Protocol verification
   */
  if (
    expected.protocol !== null &&
    actual.protocol !== expected.protocol
  ) {
    violations.push(
      "Final-state protocol does not match the authorized objective"
    );
  }

  /*
   * Amount verification
   *
   * V1 requires an exact amount when an expected
   * amount is supplied.
   */
  if (
    expected.amount !== null &&
    actual.amount !== expected.amount
  ) {
    violations.push(
      "Final-state amount does not match the authorized objective"
    );
  }

  /*
   * Explicit status verification
   */
  if (
    expected.status !== null &&
    actual.status !== expected.status
  ) {
    violations.push(
      "Final-state status does not satisfy the objective"
    );
  }

  return {
    satisfied:
      violations.length === 0,

    violations,

    expected: expected,
    actual: actual,

    intent:
      canonicalizeProofValue({
        type: intent?.type ?? null,
        chain: intent?.chain ?? null,
        protocol: intent?.protocol ?? null,
        asset: intent?.asset ?? null,
        amount:
          intent?.amount !== undefined
            ? String(intent.amount)
            : null
      })
  };
}

function createFinalStateCommitment({
  graphCommitment,
  finalState,
  verification
}) {
  const statement =
    canonicalizeProofValue({
      version:
        "agentguard-final-state-v1",

      graphCommitment:
        graphCommitment ?? null,

      finalState,

      verification
    });

  const canonicalJson =
    JSON.stringify(statement);

  const commitment =
    crypto
      .createHash("sha256")
      .update(canonicalJson, "utf8")
      .digest("hex");

  return {
    algorithm: "SHA-256",
    commitment: "0x" + commitment,
    statement,
    canonicalJson
  };
}


function verifyCanonicalExecutionGraphInvariants(
  executionGraph
) {
  const nodes =
    executionGraph?.nodes;

  const violations = [];

  if (
    !Array.isArray(nodes) ||
    nodes.length === 0
  ) {
    return {
      valid: false,
      violations: [
        "Execution graph is empty"
      ]
    };
  }

  const first = nodes[0];

  const expectedAgent =
    first?.subject?.agent ??
    null;

  const expectedIntent =
    buildExecutionIntentFingerprint(
      first?.intent
    );

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    /*
     * 1. Sequence continuity
     */
    if (node?.sequence !== i) {
      violations.push(
        `Invalid sequence at execution ${i}`
      );
    }

    /*
     * 2. Agent continuity
     *
     * Canonical execution graph stores the
     * agent under subject.agent.
     */
    const nodeAgent =
      node?.subject?.agent ??
      null;

    if (nodeAgent !== expectedAgent) {
      violations.push(
        `Agent continuity violation at execution ${i}`
      );
    }

    /*
     * 3. Intent continuity
     */
    const nodeIntent =
      buildExecutionIntentFingerprint(
        node?.intent
      );

    if (nodeIntent !== expectedIntent) {
      violations.push(
        `Intent continuity violation at execution ${i}`
      );
    }

    /*
     * 4. Parent continuity
     */
    const expectedParent =
      i === 0
        ? null
        : nodes[i - 1]?.executionId;

    if (
      node?.parentExecutionId !==
      expectedParent
    ) {
      violations.push(
        `Parent continuity violation at execution ${i}`
      );
    }

    /*
     * 5. A blocked execution cannot be
     *    followed by another execution.
     */
    if (
      i > 0 &&
      nodes[i - 1]?.authorization?.authorized !==
        true
    ) {
      violations.push(
        `Execution ${i} follows a blocked execution`
      );
    }
  }

  return {
    valid:
      violations.length === 0,

    violations
  };
}


function derivePhorvaAuthorization({
  executionGraph,
  finalStateVerification = null
}) {
  const nodes =
    executionGraph?.nodes;

  if (
    !Array.isArray(nodes) ||
    nodes.length === 0
  ) {
    throw new Error(
      "executionGraph.nodes must be a non-empty array"
    );
  }

  /*
   * IMPORTANT:
   *
   * executionGraph is the canonical
   * agentguard-execution-graph-v1 representation.
   *
   * It is NOT the raw execution-node structure
   * consumed by verifyExecutionGraphInvariants().
   *
   * Therefore canonical graphs must be verified
   * using their own representation-aware verifier.
   */

  const allExecutionsAuthorized =
    nodes.every(
      node =>
        node?.authorization?.authorized === true
    );

  const sequenceValid =
    nodes.every(
      (node, index) =>
        node?.sequence === index &&
        (
          index === 0
            ? node?.parentExecutionId === null
            : node?.parentExecutionId ===
              nodes[index - 1]?.executionId
        )
    );

  const graphInvariants =
    verifyCanonicalExecutionGraphInvariants(
      executionGraph
    );

  let finalStateSatisfied = true;

  if (finalStateVerification !== null) {
    const actual =
      finalStateVerification?.actual ?? null;

    const expected =
      finalStateVerification?.expected ?? null;

    if (!actual || !expected) {
      finalStateSatisfied = false;
    } else {
      const recomputed =
        verifyFinalState({
          intent:
            finalStateVerification?.intent ??
            null,

          finalState:
            actual,

          expectedFinalState:
            expected
        });

      finalStateSatisfied =
        recomputed.satisfied === true;
    }
  }

  const authorized =
    allExecutionsAuthorized &&
    sequenceValid &&
    graphInvariants.valid &&
    finalStateSatisfied;

  return {
    decision:
      authorized
        ? "AUTHORIZED"
        : "BLOCKED",

    allExecutionsAuthorized,

    sequenceValid,

    graphInvariantsValid:
      graphInvariants.valid,

    finalStateSatisfied,

    violations:
      graphInvariants.violations
  };
}


/*
 * Phorva Verification Receipt v1
 *
 * A verification receipt cryptographically binds a
 * canonical execution graph to the authorization result
 * produced by Phorva.
 *
 * The receipt is NOT a user assertion.
 * It is an authenticated server-side verification artifact.
 */

const PHORVA_VERIFICATION_SECRET =
  process.env.PHORVA_VERIFICATION_SECRET ||
  crypto.randomBytes(32).toString("hex");

if (process.env.NODE_ENV === "production") {
  if (
    !process.env.PHORVA_VERIFICATION_SECRET ||
    process.env.PHORVA_VERIFICATION_SECRET.length < 32
  ) {
    throw new Error(
      "PHORVA_VERIFICATION_SECRET must be configured with at least 32 characters in production"
    );
  }

  const productionOrigins =
    String(process.env.PHORVA_ALLOWED_ORIGINS || "")
      .split(",")
      .map(origin => origin.trim())
      .filter(Boolean);

  if (productionOrigins.length === 0) {
    throw new Error(
      "PHORVA_ALLOWED_ORIGINS must be configured in production"
    );
  }

  if (
    productionOrigins.some(
      origin =>
        !origin.startsWith("https://")
    )
  ) {
    throw new Error(
      "Production allowed origins must use HTTPS"
    );
  }
}

function createPhorvaVerificationReceipt({
  executionGraph,
  executionGraphCommitment,
  authorization
}) {
  if (!executionGraph) {
    throw new Error(
      "executionGraph is required"
    );
  }

  if (!executionGraphCommitment?.commitment) {
    throw new Error(
      "executionGraphCommitment.commitment is required"
    );
  }

  if (!authorization) {
    throw new Error(
      "verified authorization is required"
    );
  }

  const payload =
    canonicalizeProofValue({
      version:
        "phorva-verification-receipt-v1",

      graphCommitment:
        executionGraphCommitment.commitment,

      graphAlgorithm:
        executionGraphCommitment.algorithm ??
        "SHA-256",

      authorization
    });

  const canonicalJson =
    JSON.stringify(payload);

  const signature =
    crypto
      .createHmac(
        "sha256",
        PHORVA_VERIFICATION_SECRET
      )
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  return {
    version:
      "phorva-verification-receipt-v1",

    graphCommitment:
      executionGraphCommitment.commitment,

    graphAlgorithm:
      executionGraphCommitment.algorithm ??
      "SHA-256",

    authorization:
      canonicalizeProofValue(
        authorization
      ),

    algorithm:
      "HMAC-SHA256",

    signature:
      "0x" + signature
  };
}


function verifyPhorvaVerificationReceipt({
  executionGraph,
  executionGraphCommitment,
  receipt
}) {
  if (!receipt) {
    return {
      valid: false,
      error:
        "verificationReceipt is required"
    };
  }

  if (
    receipt.version !==
    "phorva-verification-receipt-v1"
  ) {
    return {
      valid: false,
      error:
        "Unsupported verification receipt version"
    };
  }

  if (
    receipt.algorithm !==
    "HMAC-SHA256"
  ) {
    return {
      valid: false,
      error:
        "Unsupported verification receipt algorithm"
    };
  }

  if (!receipt.signature) {
    return {
      valid: false,
      error:
        "verificationReceipt.signature is required"
    };
  }

  if (
    receipt.graphCommitment !==
    executionGraphCommitment?.commitment
  ) {
    return {
      valid: false,
      error:
        "Verification receipt graph commitment mismatch"
    };
  }

  const payload =
    canonicalizeProofValue({
      version:
        "phorva-verification-receipt-v1",

      graphCommitment:
        executionGraphCommitment.commitment,

      graphAlgorithm:
        executionGraphCommitment.algorithm ??
        "SHA-256",

      authorization:
        receipt.authorization ?? null
    });

  const canonicalJson =
    JSON.stringify(payload);

  const expectedSignature =
    "0x" +
    crypto
      .createHmac(
        "sha256",
        PHORVA_VERIFICATION_SECRET
      )
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  const valid =
    receipt.signature ===
    expectedSignature;

  return {
    valid,

    authorization:
      receipt.authorization ?? null,

    graphCommitment:
      receipt.graphCommitment,

    algorithm:
      receipt.algorithm,

    expectedSignature,
    actualSignature:
      receipt.signature
  };
}



function createVerificationTraceCommitment(
  verificationTrace
) {
  if (!verificationTrace) {
    return null;
  }

  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(
        verificationTrace
      )
    );

  const commitment =
    crypto
      .createHash("sha256")
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  return {
    algorithm: "SHA-256",
    commitment: "0x" + commitment,
    canonicalJson
  };
}

function buildPhorvaProofStatement({
  agent = null,
  intent,
  executionGraph,
  executionGraphCommitment,
  finalStateVerification,
  finalStateCommitment,
  authorization,
  verifiedAuthorization = null,
  verificationTrace = null,
  verificationTraceCommitment = null
}) {
  const derivedAuthorization =
    verifiedAuthorization ??
    derivePhorvaAuthorization({
      executionGraph,
      finalStateVerification:
        finalStateVerification ?? null
    });

  /*
   * Caller-supplied authorization is treated as
   * an assertion, never as the source of truth.
   *
   * If supplied, every authorization field must
   * agree with Phorva's independently derived result.
   */
  if (authorization) {
    const suppliedDecision =
      authorization.decision;

    if (
      suppliedDecision !== undefined &&
      suppliedDecision !==
        derivedAuthorization.decision
    ) {
      throw new Error(
        "Caller authorization decision does not match Phorva-derived authorization"
      );
    }

    const booleanFields = [
      "allExecutionsAuthorized",
      "sequenceValid",
      "graphInvariantsValid",
      "finalStateSatisfied"
    ];

    for (const field of booleanFields) {
      if (
        authorization[field] !== undefined &&
        authorization[field] !==
          derivedAuthorization[field]
      ) {
        throw new Error(
          `Caller authorization field "${field}" does not match Phorva-derived authorization`
        );
      }
    }
  }

  return canonicalizeProofValue({
    version: "phorva-proof-v1",

    subject: {
      agent:
        agent ??
        intent?.agent ??
        null
    },

    intent: {
      type: intent?.type ?? null,

      chain: intent?.chain ?? null,

      protocol: intent?.protocol ?? null,

      asset: intent?.asset ?? null,

      amount:
        intent?.amount !== undefined
          ? String(intent.amount)
          : null
    },

    authorization: {
      decision:
        derivedAuthorization.decision,

      allExecutionsAuthorized:
        derivedAuthorization.allExecutionsAuthorized,

      sequenceValid:
        derivedAuthorization.sequenceValid,

      graphInvariantsValid:
        derivedAuthorization.graphInvariantsValid,

      finalStateSatisfied:
        derivedAuthorization.finalStateSatisfied
    },

    executionGraph: {
      version:
        executionGraph?.version ?? null,

      commitment:
        executionGraphCommitment?.commitment ?? null,

      algorithm:
        executionGraphCommitment?.algorithm ?? null
    },

    finalState: {
      requested:
        finalStateVerification !== null,

      satisfied:
        derivedAuthorization.finalStateSatisfied,

      commitment:
        finalStateCommitment?.commitment ?? null,

      algorithm:
        finalStateCommitment?.algorithm ?? null
    },

    verificationTrace: {
      ...(verificationTrace ?? {}),

      commitment:
        verificationTraceCommitment?.commitment ?? null,

      algorithm:
        verificationTraceCommitment?.algorithm ?? null
    }
  });
}


function createPhorvaProofStatementCommitment(statement) {
  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(statement)
    );

  const commitment =
    crypto
      .createHash("sha256")
      .update(canonicalJson, "utf8")
      .digest("hex");

  return {
    algorithm: "SHA-256",
    commitment: "0x" + commitment,
    canonicalJson
  };
}


/*
 * Phorva Proof Statement API v1
 *
 * Converts an already-verified execution graph into
 * a canonical proof statement suitable for an
 * external prover adapter.
 */
app.post("/proof-statement", (req, res) => {
  const {
    executions,
    intent,
    executionGraph,
    executionGraphCommitment,
    finalStateVerification,
    finalStateCommitment,
    authorization,
    verificationReceipt
  } = req.body || {};

  /*
   * PREFERRED PATH:
   *
   * Raw executions are independently verified by Phorva.
   * No verification receipt is required.
   *
   * The receipt path below remains available for
   * backwards compatibility with v1 callers.
   */
  if (Array.isArray(executions)) {
    try {
      const context =
        buildVerifiedPhorvaProofContext({
          executions,

          intent,

          finalState:
            req.body?.finalState,

          expectedFinalState:
            finalStateVerification?.expected ??
            req.body?.expectedFinalState
        });

      /*
       * Caller-supplied commitments are assertions only.
       * Phorva independently recomputes the authoritative
       * execution graph commitment.
       */
      if (
        executionGraphCommitment?.commitment &&
        executionGraphCommitment.commitment !==
          context.verified.commitment.commitment
      ) {
        return res.status(400).json({
          error:
            "Submitted executionGraphCommitment does not match Phorva recomputation"
        });
      }

      /*
       * If the caller supplies an execution graph,
       * recompute it independently and compare it with
       * Phorva's verified graph commitment.
       */
      if (executionGraph) {
        const suppliedGraphCommitment =
          createExecutionGraphCommitment(
            executionGraph
          );

        if (
          suppliedGraphCommitment.commitment !==
          context.verified.commitment.commitment
        ) {
          return res.status(400).json({
            error:
              "Submitted executionGraph does not match Phorva recomputation"
          });
        }
      }

      /*
       * Caller authorization is never authoritative.
       * It must agree with Phorva's independently derived
       * authorization result.
       */
      if (authorization) {
        if (
          authorization.decision !== undefined &&
          authorization.decision !==
            context.verifiedAuthorization.decision
        ) {
          return res.status(400).json({
            error:
              "Caller authorization decision does not match Phorva recomputation"
          });
        }

        for (const field of [
          "allExecutionsAuthorized",
          "sequenceValid",
          "graphInvariantsValid",
          "finalStateSatisfied"
        ]) {
          if (
            authorization[field] !== undefined &&
            authorization[field] !==
              context.verifiedAuthorization[field]
          ) {
            return res.status(400).json({
              error:
                `Caller authorization field "${field}" does not match Phorva recomputation`
            });
          }
        }
      }

      return res.json({
        version:
          context.proofStatement.version,

        statement:
          context.proofStatement,

        commitment:
          context.proofCommitment.commitment,

        algorithm:
          context.proofCommitment.algorithm,

        verificationMode:
          "PURE_EXECUTION_VERIFICATION",

        verification: {
          ...context.verifiedAuthorization,

          violations:
            context.verified.authorization.violations
        }
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error.message
      });
    }
  }

  if (!executionGraph) {
    return res.status(400).json({
      error:
        "executionGraph is required"
    });
  }

  if (!executionGraphCommitment?.commitment) {
    return res.status(400).json({
      error:
        "executionGraphCommitment.commitment is required"
    });
  }

  const recomputedGraphCommitment =
    createExecutionGraphCommitment(
      executionGraph
    );

  if (
    recomputedGraphCommitment.commitment !==
    executionGraphCommitment.commitment
  ) {
    return res.status(400).json({
      error:
        "executionGraphCommitment does not match executionGraph"
    });
  }

  const receiptVerification =
    verifyPhorvaVerificationReceipt({
      executionGraph,

      executionGraphCommitment,

      receipt:
        verificationReceipt
    });

  if (!receiptVerification.valid) {
    return res.status(400).json({
      error:
        receiptVerification.error ??
        "Invalid Phorva verification receipt"
    });
  }

  try {
    const proofStatement =
      buildPhorvaProofStatement({
        agent:
          intent?.agent ??
          null,

        intent,
        executionGraph,
        executionGraphCommitment,
        finalStateVerification:
          finalStateVerification ?? null,
        finalStateCommitment:
          finalStateCommitment ?? null,

        authorization:
          authorization ?? null,

        verifiedAuthorization:
          receiptVerification.authorization
      });

    const commitment =
      createPhorvaProofStatementCommitment(
        proofStatement
      );

    return res.json({
      version:
        proofStatement.version,

      statement:
        proofStatement,

      commitment:
        commitment.commitment,

      algorithm:
        commitment.algorithm
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});


/*
 * Phorva Proof-Carrying Execution API v1
 *
 * Preferred end-to-end path:
 *
 * raw executions
 *      ↓
 * independent Phorva verification
 *      ↓
 * canonical proof statement
 *      ↓
 * statement commitment
 *      ↓
 * provider-neutral prover adapter
 *      ↓
 * proof artifact
 *
 * The caller supplies execution evidence.
 * Phorva derives the authoritative proof statement.
 *
 * A caller-supplied proof statement is intentionally
 * NOT accepted as the source of truth.
 */


function buildVerifiedPhorvaProofContext({
  executions,
  intent,
  finalState,
  expectedFinalState
}) {
  if (
    !Array.isArray(executions) ||
    executions.length === 0
  ) {
    throw new Error(
      "executions must be a non-empty array"
    );
  }

  const verified =
    verifyRawExecutions({
      executions
    });

  let verifiedAuthorization =
    verified.authorization;

  const verificationTraces =
    verified.nodes.map(node =>
      buildVerificationTrace({
        verification: {
          ...node.decision,

          analysis:
            node.analysis,

          actualTransactionAmount:
            Number.isFinite(
              Number(
                node.analysis
                  ?.decodedParameters
                  ?.actualAmount ??
                node.analysis
                  ?.decodedParameters
                  ?.amount
              )
            )
              ? Number(
                  node.analysis
                    .decodedParameters
                    .actualAmount ??
                  node.analysis
                    .decodedParameters
                    .amount
                )
              : Number(
                  node.transaction?.amount
                ),

          actualNativeValue:
            String(
              node.transaction?.value ?? "0"
            ),

          expectedNativeValue:
            String(
              node.intent?.nativeValue ??
              node.intent?.value ??
              "0"
            )
        }
      })
    );

  const verificationTrace =
    canonicalizeProofValue({
      version:
        "phorva-verification-trace-set-v1",

      executions:
        verificationTraces
    });

  const verificationTraceCommitment =
    createVerificationTraceCommitment(
      verificationTrace
    );

  let verifiedFinalState = null;
  let verifiedFinalStateCommitment = null;

  const finalStateRequested =
    finalState !== undefined ||
    expectedFinalState !== undefined;

  if (finalStateRequested) {
    verifiedFinalState =
      verifyFinalState({
        intent:
          intent ??
          executions[0]?.intent ??
          null,

        finalState:
          finalState ?? null,

        expectedFinalState:
          expectedFinalState ?? null
      });

    verifiedFinalStateCommitment =
      createFinalStateCommitment({
        graphCommitment:
          verified.commitment.commitment,

        finalState:
          finalState ?? null,

        verification:
          verifiedFinalState
      });

    verifiedAuthorization = {
      ...verifiedAuthorization,

      finalStateSatisfied:
        verifiedFinalState.satisfied === true,

      decision:
        verifiedAuthorization.decision ===
          "AUTHORIZED" &&
        verifiedFinalState.satisfied === true
          ? "AUTHORIZED"
          : "BLOCKED"
    };
  } else {
    verifiedAuthorization = {
      ...verifiedAuthorization,

      finalStateSatisfied:
        true
    };
  }

  const proofStatement =
    buildPhorvaProofStatement({
      agent:
        executions[0]?.agent ??
        intent?.agent ??
        null,

      intent:
        intent ??
        executions[0]?.intent ??
        null,

      executionGraph:
        verified.graph,

      executionGraphCommitment:
        verified.commitment,

      finalStateVerification:
        verifiedFinalState,

      finalStateCommitment:
        verifiedFinalStateCommitment,

      authorization:
        null,

      verifiedAuthorization,

      verificationTrace,

      verificationTraceCommitment
    });

  const proofCommitment =
    createPhorvaProofStatementCommitment(
      proofStatement
    );

  return {
    verified,

    verifiedAuthorization,

    verificationTrace,

    verificationTraceCommitment,

    verifiedFinalState,

    verifiedFinalStateCommitment,

    proofStatement,

    proofCommitment
  };
}

function createProverRequestId(
  proverRequest
) {
  const requestWithoutId = {
    ...proverRequest
  };

  delete requestWithoutId.requestId;

  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(
        requestWithoutId
      )
    );

  const requestHash =
    crypto
      .createHash("sha256")
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  return "0x" + requestHash;
}

function buildProverRequest({
  proofStatement,
  proofCommitment,
  provider = "mock"
}) {
  if (!proofStatement) {
    throw new Error(
      "proofStatement is required"
    );
  }

  if (!proofCommitment) {
    throw new Error(
      "proofCommitment is required"
    );
  }

  const recomputedCommitment =
    createPhorvaProofStatementCommitment(
      proofStatement
    );

  if (
    proofCommitment.commitment !==
    recomputedCommitment.commitment
  ) {
    throw new Error(
      "Proof commitment does not match Phorva proof statement"
    );
  }

  if (
    proofCommitment.algorithm &&
    proofCommitment.algorithm !==
      recomputedCommitment.algorithm
  ) {
    throw new Error(
      "Proof commitment algorithm does not match Phorva proof statement"
    );
  }

  const proverRequest =
    canonicalizeProofValue({
      version: "phorva-prover-request-v1",

      provider,

      statement: {
      version:
        proofStatement.version ?? null,

      commitment:
        proofCommitment.commitment ?? null,

      algorithm:
        proofCommitment.algorithm ?? null
    },

      proofInput:
        proofStatement
    });

  return {
    ...proverRequest,

    requestId:
      createProverRequestId(
        proverRequest
      )
  };
}

function createMockProofArtifact(
  proverRequest
) {
  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(
        proverRequest
      )
    );

  const proofHash =
    crypto
      .createHash("sha256")
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  return {
    provider: "mock",

    proofSystem:
      "MOCK-SHA256",

    status: "PROOF_GENERATED",

    proof:
      "0x" + proofHash,

    statementCommitment:
      proverRequest.statement.commitment,

    algorithm: "SHA-256"
  };
}

function proveWithAdapter({
  proofStatement,
  proofCommitment,
  provider = "mock"
}) {
  const proverRequest =
    buildProverRequest({
      proofStatement,
      proofCommitment,
      provider
    });

  const adapter =
    getProverAdapter(provider);

  const capabilities =
    checkProverCapabilities({
      adapter,
      proofStatement,
      operation: "prove"
    });

  if (!capabilities.supported) {
    throw new Error(
      capabilities.reason
    );
  }

  return {
    request: proverRequest,

    artifact:
      adapter.prove({
        proverRequest
      })
  };
}

/*
 * Phorva Prover API v1
 *
 * Accepts a canonical Phorva proof statement
 * and routes it through the selected prover adapter.
 */

/*
 * Phorva Proof Verification v1
 *
 * Verifies the provider-neutral proof artifact.
 *
 * The current mock provider uses SHA-256.
 * A real ZK adapter will replace this verification
 * logic with the provider's cryptographic verifier.
 */

/**
 * Phorva Provider Interface v1
 *
 * Every prover adapter must expose:
 *   provider
 *   proofSystem
 *   prove({ proverRequest })
 *   verify({ proverRequest, proof })
 *
 * Phorva owns the proof statement and verification semantics.
 * Providers only implement the proving-system boundary.
 */
function validateProverAdapter({
  provider,
  adapter
}) {
  if (!provider) {
    throw new Error(
      "provider is required"
    );
  }

  if (!adapter || typeof adapter !== "object") {
    throw new Error(
      `Invalid prover adapter: ${provider}`
    );
  }

  if (
    typeof adapter.provider !== "string" ||
    adapter.provider !== provider
  ) {
    throw new Error(
      `Prover adapter "${provider}" has invalid provider identifier`
    );
  }

  if (
    typeof adapter.proofSystem !== "string" ||
    adapter.proofSystem.length === 0
  ) {
    throw new Error(
      `Prover adapter "${provider}" has no proofSystem`
    );
  }

  if (typeof adapter.prove !== "function") {
    throw new Error(
      `Prover provider "${provider}" does not implement prove()`
    );
  }

  if (typeof adapter.verify !== "function") {
    throw new Error(
      `Prover provider "${provider}" does not implement verify()`
    );
  }

  return true;
}

function getProverAdapter(provider) {
  const adapter =
    proverAdapters[provider];

  if (!adapter) {
    throw new Error(
      `Unsupported prover provider: ${provider}`
    );
  }

  validateProverAdapter({
    provider,
    adapter
  });

  return adapter;
}

/**
 * Phorva Provider Capability Negotiation v1
 *
 * Checks whether a provider supports the requested
 * proving or verification operation and proof statement
 * version before the provider is invoked.
 */
function checkProverCapabilities({
  adapter,
  proofStatement,
  operation = "prove"
}) {
  if (!adapter) {
    return {
      supported: false,
      reason:
        "Provider adapter is required"
    };
  }

  const capabilities =
    adapter.capabilities || {};

  if (
    operation === "prove" &&
    capabilities.proving !== true
  ) {
    return {
      supported: false,
      reason:
        `Provider "${adapter.provider}" does not support proving`
    };
  }

  if (
    operation === "verify" &&
    capabilities.verification !== true
  ) {
    return {
      supported: false,
      reason:
        `Provider "${adapter.provider}" does not support verification`
    };
  }

  const statementVersion =
    proofStatement?.version ?? null;

  const statementVersions =
    Array.isArray(
      capabilities.statementVersions
    )
      ? capabilities.statementVersions
      : [];

  if (
    !statementVersion ||
    !statementVersions.includes(
      statementVersion
    )
  ) {
    return {
      supported: false,
      reason:
        `Provider "${adapter.provider}" does not support proof statement version "${statementVersion}"`
    };
  }

  return {
    supported: true,

    provider:
      adapter.provider,

    proofSystem:
      adapter.proofSystem,

    operation,

    statementVersion
  };
}

/**
 * Phorva Provider Routing v1
 *
 * Discovers providers that can handle a proof request.
 * Provider selection remains deterministic and provider-neutral.
 */
function findCompatibleProverProviders({
  proofStatement,
  operation = "prove"
}) {
  const compatible = [];

  for (const provider of Object.keys(proverAdapters)) {
    const adapter =
      proverAdapters[provider];

    try {
      const availability =
        adapter.availability || {};

      if (
        availability.enabled !== true ||
        availability.status !== "available"
      ) {
        continue;
      }
      validateProverAdapter({
        provider,
        adapter
      });

      const capabilities =
        checkProverCapabilities({
          adapter,
          proofStatement,
          operation
        });

      if (capabilities.supported) {
        compatible.push({
          provider,
          proofSystem:
            adapter.proofSystem,
          capabilities:
            adapter.capabilities
        });
      }
    } catch (error) {
      // Invalid providers are excluded from routing.
    }
  }

  return compatible;
}

function selectProverProvider({
  proofStatement,
  operation = "prove",
  preferredProvider = null,
  providerOrder = []
}) {
  if (!proofStatement) {
    throw new Error(
      "proofStatement is required"
    );
  }

  const compatibleProviders =
    findCompatibleProverProviders({
      proofStatement,
      operation
    });

  if (
    compatibleProviders.length === 0
  ) {
    throw new Error(
      "No compatible prover provider found"
    );
  }

  if (
    preferredProvider
  ) {
    const preferred =
      compatibleProviders.find(
        provider =>
          provider.provider ===
          preferredProvider
      );

    if (!preferred) {
      throw new Error(
        `Preferred prover provider "${preferredProvider}" does not support this request`
      );
    }

    return {
      selected: preferred,
      candidates:
        compatibleProviders,
      policy: {
        mode: "preferred",
        preferredProvider,
        selectedProvider:
          preferred.provider
      }
    };
  }

  const orderedProviders =
    Array.isArray(providerOrder)
      ? providerOrder
      : [];

  for (
    const providerName of orderedProviders
  ) {
    const candidate =
      compatibleProviders.find(
        provider =>
          provider.provider ===
          providerName
      );

    if (candidate) {
      return {
        selected: candidate,
        candidates:
          compatibleProviders,
        policy: {
          mode: "ordered",
          providerOrder:
            orderedProviders,
          selectedProvider:
            candidate.provider
        }
      };
    }
  }

  const fallback =
    compatibleProviders
      .slice()
      .sort((a, b) =>
        a.provider.localeCompare(
          b.provider
        )
      )[0];

  return {
    selected: fallback,
    candidates:
      compatibleProviders,
    policy: {
      mode: "deterministic-fallback",
      providerOrder:
        orderedProviders,
      selectedProvider:
        fallback.provider
    }
  };
}

const proverAdapters = {
  mock: {
    provider: "mock",
    proofSystem: "MOCK-SHA256",

    capabilities: {
      proving: true,
      verification: true,
      statementVersions: [
        "phorva-proof-v1"
      ]
    },

    availability: {
      enabled: true,
      status: "available"
    },

    prove({
      proverRequest
    }) {
      return createMockProofArtifact(
        proverRequest
      );
    },

    verify({
      proverRequest,
      proof
    }) {
      return verifyMockProofArtifact({
        proverRequest,
        proof
      });
    }
  },

  "local-test": {
    provider: "local-test",
    proofSystem: "PHORVA-LOCAL-TEST-SHA256",

    capabilities: {
      proving: true,
      verification: true,
      statementVersions: [
        "phorva-proof-v1"
      ]
    },

    availability: {
      enabled: true,
      status: "available"
    },

    prove({
      proverRequest
    }) {
      const canonicalJson =
        JSON.stringify(
          canonicalizeProofValue(
            proverRequest
          )
        );

      const proofHash =
        crypto
          .createHash("sha256")
          .update(
            "PHORVA-LOCAL-TEST|" +
              canonicalJson,
            "utf8"
          )
          .digest("hex");

      return {
        provider: "local-test",
        proofSystem:
          "PHORVA-LOCAL-TEST-SHA256",
        status: "PROOF_GENERATED",
        proof:
          "0x" + proofHash,
        statementCommitment:
          proverRequest.statement.commitment,
        algorithm: "SHA-256"
      };
    },

    verify({
      proverRequest,
      proof
    }) {
      if (!proverRequest) {
        return {
          valid: false,
          error:
            "proverRequest is required"
        };
      }

      if (!proof) {
        return {
          valid: false,
          error:
            "proof is required"
        };
      }

      if (
        proof.provider !==
        "local-test"
      ) {
        return {
          valid: false,
          error:
            "Unsupported proof provider"
        };
      }

      if (
        proof.proofSystem !==
        "PHORVA-LOCAL-TEST-SHA256"
      ) {
        return {
          valid: false,
          error:
            "Unsupported proof system"
        };
      }

      if (!proof.statementCommitment) {
        return {
          valid: false,
          error:
            "proof.statementCommitment is required"
        };
      }

      const expectedStatementCommitment =
        proverRequest.statement?.commitment ??
        null;

      if (
        proof.statementCommitment !==
        expectedStatementCommitment
      ) {
        return {
          valid: false,
          error:
            "Proof statement commitment mismatch"
        };
      }

      const canonicalJson =
        JSON.stringify(
          canonicalizeProofValue(
            proverRequest
          )
        );

      const expectedProof =
        "0x" +
        crypto
          .createHash("sha256")
          .update(
            "PHORVA-LOCAL-TEST|" +
              canonicalJson,
            "utf8"
          )
          .digest("hex");

      const valid =
        proof.proof ===
        expectedProof;

      return {
        valid,
        provider:
          proof.provider,
        proofSystem:
          proof.proofSystem,
        statementCommitment:
          proof.statementCommitment,
        expectedProof,
        actualProof:
          proof.proof,
        algorithm:
          "SHA-256"
      };
    }
  }
};

function verifyMockProofArtifact({
  proverRequest,
  proof
}) {
  if (!proverRequest) {
    return {
      valid: false,
      error: "proverRequest is required"
    };
  }

  if (!proof) {
    return {
      valid: false,
      error: "proof is required"
    };
  }

  if (proof.provider !== "mock") {
    return {
      valid: false,
      error: "Unsupported proof provider"
    };
  }

  if (proof.proofSystem !== "MOCK-SHA256") {
    return {
      valid: false,
      error: "Unsupported proof system"
    };
  }

  if (!proof.statementCommitment) {
    return {
      valid: false,
      error: "proof.statementCommitment is required"
    };
  }

  const expectedStatementCommitment =
    proverRequest.statement?.commitment ?? null;

  if (
    proof.statementCommitment !==
    expectedStatementCommitment
  ) {
    return {
      valid: false,
      error:
        "Proof statement commitment mismatch"
    };
  }

  const canonicalJson =
    JSON.stringify(
      canonicalizeProofValue(
        proverRequest
      )
    );

  const expectedProof =
    "0x" +
    crypto
      .createHash("sha256")
      .update(
        canonicalJson,
        "utf8"
      )
      .digest("hex");

  const valid =
    proof.proof === expectedProof;

  return {
    valid,

    provider:
      proof.provider,

    proofSystem:
      proof.proofSystem,

    statementCommitment:
      proof.statementCommitment,

    expectedProof,

    actualProof:
      proof.proof,

    algorithm:
      "SHA-256"
  };
}

/**
 * Phorva Proof Artifact Integrity v1
 *
 * Ensures a provider proof is cryptographically and
 * semantically bound to the exact prover request.
 */
/**
 * Phorva Proof Receipt v1
 *
 * Creates a canonical receipt binding a proof artifact
 * to its exact prover request and verification result.
 */
function createPhorvaProofReceipt({
  proverRequest,
  proof,
  verification
}) {
  if (!proverRequest) {
    throw new Error(
      "proverRequest is required"
    );
  }

  if (!proof) {
    throw new Error(
      "proof is required"
    );
  }

  if (!verification) {
    throw new Error(
      "verification is required"
    );
  }

  console.log("[PHORVA RECEIPT DIAGNOSTIC]", JSON.stringify({
    requestId: proverRequest.requestId ?? null,
    provider: proverRequest.provider ?? null,
    verifiedDecision:
      proverRequest.proofInput?.verifiedAuthorization?.decision ?? null,
    authorizationDecision:
      proverRequest.proofInput?.authorization?.decision ?? null,
    allExecutionsAuthorized:
      proverRequest.proofInput?.verifiedAuthorization?.allExecutionsAuthorized ?? null,
    sequenceValid:
      proverRequest.proofInput?.verifiedAuthorization?.sequenceValid ?? null,
    graphInvariantsValid:
      proverRequest.proofInput?.verifiedAuthorization?.graphInvariantsValid ?? null,
    finalStateSatisfied:
      proverRequest.proofInput?.verifiedAuthorization?.finalStateSatisfied ?? null
  }, null, 2));

  const receipt =
    canonicalizeProofValue({
      version:
        "phorva-proof-receipt-v1",

      requestId:
        proverRequest.requestId ??
        createProverRequestId(
          proverRequest
        ),

      provider:
        proverRequest.provider ??
        proof.provider ??
        null,

      proofSystem:
        proof.proofSystem ??
        null,

      statement: {
        version:
          proverRequest.statement
            ?.version ??
          null,

        commitment:
          proverRequest.statement
            ?.commitment ??
          null,

        algorithm:
          proverRequest.statement
            ?.algorithm ??
          null,

        executionGraphCommitment:
          proverRequest.proofInput
            ?.executionGraph
            ?.commitment ??
          null,

        finalStateCommitment:
          proverRequest.proofInput
            ?.finalState
            ?.commitment ??
          null
      },

      execution: {
        graphCommitment:
          proverRequest.proofInput
            ?.executionGraph
            ?.commitment ??
          null,

        graphAlgorithm:
          proverRequest.proofInput
            ?.executionGraph
            ?.algorithm ??
          null
      },

      finalState: {
        commitment:
          proverRequest.proofInput
            ?.finalState
            ?.commitment ??
          null,

        algorithm:
          proverRequest.proofInput
            ?.finalState
            ?.algorithm ??
          null,

        satisfied:
          proverRequest.proofInput
            ?.authorization
            ?.finalStateSatisfied ??
          null
      },

      authorization: {
        decision:
          proverRequest.proofInput
            ?.verifiedAuthorization
            ?.decision ??
          proverRequest.proofInput
            ?.authorization
            ?.decision ??
          null,

        allExecutionsAuthorized:
          proverRequest.proofInput
            ?.verifiedAuthorization
            ?.allExecutionsAuthorized ??
          proverRequest.proofInput
            ?.authorization
            ?.allExecutionsAuthorized ??
          null,

        sequenceValid:
          proverRequest.proofInput
            ?.verifiedAuthorization
            ?.sequenceValid ??
          proverRequest.proofInput
            ?.authorization
            ?.sequenceValid ??
          null,

        graphInvariantsValid:
          proverRequest.proofInput
            ?.verifiedAuthorization
            ?.graphInvariantsValid ??
          proverRequest.proofInput
            ?.authorization
            ?.graphInvariantsValid ??
          null,

        finalStateSatisfied:
          proverRequest.proofInput
            ?.verifiedAuthorization
            ?.finalStateSatisfied ??
          proverRequest.proofInput
            ?.authorization
            ?.finalStateSatisfied ??
          null
      },

      proof: {
        artifact:
          proof.proof ??
          null,

        statementCommitment:
          proof.statementCommitment ??
          null,

        algorithm:
          proof.algorithm ??
          null
      },

      verification: {
        valid:
          verification.valid === true,

        provider:
          verification.provider ??
          null,

        proofSystem:
          verification.proofSystem ??
          null
      }
    });

  const commitment =
    createPhorvaProofStatementCommitment(
      receipt
    );

  return {
    receipt,

    commitment: {
      algorithm:
        commitment.algorithm,

      commitment:
        commitment.commitment
    }
  };
}

/**
 * Phorva Proof Receipt Verification v1
 *
 * Independently validates the internal bindings of a
 * Phorva proof receipt and its commitment.
 */
function verifyPhorvaProofReceipt({
  receipt,
  receiptCommitment
}) {
  if (!receipt) {
    return {
      valid: false,
      error:
        "receipt is required"
    };
  }

  if (!receiptCommitment?.commitment) {
    return {
      valid: false,
      error:
        "receiptCommitment.commitment is required"
    };
  }

  const recomputed =
    createPhorvaProofStatementCommitment(
      receipt
    );

  if (
    receiptCommitment.commitment !==
    recomputed.commitment
  ) {
    return {
      valid: false,
      error:
        "Proof receipt commitment mismatch"
    };
  }

  if (
    receiptCommitment.algorithm &&
    receiptCommitment.algorithm !==
      recomputed.algorithm
  ) {
    return {
      valid: false,
      error:
        "Proof receipt commitment algorithm mismatch"
    };
  }

  if (!receipt.requestId) {
    return {
      valid: false,
      error:
        "Proof receipt requestId is required"
    };
  }

  if (!receipt.statement?.commitment) {
    return {
      valid: false,
      error:
        "Proof receipt statement commitment is required"
    };
  }

  if (
    receipt.proof?.statementCommitment !==
    receipt.statement.commitment
  ) {
    return {
      valid: false,
      error:
        "Proof receipt statement binding mismatch"
    };
  }

  const statementGraphCommitment =
    receipt.statement?.executionGraphCommitment ??
    null;

  const executionGraphCommitment =
    receipt.execution?.graphCommitment ??
    null;

  if (
    executionGraphCommitment !==
    statementGraphCommitment
  ) {
    return {
      valid: false,
      error:
        "Proof receipt execution graph binding mismatch"
    };
  }

  const finalStateCommitment =
    receipt.finalState?.commitment ??
    null;

  const statementFinalStateCommitment =
    receipt.statement
      ?.finalStateCommitment ??
    null;

  if (
    finalStateCommitment !==
    statementFinalStateCommitment
  ) {
    return {
      valid: false,
      error:
        "Proof receipt final-state binding mismatch"
    };
  }

  if (
    receipt.finalState?.satisfied === false
  ) {
    return {
      valid: false,
      error:
        "Proof receipt final-state verification failed"
    };
  }

  if (
    receipt.provider !==
    receipt.verification?.provider
  ) {
    return {
      valid: false,
      error:
        "Proof receipt provider binding mismatch"
    };
  }

  if (
    receipt.proofSystem !==
    receipt.verification?.proofSystem
  ) {
    return {
      valid: false,
      error:
        "Proof receipt proof-system binding mismatch"
    };
  }

  const authorization =
    receipt.authorization ?? {};

  // Accept both terminal decisions as valid verification outcomes.
  // AUTHORIZED  → action was permitted
  // BLOCKED     → action was correctly rejected
  if (
    authorization.decision !== "AUTHORIZED" &&
    authorization.decision !== "BLOCKED"
  ) {
    return {
      valid: false,
      error:
        "Proof receipt authorization decision is not authorized"
    };
  }

  // When the decision is BLOCKED, the boolean flags are expected to be false.
  // Only enforce the strict "all true" invariants for AUTHORIZED receipts.
  if (authorization.decision === "AUTHORIZED") {
    if (
      authorization.allExecutionsAuthorized !==
      true
    ) {
      return {
        valid: false,
        error:
          "Proof receipt authorization binding failed"
      };
    }

    if (
      authorization.sequenceValid !==
      true
    ) {
      return {
        valid: false,
        error:
          "Proof receipt sequence authorization binding failed"
      };
    }

    if (
      authorization.graphInvariantsValid !==
      true
    ) {
      return {
        valid: false,
        error:
          "Proof receipt graph authorization binding failed"
      };
    }

    if (
      authorization.finalStateSatisfied !==
      true
    ) {
      return {
        valid: false,
        error:
          "Proof receipt final-state authorization binding failed"
      };
    }
  }

  if (
    receipt.verification?.valid !== true
  ) {
    return {
      valid: false,
      error:
        "Proof receipt does not contain a valid verification result"
    };
  }

  return {
    valid: true,

    requestId:
      receipt.requestId,

    provider:
      receipt.provider ?? null,

    proofSystem:
      receipt.proofSystem ?? null,

    statementCommitment:
      receipt.statement.commitment,

    receiptCommitment:
      receiptCommitment.commitment,

    algorithm:
      recomputed.algorithm
  };
}

function validateProofArtifactIntegrity({
  proverRequest,
  proof
}) {
  if (!proverRequest) {
    return {
      valid: false,
      error:
        "proverRequest is required"
    };
  }

  if (!proof) {
    return {
      valid: false,
      error:
        "proof is required"
    };
  }

  const expectedProvider =
    proverRequest.provider ?? null;

  const actualProvider =
    proof.provider ?? null;

  if (
    !expectedProvider ||
    !actualProvider ||
    actualProvider !== expectedProvider
  ) {
    return {
      valid: false,
      error:
        "Proof provider binding mismatch"
    };
  }

  const expectedProofSystem =
    proverAdapters[
      expectedProvider
    ]?.proofSystem ?? null;

  const actualProofSystem =
    proof.proofSystem ?? null;

  if (
    !expectedProofSystem ||
    actualProofSystem !==
      expectedProofSystem
  ) {
    return {
      valid: false,
      error:
        "Proof system binding mismatch"
    };
  }

  const expectedStatementCommitment =
    proverRequest.statement?.commitment ??
    null;

  const actualStatementCommitment =
    proof.statementCommitment ??
    null;

  if (
    !expectedStatementCommitment ||
    actualStatementCommitment !==
      expectedStatementCommitment
  ) {
    return {
      valid: false,
      error:
        "Proof statement commitment binding mismatch"
    };
  }

  return {
    valid: true,

    provider:
      actualProvider,

    proofSystem:
      actualProofSystem,

    statementCommitment:
      actualStatementCommitment
  };
}

function verifyProofArtifact({
  proverRequest,
  proof
}) {
  const provider =
    proof?.provider ??
    proverRequest?.provider ??
    null;

  if (!provider) {
    return {
      valid: false,
      error:
        "No verifier adapter for supplied proof provider"
    };
  }

  let adapter;

  try {
    adapter =
      getProverAdapter(provider);
  } catch (error) {
    return {
      valid: false,
      error:
        error.message
    };
  }

  const capabilities =
    checkProverCapabilities({
      adapter,
      proofStatement:
        proverRequest?.proofInput,
      operation: "verify"
    });

  if (!capabilities.supported) {
    return {
      valid: false,
      error:
        capabilities.reason
    };
  }

  const integrity =
    validateProofArtifactIntegrity({
      proverRequest,
      proof
    });

  if (!integrity.valid) {
    return integrity;
  }

  const verification =
    adapter.verify({
      proverRequest,
      proof
    });

  if (!verification.valid) {
    return verification;
  }

  const receipt =
    createPhorvaProofReceipt({
      proverRequest,
      proof,
      verification
    });

  const proofInput =
    proverRequest?.proofInput ?? {};

  const isProofCarryingExecution =
    proofInput?.executionGraph !== undefined ||
    proofInput?.authorization !== undefined ||
    proofInput?.finalState !== undefined;

  let receiptVerification = null;

  if (isProofCarryingExecution) {
    receiptVerification =
      verifyPhorvaProofReceipt({
        receipt:
          receipt.receipt,

        receiptCommitment:
          receipt.commitment
      });

    if (!receiptVerification.valid) {
      return {
        valid: false,
        error:
          receiptVerification.error ??
          "Proof receipt verification failed",

        receipt:
          receipt.receipt,

        receiptCommitment:
          receipt.commitment,

        receiptVerification
      };
    }
  }

  return {
    ...verification,

    receipt:
      receipt.receipt,

    receiptCommitment:
      receipt.commitment,

    receiptVerification
  };
}

app.get("/provider-status", (req, res) => {
  const providers =
    Object.keys(proverAdapters).map(
      provider => {
        const adapter =
          proverAdapters[provider];

        const availability =
          adapter.availability || {};

        return {
          provider:
            adapter.provider,

          proofSystem:
            adapter.proofSystem,

          capabilities:
            adapter.capabilities || {},

          availability: {
            enabled:
              availability.enabled === true,

            status:
              availability.status ??
              "unavailable"
          }
        };
      }
    );

  return res.json({
    version:
      "phorva-provider-status-v1",

    providers
  });
});

app.post("/providers", (req, res) => {
  const {
    proofStatement,
    operation = "prove",
    preferredProvider = null,
    providerOrder = []
  } = req.body || {};

  if (!proofStatement) {
    return res.status(400).json({
      error:
        "proofStatement is required"
    });
  }

  if (
    operation !== "prove" &&
    operation !== "verify"
  ) {
    return res.status(400).json({
      error:
        'operation must be "prove" or "verify"'
    });
  }

  try {
    const compatibleProviders =
      findCompatibleProverProviders({
        proofStatement,
        operation
      });

    let selection = null;

    if (
      compatibleProviders.length > 0
    ) {
      selection =
        selectProverProvider({
          proofStatement,
          operation,
          preferredProvider,
          providerOrder
        });
    }

    return res.json({
      version:
        "phorva-provider-routing-v1",

      operation,

      statementVersion:
        proofStatement.version ?? null,

      compatibleProviders,

      selectedProvider:
        selection?.selected ?? null,

      routingPolicy:
        selection?.policy ?? null
    });
  } catch (error) {
    return res.status(400).json({
      error:
        error.message
    });
  }
});

app.post("/prove-execution", (req, res) => {
  const {
    executions,
    intent,
    finalState,
    expectedFinalState,
    provider = null,
    preferredProvider = null,
    providerOrder = []
  } = req.body || {};

  if (
    !Array.isArray(executions) ||
    executions.length === 0
  ) {
    return res.status(400).json({
      error:
        "executions must be a non-empty array"
    });
  }

  try {
    const context =
      buildVerifiedPhorvaProofContext({
        executions,
        intent,
        finalState,
        expectedFinalState
      });

    const routing =
      selectProverProvider({
        proofStatement:
          context.proofStatement,

        operation: "prove",

        preferredProvider:
          preferredProvider ??
          provider,

        providerOrder
      });

    const selectedProvider =
      routing.selected.provider;

    const proving =
      proveWithAdapter({
        proofStatement:
          context.proofStatement,

        proofCommitment:
          context.proofCommitment,

        provider:
          selectedProvider
      });

    return res.json({
      version:
        "phorva-proof-carrying-execution-v1",

      provider:
        selectedProvider,

      routingPolicy:
        routing.policy,

      compatibleProviders:
        routing.candidates,

      verificationMode:
        "PURE_EXECUTION_VERIFICATION",

      verification: {
        ...context.verifiedAuthorization,

        violations:
          context.verified.authorization
            .violations
      },

      executionGraph:
        context.verified.graph,

      executionGraphCommitment:
        context.verified.commitment,

      verificationTrace:
        context.verificationTrace,

      verificationTraceCommitment:
        context.verificationTraceCommitment,

      finalStateVerification:
        context.verifiedFinalState,

      finalStateCommitment:
        context.verifiedFinalStateCommitment,

      proofStatement:
        context.proofStatement,

      proofCommitment:
        context.proofCommitment,

      proverRequest:
        proving.request,

      proof:
        proving.artifact
    });
  } catch (error) {
    return res.status(400).json({
      error:
        error.message
    });
  }
});

app.post("/prove", (req, res) => {
  const {
    proofStatement,
    proofCommitment,
    provider = "mock"
  } = req.body || {};

  if (!proofStatement) {
    return res.status(400).json({
      error:
        "proofStatement is required"
    });
  }

  if (!proofCommitment?.commitment) {
    return res.status(400).json({
      error:
        "proofCommitment.commitment is required"
    });
  }

  try {
    const result =
      proveWithAdapter({
        proofStatement,
        proofCommitment,
        provider
      });

    return res.json({
      version:
        "phorva-prover-response-v1",

      provider,

      request:
        result.request,

      proof:
        result.artifact
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});


/*
 * Phorva Proof Verification API v1
 */
app.post("/verify-proof", (req, res) => {
  const {
    proverRequest,
    proof
  } = req.body || {};

  if (!proverRequest) {
    return res.status(400).json({
      valid: false,
      error:
        "proverRequest is required"
    });
  }

  if (!proof) {
    return res.status(400).json({
      valid: false,
      error:
        "proof is required"
    });
  }

  const verification =
    verifyProofArtifact({
      proverRequest,
      proof
    });

  return res.json({
    version:
      "phorva-proof-verification-v1",

    ...verification
  });
});


/*
 * Phorva Proof-Carrying Execution Verification API v1
 *
 * Provider-routed verification boundary for complete
 * proof-carrying executions produced by /prove-execution.
 */
app.post("/verify-execution", (req, res) => {
  const {
    proverRequest,
    proof,
    preferredProvider = null,
    providerOrder = []
  } = req.body || {};

  if (!proverRequest) {
    return res.status(400).json({
      valid: false,
      error:
        "proverRequest is required"
    });
  }

  if (!proof) {
    return res.status(400).json({
      valid: false,
      error:
        "proof is required"
    });
  }

  try {
    const proofStatement =
      proverRequest.proofInput;

    if (!proofStatement) {
      return res.status(400).json({
        valid: false,
        error:
          "proverRequest.proofInput is required"
      });
    }

    const routing =
      selectProverProvider({
        proofStatement,
        operation: "verify",
        preferredProvider,
        providerOrder
      });

    const selectedProvider =
      routing.selected.provider;

    const proofProvider =
      proof?.provider ??
      proverRequest?.provider ??
      null;

    if (
      proofProvider &&
      proofProvider !== selectedProvider
    ) {
      return res.status(400).json({
        valid: false,
        provider: selectedProvider,
        routingPolicy:
          routing.policy,
        compatibleProviders:
          routing.candidates,
        error:
          "Proof provider does not match selected verifier provider"
      });
    }

    const verification =
      verifyProofArtifact({
        proverRequest,
        proof
      });

    return res.json({
      version:
        "phorva-execution-verification-v1",

      provider:
        selectedProvider,

      routingPolicy:
        routing.policy,

      compatibleProviders:
        routing.candidates,

      ...verification
    });
  } catch (error) {
    return res.status(400).json({
      valid: false,
      error:
        error.message
    });
  }
});

app.post("/execution-graph", (req, res) => {
  const {
    executions,
    expectedFinalState,
    finalState
  } = req.body;

  if (
    !Array.isArray(executions) ||
    executions.length === 0
  ) {
    return res.status(400).json({
      authorized: false,
      error:
        "executions must be a non-empty array"
    });
  }

  const nodes = [];

  for (let i = 0; i < executions.length; i++) {
    const execution = executions[i] || {};

    const {
      executionId,
      parentExecutionId,
      agent,
      action,
      intent,
      policy,
      transaction
    } = execution;

    if (
      !agent ||
      !action ||
      !policy ||
      !intent ||
      !transaction
    ) {
      return res.status(400).json({
        authorized: false,
        error:
          `execution ${i} requires agent, action, policy, intent and transaction`
      });
    }

    const verification =
      verifyExecutionAuthorization({
        agent,
        action,
        intent,
        policy,
        transaction
      });

    const analysis =
      verification.analysis;

    const decision = {
      authorized:
        verification.authorized,

      policyPassed:
        verification.policyPassed,

      capabilityAllowed:
        verification.capabilityAllowed,

      targetAllowed:
        verification.targetAllowed,

      selectorAllowed:
        verification.selectorAllowed,

      approvalAllowed:
        verification.approvalAllowed,

      velocityAllowed:
        verification.velocityAllowed,

      intentMatched:
        verification.intentMatched,

      parameterMatched:
        verification.parameterMatched,

      executionTypeMatched:
        verification.executionTypeMatched,

      nativeValueMatched:
        verification.nativeValueMatched,

      protocolMatched:
        verification.protocolMatched,

      transactionSecuritySafe:
        verification.transactionSecuritySafe
    };

    nodes.push({
      executionId:
        executionId ??
        `execution-${i + 1}`,

      parentExecutionId:
        parentExecutionId ??
        (i === 0
          ? null
          : nodes[i - 1].executionId),

      sequence:
        execution.sequence ??
        i,

      agent,
      intent,
      transaction,
      analysis,
      decision
    });
  }

  const graph =
    buildExecutionGraph({
      executions: nodes
    });

  const commitment =
    createExecutionGraphCommitment(
      graph
    );

  const allAuthorized =
    nodes.every(
      node =>
        node.decision.authorized === true
    );

  const sequenceValid =
    nodes.every(
      (node, index) =>
        node.sequence === index &&
        (
          index === 0
            ? node.parentExecutionId === null
            : node.parentExecutionId ===
              nodes[index - 1].executionId
        )
    );

  const graphInvariants =
    verifyExecutionGraphInvariants(
      nodes
    );

  /*
   * Final-State Verification v1
   *
   * Optional for backward compatibility.
   * Existing graph requests without final-state
   * fields continue to use the original semantics.
   */
  const finalStateVerificationRequested =
    expectedFinalState !== undefined ||
    finalState !== undefined;

  let finalStateVerification = null;
  let finalStateCommitment = null;

  if (finalStateVerificationRequested) {
    finalStateVerification =
      verifyFinalState({
        intent:
          executions[0]?.intent ?? null,

        finalState,

        expectedFinalState
      });

    finalStateCommitment =
      createFinalStateCommitment({
        graphCommitment:
          commitment.commitment,

        finalState,

        verification:
          finalStateVerification
      });
  }

  const finalStateSatisfied =
    finalStateVerificationRequested
      ? finalStateVerification.satisfied === true
      : true;

  const authorized =
    allAuthorized &&
    sequenceValid &&
    graphInvariants.valid &&
    finalStateSatisfied;

    const phorvaProofStatement =
    buildPhorvaProofStatement({
      agent:
        executions[0]?.agent ??
        executions[0]?.intent?.agent ??
        null,

      intent:
        executions[0]?.intent ?? null,

      executionGraph:
        graph,

      executionGraphCommitment:
        commitment,

      finalStateVerification,

      finalStateCommitment,

      verifiedAuthorization: {
        decision:
          authorized
            ? "AUTHORIZED"
            : "BLOCKED",

        allExecutionsAuthorized:
          allAuthorized,

        quarantineAllowed:
          allAuthorized &&
          executions.every(
            execution =>
              execution?.authorization?.quarantineAllowed !== false
          ),

        sequenceValid,

        graphInvariantsValid:
          graphInvariants.valid,

        finalStateSatisfied
      }
    });

  const phorvaProofCommitment =
    createPhorvaProofStatementCommitment(
      phorvaProofStatement
    );

  /*
   * Phorva Verification Receipt v1
   *
   * This receipt is created only from the
   * authoritative verification result above.
   *
   * It allows /proof-statement to distinguish
   * a graph actually verified by Phorva from
   * arbitrary caller-constructed graph data.
   */
  const verificationReceipt =
    createPhorvaVerificationReceipt({
      executionGraph:
        graph,

      executionGraphCommitment:
        commitment,

      authorization: {
        decision:
          authorized
            ? "AUTHORIZED"
            : "BLOCKED",

        allExecutionsAuthorized:
          allAuthorized,

        sequenceValid,

        graphInvariantsValid:
          graphInvariants.valid,

        finalStateSatisfied
      }
    });

  return res.json({
    authorized,

      proof: {
        version:
          phorvaProofStatement.version,

        statement:
          phorvaProofStatement,

        commitment:
          phorvaProofCommitment.commitment,

        algorithm:
          phorvaProofCommitment.algorithm
      },

      verificationReceipt,

    graph: {
      version:
        graph.version,

      executionCount:
        graph.nodes.length,

      commitment:
        commitment.commitment,

      algorithm:
        commitment.algorithm,

      statement:
        graph
    },

    verification: {
      allExecutionsAuthorized:
        allAuthorized,

      sequenceValid,

      graphInvariantsValid:
        graphInvariants.valid,

      violations:
        graphInvariants.violations,

      graphAuthorized:
        authorized,

      finalStateVerificationRequested,

      finalStateVerification,

      finalStateCommitment
    }
  });
});

app.post("/verification-trace", (req, res) => {
  try {
    const {
      agent,
      action,
      intent,
      policy,
      transaction
    } = req.body || {};

    const verification =
      verifyExecutionAuthorization({
        agent,
        action,
        intent,
        policy,
        transaction
      });

    const trace =
      buildVerificationTrace({
        verification
      });

    return res.json({
      verificationTrace:
        trace,

      authorization: {
        authorized:
          verification.authorized,

        policyPassed:
          verification.policyPassed,

        intentMatched:
          verification.intentMatched,

        parameterMatched:
          verification.parameterMatched,

        executionTypeMatched:
          verification.executionTypeMatched,

        nativeValueMatched:
          verification.nativeValueMatched,

        protocolMatched:
          verification.protocolMatched,

        transactionSecuritySafe:
          verification.transactionSecuritySafe
      }
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});

app.post("/authorize", (req, res) => {
  try {
    const {
      agent,
      action,
      intent,
      policy,
      transaction
    } = req.body || {};

    const verification =
      verifyExecutionAuthorization({
        agent,
        action,
        intent,
        policy,
        transaction
      });

    const {
      authorized,
      policyPassed,
      intentMatched,
      parameterMatched,
      executionTypeMatched,
      nativeValueMatched,
      protocolMatched,
      transactionSecuritySafe,
      analysis,
      actualTransactionAmount,
      parameterChecks
    } = verification;

    let reason;

    if (!policyPassed) {
      const maximum =
        Number(
          policy.maxTransactionAmount ??
          policy.maxTransaction
        );

      reason =
        `Actual transaction amount ${actualTransactionAmount} exceeds the policy limit of ${maximum}.`;
    } else if (!intentMatched) {
      reason =
        "The agent action does not match its declared intent.";
    } else if (!parameterMatched) {
      reason =
        analysis.decodedParameters?.error ||
        `Actual calldata amount ${analysis.decodedParameters?.actualAmount} does not match declared intent amount ${intent.amount}.`;
    } else if (!executionTypeMatched) {
      reason =
        "The actual blockchain execution type does not match the authorized intent.";
    } else if (!nativeValueMatched) {
      reason =
        `Transaction native value ${verification.actualNativeValue} does not match authorized native value ${verification.expectedNativeValue}.`;
    } else if (!parameterChecks.assetAddressMatched) {
      reason =
        `Actual input token ${verification.actualAssetAddress || "unknown"} does not match the authorized asset address ${verification.expectedAssetAddress}.`;
    } else if (!protocolMatched) {
      reason =
        "The transaction targets a protocol different from the declared intent.";
    } else if (!transactionSecuritySafe) {
      reason =
        "AgentGuard detected a transaction-security threat.";
    } else {
      reason =
        "Transaction satisfies policy, intent, parameters, protocol and transaction-security checks.";
    }

    const proofDecision = {
      authorized,
      policyPassed,
      intentMatched,
      parameterMatched,
      executionTypeMatched,
      nativeValueMatched,
      protocolMatched,
      transactionSecuritySafe
    };

    const proofSpecification =
      buildAuthorizationProofSpec({
        agent,
        transaction,
        intent,
        policy,
        analysis,
        decision: proofDecision
      });

    const proofClaims =
      buildProofClaims(proofSpecification);

    const proofCommitment =
      createProofCommitment(proofSpecification);

    return res.json({
      authorized,

      proof: {
        version: proofSpecification.version,
        claim: proofClaims.claim,
        decision: proofSpecification.decision,
        commitment: proofCommitment.commitment,
        algorithm: proofCommitment.algorithm,
        statement: proofSpecification
      },

      agent,
      action,
      intent,

      policyPassed,
      intentMatched,
      parameterMatched,
      nativeValueMatched,
      protocolMatched,
      transactionSecuritySafe,

      actualTransactionAmount,
      declaredIntentAmount: intent.amount,

      policyMaximum:
        Number(
          policy.maxTransactionAmount ??
          policy.maxTransaction
        ),

      transaction,

      decodedTransaction: {
        contract: analysis.contractName,
        protocol: analysis.protocol,
        selector: analysis.decodedFunction?.selector,
        function: analysis.decodedFunction?.name,
        category: analysis.decodedFunction?.category,
        parameters: analysis.decodedParameters
      },

      risk: (
        analysis.risk === "CRITICAL"
          ? "CRITICAL"
          : !policyPassed
            ? "HIGH"
            : analysis.risk
      ),

      verdict: {
        policy: policyPassed ? "PASSED" : "FAILED",
        intent: intentMatched ? "MATCHED" : "MISMATCH",
        parameters: parameterMatched ? "MATCHED" : "MISMATCH",
        protocol: protocolMatched ? "MATCHED" : "MISMATCH",
        contract: analysis.contractKnown ? "KNOWN" : "UNKNOWN",
        transactionSecurity:
          transactionSecuritySafe
            ? "SAFE"
            : "THREAT DETECTED"
      },

      securityFlags: analysis.securityFlags,
      parameterFlags: analysis.parameterFlags,

      reason
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});

app.get("/chain-status", async (req, res) => {
  const results = {};

  for (const [key, chain] of Object.entries(chains)) {
    try {
      const response = await fetch(chain.rpc, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_chainId",
          params: [],
          id: 1
        })
      });

      const data = await response.json();

      const actualChainId =
        data.result
          ? parseInt(data.result, 16)
          : null;

      results[key] = {
        name: chain.name,
        rpc: chain.rpc,
        expectedChainId: chain.chainId,
        actualChainId,
        connected: Boolean(actualChainId),
        chainMatches: actualChainId === chain.chainId
      };
    } catch (error) {
      results[key] = {
        name: chain.name,
        rpc: chain.rpc,
        expectedChainId: chain.chainId,
        connected: false,
        chainMatches: false,
        error: error.message
      };
    }
  }

  const allConnected =
    Object.values(results).every(
      chain => chain.connected && chain.chainMatches
    );

  res.json({
    connected: allConnected,
    chains: results
  });
});



app.get("/latest-block/:chain", async (req, res) => {
  const { chain } = req.params;
  const chainConfig = chains[chain];

  if (!chainConfig) {
    return res.status(400).json({
      error: "Unsupported chain",
      supportedChains: Object.keys(chains)
    });
  }

  try {
    const response = await fetch(chainConfig.rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: ["latest", true],
        id: 1
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({
        error: "RPC error",
        details: data.error
      });
    }

    if (!data.result) {
      return res.status(404).json({
        error: "Latest block unavailable"
      });
    }

    const block = data.result;

    res.json({
      chain: {
        key: chain,
        name: chainConfig.name,
        chainId: chainConfig.chainId
      },
      block: {
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactionCount: block.transactions.length
      },
      transactions: block.transactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        input: tx.input
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to read latest block",
      details: error.message
    });
  }
});

app.get("/transaction/:chain/:hash", async (req, res) => {
  const { chain, hash } = req.params;

  const chainConfig = chains[chain];

  if (!chainConfig) {
    return res.status(400).json({
      error: "Unsupported chain",
      supportedChains: Object.keys(chains)
    });
  }

  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return res.status(400).json({
      error: "Invalid transaction hash"
    });
  }

  try {
    const response = await fetch(chainConfig.rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionByHash",
        params: [hash],
        id: 1
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(502).json({
        error: "RPC error",
        details: data.error
      });
    }

    if (!data.result) {
      return res.status(404).json({
        error: "Transaction not found",
        chain: chainConfig.name,
        hash
      });
    }

    const tx = data.result;

    res.json({
      found: true,

      chain: {
        key: chain,
        name: chainConfig.name,
        chainId: chainConfig.chainId
      },

      transaction: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        nonce: tx.nonce,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        input: tx.input,
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber,
        transactionIndex: tx.transactionIndex
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to read transaction",
      details: error.message
    });
  }
});


app.get("/decode-transaction/:chain/:hash", async (req, res) => {
  try {
    const { chain, hash } = req.params;
    const chainConfig = chains[chain];

    if (!chainConfig) {
      return res.status(400).json({
        error: "Unknown chain",
        supportedChains: Object.keys(chains)
      });
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      return res.status(400).json({
        error: "Invalid transaction hash"
      });
    }

    const response = await fetch(chainConfig.rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [hash]
      })
    });

    const rpc = await response.json();
    const tx = rpc.result;

    if (!tx) {
      return res.status(404).json({
        found: false,
        chain: chainConfig.name,
        hash
      });
    }

    const selector = tx.input.slice(0, 10).toLowerCase();

    const decodedFunction =
      functionSelectors[selector] || {
        name: "Unknown Function",
        category: "unknown"
      };

    const decodedParameters = decodeParameters(
      tx.input,
      decodedFunction.category
    );

    const result = {
      found: true,

      chain: {
        key: chain,
        name: chainConfig.name,
        chainId: chainConfig.chainId
      },

      transaction: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        input: tx.input
      },

      decoded: {
        selector,
        function: decodedFunction.name,
        category: decodedFunction.category,
        parameters: decodedParameters
      }
    };

    res.json(result);

  } catch (error) {
    console.error("Decode transaction error:", error);

    res.status(500).json({
      error: "Failed to decode transaction",
      message: error.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    service: "AgentGuard",
    status: "running",
    analyzer: "EVM parameter verification",
    mode: "local simulation"
  });
});



/*
 * Phorva Developer Authentication / Management
 *
 * Human developer authentication is intentionally
 * separate from project API-key authentication.
 *
 * Developer session:
 *   Browser dashboard -> developer session cookie
 *
 * Project API key:
 *   Agent/application -> pk_test_/pk_live_ -> /v1/*
 *
 * Project management always verifies ownership against
 * the authenticated developer identity.
 */

const DEVELOPER_SESSION_COOKIE =
  "phorva_developer_session";

const DEVELOPER_SESSION_SECURE =
  process.env.NODE_ENV === "production";

function parseCookies(req) {
  const header = req.headers.cookie;

  if (
    typeof header !== "string" ||
    !header
  ) {
    return {};
  }

  const cookies = {};

  for (const part of header.split(";")) {
    const index = part.indexOf("=");

    if (index === -1) {
      continue;
    }

    const name =
      part.slice(0, index).trim();

    const value =
      part.slice(index + 1).trim();

    if (!name) {
      continue;
    }

    try {
      cookies[name] =
        decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }

  return cookies;
}

function getDeveloperSession(req) {
  const cookies =
    parseCookies(req);

  const token =
    cookies[DEVELOPER_SESSION_COOKIE];

  if (!token) {
    return null;
  }

  return developerStore
    .authenticateSession(token);
}

function setDeveloperSessionCookie(
  res,
  token,
  expiresAt
) {
  const maxAgeSeconds =
    Math.max(
      0,
      Math.floor(
        (
          Date.parse(expiresAt) -
          Date.now()
        ) / 1000
      )
    );

  const attributes = [
    `${DEVELOPER_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];

  if (DEVELOPER_SESSION_SECURE) {
    attributes.push("Secure");
  }

  res.setHeader(
    "Set-Cookie",
    attributes.join("; ")
  );
}

function clearDeveloperSessionCookie(res) {
  const attributes = [
    `${DEVELOPER_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0"
  ];

  if (DEVELOPER_SESSION_SECURE) {
    attributes.push("Secure");
  }

  res.setHeader(
    "Set-Cookie",
    attributes.join("; ")
  );
}

function developerAuth(
  req,
  res,
  next
) {
  const session =
    getDeveloperSession(req);

  if (!session) {
    return res.status(401).json({
      error: {
        code: "DEVELOPER_AUTH_REQUIRED",
        message:
          "Developer authentication is required"
      }
    });
  }

  req.developerIdentity = session;

  return next();
}

function requireOwnedProject(
  req,
  res,
  next
) {
  const developerId =
    req.developerIdentity?.developerId;

  const projectId =
    req.params.id ||
    req.body?.projectId ||
    req.query?.projectId;

  if (
    !developerId ||
    !projectId
  ) {
    return res.status(404).json({
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      }
    });
  }

  const owned =
    apiKeyStore.developerOwnsProject(
      developerId,
      projectId
    );

  if (!owned) {
    return res.status(404).json({
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found"
      }
    });
  }

  req.developerProjectId =
    projectId;

  return next();
}

/*
 * Developer management API rate limiting.
 *
 * This protects the entire browser-facing developer
 * management surface, including authenticated
 * project and API-key operations.
 */
app.use(
  "/v1/developer",
  createDeveloperRateLimiter()
);

/*
 * Create developer account.
 *
 * A successful signup immediately establishes
 * a dashboard session.
 */
/*
 * Developer management API rate limiting.
 *
 * Protects the complete browser-facing developer
 * management surface, including authenticated
 * project and API-key operations.
 */

app.post(
  "/v1/developer/signup",
  requireTrustedOrigin,
  createAuthRateLimiter(),
  async (req, res) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim()
          : "";

      const password =
        typeof req.body?.password === "string"
          ? req.body.password
          : "";

      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Email and password are required"
          }
        });
      }

      const pending =
        developerStore.createDeveloper({
          email,
          password
        });

      const developer =
        await pending.create();

      const session =
        developerStore.createSession(
          developer.id
        );

      setDeveloperSessionCookie(
        res,
        session.token,
        session.expiresAt
      );

      return res.status(201).json({
        developer: {
          id: developer.id,
          email: developer.email,
          status: developer.status,
          createdAt:
            developer.created_at
        }
      });
    } catch (error) {
      if (
        error?.code === "INVALID_EMAIL"
      ) {
        return res.status(400).json({
          error: {
            code: "INVALID_EMAIL",
            message:
              "A valid email address is required"
          }
        });
      }

      if (
        error?.code === "DEVELOPER_EXISTS"
      ) {
        return res.status(409).json({
          error: {
            code: "DEVELOPER_EXISTS",
            message:
              "Developer account already exists"
          }
        });
      }

      if (
        error?.message ===
        "Password must be between 12 and 128 characters"
      ) {
        return res.status(400).json({
          error: {
            code: "INVALID_PASSWORD",
            message: error.message
          }
        });
      }

      console.error(
        "Developer signup error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "DEVELOPER_SIGNUP_FAILED",
          message:
            "Could not create developer account"
        }
      });
    }
  }
);

/*
 * Request a developer password reset.
 *
 * The response is intentionally generic so the endpoint
 * does not reveal whether an email address belongs to a
 * Phorva developer account.
 *
 * In development, the reset URL is returned so the flow
 * can be tested without an email provider. Production
 * delivery should be connected to the application's
 * transactional email provider before enabling this
 * response mode for users.
 */
app.post(
  "/v1/developer/forgot-password",
  requireTrustedOrigin,
  createAuthRateLimiter(),
  (req, res) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim()
          : "";

      if (!email) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Email is required"
          }
        });
      }

      const result =
        developerStore.createPasswordResetToken(
          email
        );

      /*
       * Never expose account existence through the normal
       * response. The development reset URL is included only
       * outside production for local testing.
       */
      const response = {
        accepted: true,
        message:
          "If an account exists for that email, password reset instructions have been prepared."
      };

      if (
        process.env.NODE_ENV !==
        "production" &&
        result.developer
      ) {
        response.developmentResetUrl =
          `/developer/reset-password.html?token=${encodeURIComponent(result.token)}`;

        response.expiresAt =
          result.expiresAt;
      }

      return res.json(response);
    } catch (error) {
      console.error(
        "Developer password reset request error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "PASSWORD_RESET_REQUEST_FAILED",
          message:
            "Unable to process the password reset request"
        }
      });
    }
  }
);

/*
 * Complete a developer password reset.
 */
app.post(
  "/v1/developer/reset-password",
  requireTrustedOrigin,
  createAuthRateLimiter(),
  async (req, res) => {
    try {
      const token =
        typeof req.body?.token === "string"
          ? req.body.token.trim()
          : "";

      const password =
        typeof req.body?.password === "string"
          ? req.body.password
          : "";

      if (!token || !password) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Reset token and password are required"
          }
        });
      }

      const result =
        await developerStore.resetPassword(
          token,
          password
        );

      if (!result.success) {
        const status =
          result.code ===
          "RESET_TOKEN_EXPIRED"
            ? 410
            : 400;

        return res.status(status).json({
          error: {
            code: result.code,
            message:
              result.code ===
              "RESET_TOKEN_EXPIRED"
                ? "Password reset link has expired"
                : "Invalid or already used password reset link"
          }
        });
      }

      /*
       * There is no active session after a password reset.
       * The user must authenticate again with the new password.
       */
      clearDeveloperSessionCookie(res);

      return res.json({
        reset: true,
        message:
          "Password reset successfully. Please sign in with your new password."
      });
    } catch (error) {
      console.error(
        "Developer password reset error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "PASSWORD_RESET_FAILED",
          message:
            "Unable to reset developer password"
        }
      });
    }
  }
);

/*
 * Developer login.
 */
app.post(
  "/v1/developer/login",
  requireTrustedOrigin,
  createAuthRateLimiter(),
  async (req, res) => {
    try {
      const email =
        typeof req.body?.email === "string"
          ? req.body.email.trim()
          : "";

      const password =
        typeof req.body?.password === "string"
          ? req.body.password
          : "";

      if (!email || !password) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Email and password are required"
          }
        });
      }

      const developer =
        await developerStore.authenticate(
          email,
          password
        );

      if (!developer) {
        return res.status(401).json({
          error: {
            code: "INVALID_CREDENTIALS",
            message:
              "Invalid email or password"
          }
        });
      }

      const session =
        developerStore.createSession(
          developer.id
        );

      setDeveloperSessionCookie(
        res,
        session.token,
        session.expiresAt
      );

      return res.json({
        developer: {
          id: developer.id,
          email: developer.email,
          status: developer.status
        }
      });
    } catch (error) {
      console.error(
        "Developer login error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "DEVELOPER_LOGIN_FAILED",
          message:
            "Could not authenticate developer"
        }
      });
    }
  }
);

/*
 * Developer logout.
 */
app.post(
  "/v1/developer/logout",
  requireTrustedOrigin,
  (req, res) => {
    const cookies =
      parseCookies(req);

    const token =
      cookies[DEVELOPER_SESSION_COOKIE];

    if (token) {
      developerStore.revokeSession(token);
    }

    clearDeveloperSessionCookie(res);

    return res.json({
      loggedOut: true
    });
  }
);

/*
 * Current developer identity.
 */
app.get(
  "/v1/developer/me",
  developerAuth,
  (req, res) => {
    const developer =
      developerStore.getById(
        req.developerIdentity.developerId
      );

    if (!developer) {
      clearDeveloperSessionCookie(res);

      return res.status(401).json({
        error: {
          code: "DEVELOPER_AUTH_REQUIRED",
          message:
            "Developer authentication is required"
        }
      });
    }

    return res.json({
      developer: {
        id: developer.id,
        email: developer.email,
        status: developer.status,
        createdAt:
          developer.created_at,
        updatedAt:
          developer.updated_at
      }
    });
  }
);

/*
 * Developer projects.
 */
app.get(
  "/v1/developer/projects",
  developerAuth,
  (req, res) => {
    const projects =
      apiKeyStore.listProjects(
        req.developerIdentity.developerId
      );

    return res.json({
      projects
    });
  }
);

/*
 * Create project owned by the
 * authenticated developer.
 */
app.post(
  "/v1/developer/projects",
  requireTrustedOrigin,
  developerAuth,
  (req, res) => {
    try {
      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "";

      if (!name) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Project name is required"
          }
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          error: {
            code: "INVALID_REQUEST",
            message:
              "Project name must be 100 characters or less"
          }
        });
      }

      /*
       * =====================================================
       * PHORVA USE CASE
       * =====================================================
       *
       * One project must establish what the developer is
       * building.
       *
       * Developers do NOT manually configure:
       * swap / transfer / bridge / trade / approve / etc.
       *
       * Those are derived from actual execution activity.
       */
      const rawUseCase =
        typeof req.body?.useCase === "string"
          ? req.body.useCase.trim()
          : typeof req.body?.use_case === "string"
            ? req.body.use_case.trim()
            : "";

      if (!rawUseCase) {
        return res.status(400).json({
          error: {
            code: "USE_CASE_REQUIRED",
            message:
              "A Phorva use case is required when creating a project.",
            useCases: getUseCases()
          }
        });
      }

      if (!isValidUseCase(rawUseCase)) {
        return res.status(400).json({
          error: {
            code: "INVALID_USE_CASE",
            message:
              "The selected Phorva use case is not valid.",
            useCases: getUseCases()
          }
        });
      }

      const selectedUseCase =
        getUseCase(rawUseCase);

      /*
       * =====================================================
       * OPTIONAL EXPLICIT LIMITS
       * =====================================================
       *
       * These are company-defined hard controls.
       *
       * They are intentionally separate from Phorva's
       * adaptive execution baseline.
       */
      const maxTransactionAmount =
        req.body?.maxTransactionAmount ??
        req.body?.max_transaction_amount;

      const agentTransactionLimit =
        req.body?.agentTransactionLimit ??
        req.body?.agent_transaction_limit;

      const dailyLimit =
        req.body?.dailyLimit ??
        req.body?.daily_limit;

      let securityProfile;

      try {
        securityProfile =
          createSecurityProfile({
            useCase: selectedUseCase.id,
            maxTransactionAmount,
            agentTransactionLimit,
            dailyLimit
          });
      } catch (profileError) {
        return res.status(400).json({
          error: {
            code: "INVALID_SECURITY_PROFILE",
            message:
              profileError.message
          }
        });
      }

      /*
       * Keep the legacy fields for compatibility with the
       * existing Developer Platform.
       *
       * The canonical Phorva use case is represented as the
       * single selected use case.
       */
      const useCases = [
        selectedUseCase.id
      ];

      /*
       * Action types are intentionally NOT supplied by the
       * developer. Phorva determines the relevant execution
       * surface from the actual activity.
       */
      const actions = [];

      const policy =
        req.body?.policy &&
        typeof req.body.policy === "object" &&
        !Array.isArray(req.body.policy)
          ? req.body.policy
          : {};

      const project =
        apiKeyStore.createProject({
          name,
          developerId:
            req.developerIdentity.developerId,
          useCases,
          actions,
          policy,
          securityProfile
        });

      return res.status(201).json({
        project
      });

    } catch (error) {
      console.error(
        "Developer project creation error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "PROJECT_CREATION_FAILED",
          message:
            "Could not create project"
        }
      });
    }
  }
);

/*
 * Get one owned project.
 */


app.get(
  "/v1/developer/projects/:id",
  developerAuth,
  requireOwnedProject,
  (req, res) => {
    const project =
      apiKeyStore.getProject(
        req.developerProjectId
      );

    if (!project) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    return res.json({
      project: {
        id: project.id,
        name: project.name,
        useCases: Array.isArray(project.use_cases)
          ? project.use_cases
          : [],
        actions: Array.isArray(project.actions)
          ? project.actions
          : [],
        policy:
          project.policy &&
          typeof project.policy === "object" &&
          !Array.isArray(project.policy)
            ? project.policy
            : {},

        securityProfile:
          project.security_profile &&
          typeof project.security_profile === "object" &&
          !Array.isArray(project.security_profile)
            ? project.security_profile
            : null,

        createdAt:
          project.created_at,
        updatedAt:
          project.updated_at ||
          project.created_at
      }
    });
  }
);

/*
 * Update an owned developer project.
 *
 * Developers configure the security posture here.
 * Action types are intentionally not accepted.
 */
app.patch(
  "/v1/developer/projects/:id",
  requireTrustedOrigin,
  developerAuth,
  requireOwnedProject,
  (req, res) => {
    try {
      const body =
        req.body &&
        typeof req.body === "object" &&
        !Array.isArray(req.body)
          ? req.body
          : {};

      const updates = {};

      if (body.name !== undefined) {
        updates.name = body.name;
      }

      /*
       * A project has one canonical use case.
       * Do not allow arbitrary action configuration.
       */
      if (body.useCase !== undefined) {
        if (
          typeof body.useCase !== "string" ||
          !body.useCase.trim()
        ) {
          return res.status(400).json({
            error: {
              code: "INVALID_USE_CASE",
              message:
                "useCase must be a non-empty string"
            }
          });
        }

        const selectedUseCase =
          getUseCase(
            body.useCase.trim()
          );

        if (!selectedUseCase) {
          return res.status(400).json({
            error: {
              code: "INVALID_USE_CASE",
              message:
                "Unsupported Phorva use case"
            }
          });
        }

        updates.useCases =
          [selectedUseCase.id];
      }

      if (body.policy !== undefined) {
        updates.policy =
          body.policy;
      }

      /*
       * Security profile updates are constructed
       * from the canonical project settings rather
       * than accepting arbitrary profile internals.
       */
      if (
        body.maxTransactionAmount !== undefined ||
        body.agentTransactionLimit !== undefined ||
        body.dailyLimit !== undefined ||
        body.useCase !== undefined
      ) {
        const project =
          apiKeyStore.getProject(
            req.developerProjectId
          );

        const currentProfile =
          project?.security_profile || {};

        const currentLimits =
          currentProfile.explicitLimits || {};

        const selectedUseCase =
          body.useCase !== undefined
            ? getUseCase(
                body.useCase.trim()
              )
            : getUseCase(
                Array.isArray(project?.use_cases)
                  ? project.use_cases[0]
                  : ""
              );

        if (!selectedUseCase) {
          return res.status(400).json({
            error: {
              code: "INVALID_USE_CASE",
              message:
                "Project must have a valid use case"
            }
          });
        }

        updates.securityProfile =
          createSecurityProfile({
            useCase:
              selectedUseCase.id,
            maxTransactionAmount:
              body.maxTransactionAmount !== undefined
                ? body.maxTransactionAmount
                : currentLimits.maxTransactionAmount,
            agentTransactionLimit:
              body.agentTransactionLimit !== undefined
                ? body.agentTransactionLimit
                : currentLimits.agentTransactionLimit,
            dailyLimit:
              body.dailyLimit !== undefined
                ? body.dailyLimit
                : currentLimits.dailyLimit
          });
      }

      /*
       * No editable action field is accepted.
       * The execution surface remains derived from
       * actual agent activity.
       */
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "actions"
        )
      ) {
        return res.status(400).json({
          error: {
            code: "ACTIONS_NOT_CONFIGURABLE",
            message:
              "Action types are determined from actual activity and cannot be manually configured"
          }
        });
      }

      const project =
        apiKeyStore.updateProject(
          req.developerProjectId,
          updates
        );

      return res.status(200).json({
        project
      });
    } catch (error) {
      console.error(
        "developer project update error:",
        error
      );

      return res.status(400).json({
        error: {
          code: "PROJECT_UPDATE_FAILED",
          message:
            error.message ||
            "Unable to update project"
        }
      });
    }
  }
);

/*
 * List API keys belonging to an
 * authenticated developer's project.
 */
app.get(
  "/v1/developer/projects/:id/api-keys",
  developerAuth,
  requireOwnedProject,
  (req, res) => {
    return res.json({
      keys:
        apiKeyStore.list(
          req.developerProjectId
        )
    });
  }
);

/*
 * Create project API key.
 *
 * The plaintext secret is returned only here.
 * It is never stored in the database.
 */
app.post(
  "/v1/developer/projects/:id/api-keys",
  requireTrustedOrigin,
  developerAuth,
  requireOwnedProject,
  (req, res) => {
    try {
      const name =
        typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "Default";

      const environment =
        req.body?.environment === "test"
          ? "test"
          : "live";

      const result =
        apiKeyStore.createKey({
          projectId:
            req.developerProjectId,
          name,
          environment
        });

      return res.status(201).json({
        key: result
      });
    } catch (error) {
      console.error(
        "Developer API key creation error:",
        error
      );

      return res.status(500).json({
        error: {
          code: "API_KEY_CREATION_FAILED",
          message:
            "Could not create API key"
        }
      });
    }
  }
);

/*
 * Revoke an API key belonging to
 * the authenticated developer's project.
 */
app.post(
  "/v1/developer/projects/:id/api-keys/:keyId/revoke",
  requireTrustedOrigin,
  developerAuth,
  requireOwnedProject,
  (req, res) => {
    const key =
      apiKeyStore.getKey(
        req.params.keyId
      );

    if (
      !key ||
      key.project_id !==
        req.developerProjectId
    ) {
      return res.status(404).json({
        error: {
          code: "API_KEY_NOT_FOUND",
          message:
            "API key not found"
        }
      });
    }

    const revoked =
      apiKeyStore.revoke(
        req.params.keyId
      );

    if (!revoked) {
      return res.status(404).json({
        error: {
          code: "API_KEY_NOT_FOUND",
          message:
            "API key not found or already revoked"
        }
      });
    }

    return res.json({
      revoked: true,
      id: req.params.keyId
    });
  }
);

/*
 * Phorva Production API v1
 *
 * Generic verification boundary for autonomous
 * agent execution. The API delegates authorization
 * to the existing Phorva verification engine.
 */

const productionApi = createProductionApi({
  express,
  agentStore,

  verify: async ({
    agent,
    action,
    intent,
    policy,
    transaction,
    phorvaIdentity
  }) => {
    const projectId =
      phorvaIdentity?.projectId;

    if (!projectId) {
      throw new Error(
        "Authenticated Phorva project identity is required"
      );
    }

    const project =
      apiKeyStore.getProject(projectId);

    if (!project) {
      throw new Error(
        "Authenticated Phorva project was not found"
      );
    }

    const securityProfile =
      (project.securityProfile || project.security_profile) &&
      typeof (project.securityProfile || project.security_profile) === "object" &&
      !Array.isArray(project.securityProfile || project.security_profile)
        ? (project.securityProfile || project.security_profile)
        : null;

    const agentId =
      agent?.id ??
      agent?.agentId;

    const registeredAgent =
      agentStore.getAgent(
        projectId,
        agentId
      );

    if (!registeredAgent) {
      throw new Error(
        "Agent is not registered to the authenticated Phorva project"
      );
    }

    if (registeredAgent.revoked_at) {
      throw new Error(
        "Agent is revoked"
      );
    }

    const registeredPolicy =
      registeredAgent.policy &&
      typeof registeredAgent.policy === "object" &&
      !Array.isArray(registeredAgent.policy)
        ? registeredAgent.policy
        : {};

    const explicitLimits =
      securityProfile?.explicitLimits &&
      typeof securityProfile.explicitLimits === "object" &&
      !Array.isArray(securityProfile.explicitLimits)
        ? securityProfile.explicitLimits
        : {};

    const finiteLimit = value => {
      const number = Number(value);

      return Number.isFinite(number) &&
        number >= 0
        ? number
        : null;
    };

    const minimumConfiguredLimit = (...values) => {
      const limits =
        values
          .map(finiteLimit)
          .filter(value => value !== null);

      return limits.length > 0
        ? Math.min(...limits)
        : undefined;
    };

    /*
     * Phorva owns the project-level security ceiling.
     *
     * Existing agent policy remains active, but a project
     * security profile can never be bypassed by an agent
     * policy with a higher limit.
     */
    const effectivePolicy = {
      ...registeredPolicy
    };

    const projectMaxTransaction =
      finiteLimit(
        explicitLimits.maxTransactionAmount
      );

    const agentTransactionLimit =
      finiteLimit(
        explicitLimits.agentTransactionLimit
      );

    const registeredMaxTransaction =
      minimumConfiguredLimit(
        registeredPolicy.maxTransactionAmount,
        registeredPolicy.maxTransaction
      );

    const effectiveMaxTransaction =
      minimumConfiguredLimit(
        projectMaxTransaction,
        agentTransactionLimit,
        registeredMaxTransaction
      );

    if (effectiveMaxTransaction !== undefined) {
      effectivePolicy.maxTransactionAmount =
        effectiveMaxTransaction;
    }

    const projectDailyLimit =
      finiteLimit(
        explicitLimits.dailyLimit
      );

    const registeredDailyLimit =
      finiteLimit(
        registeredPolicy.dailyLimit
      );

    const effectiveDailyLimit =
      minimumConfiguredLimit(
        projectDailyLimit,
        registeredDailyLimit
      );

    if (effectiveDailyLimit !== undefined) {
      effectivePolicy.dailyLimit =
        effectiveDailyLimit;
    }

    const verification =
      verifyExecutionAuthorization({
        agent: registeredAgent,
        action,
        intent,
        policy: effectivePolicy,
        transaction
      });

    let baselineDecision = null;
    let reviewRequired = false;
    let reviewReason = null;

    const currentBaseline =
      securityProfile?.adaptiveBaseline &&
      typeof securityProfile.adaptiveBaseline === "object" &&
      !Array.isArray(securityProfile.adaptiveBaseline)
        ? securityProfile.adaptiveBaseline
        : {
            enabled: true,
            status: "INITIALIZING",
            observationCount: 0,
            normalRange: null
          };

    const actualAmount =
      Number(verification.actualTransactionAmount);

    if (
      verification.authorized === true &&
      currentBaseline.enabled === true &&
      Number.isFinite(actualAmount) &&
      actualAmount >= 0
    ) {
      const observationCount =
        Number(currentBaseline.observationCount) || 0;

      const range =
        currentBaseline.normalRange &&
        typeof currentBaseline.normalRange === "object" &&
        !Array.isArray(currentBaseline.normalRange)
          ? currentBaseline.normalRange
          : null;

      if (
        currentBaseline.status === "ESTABLISHED" &&
        range &&
        Number.isFinite(Number(range.min)) &&
        Number.isFinite(Number(range.max))
      ) {
        const min = Number(range.min);
        const max = Number(range.max);

        const lowerBound =
          min === 0
            ? 0
            : min * 0.5;

        const upperBound =
          max === 0
            ? 0
            : max * 2;

        if (
          actualAmount < lowerBound ||
          actualAmount > upperBound
        ) {
          baselineDecision = "ABNORMAL";
          reviewRequired = true;
          reviewReason =
            "Transaction amount is outside the agent's established adaptive baseline.";
        } else {
          baselineDecision = "NORMAL";
        }
      }

      if (!reviewRequired) {
        const nextCount = observationCount + 1;

        const nextMin =
          range &&
          Number.isFinite(Number(range.min))
            ? Math.min(Number(range.min), actualAmount)
            : actualAmount;

        const nextMax =
          range &&
          Number.isFinite(Number(range.max))
            ? Math.max(Number(range.max), actualAmount)
            : actualAmount;

        const nextStatus =
          nextCount >= 5
            ? "ESTABLISHED"
            : "INITIALIZING";

        const updatedAdaptiveBaseline = {
          ...currentBaseline,
          status: nextStatus,
          observationCount: nextCount,
          normalRange: {
            min: nextMin,
            max: nextMax
          },
          lastObservedAt:
            new Date().toISOString()
        };

        const updatedSecurityProfile = {
          ...securityProfile,
          adaptiveBaseline:
            updatedAdaptiveBaseline
        };

        if (typeof apiKeyStore?.updateProject === "function") {
          apiKeyStore.updateProject(
            projectId,
            {
              securityProfile:
                updatedSecurityProfile
            }
          );
        }

        currentBaseline.enabled =
          updatedAdaptiveBaseline.enabled;
        currentBaseline.status =
          updatedAdaptiveBaseline.status;
        currentBaseline.observationCount =
          updatedAdaptiveBaseline.observationCount;
        currentBaseline.normalRange =
          updatedAdaptiveBaseline.normalRange;
        currentBaseline.lastObservedAt =
          updatedAdaptiveBaseline.lastObservedAt;
      }
    }

    return {
      ...verification,
      reviewRequired,
      reviewReason,
      baselineDecision,
      securityContext: {
        projectId,
        projectName: project.name,
        useCases: Array.isArray(project.useCases)
          ? project.useCases
          : Array.isArray(project.use_cases)
            ? project.use_cases
            : [],
        securityProfileId:
          securityProfile?.id || null,
        securityProfileVersion:
          securityProfile?.version || null,
        adaptiveBaseline:
          currentBaseline,
        explicitLimits: {
          maxTransactionAmount:
            effectiveMaxTransaction !== undefined
              ? effectiveMaxTransaction
              : null,
          agentTransactionLimit:
            agentTransactionLimit,
          dailyLimit:
            effectiveDailyLimit !== undefined
              ? effectiveDailyLimit
              : null
        }
      }
    };

  },

  getHealth: async () => ({
    service: "phorva-api",
    status: "ok",
    engine: "phorva-verification-engine",
    verificationMode: "PURE_EXECUTION_VERIFICATION",
    analyzer: "EVM parameter verification"
  }),

  recordExecution: record => {
    return executionRecordStore.createRecord(
      record
    );
  },

  listExecutions: ({ projectId, limit }) => {
    return executionRecordStore.listByProject(
      projectId,
      limit
    );
  },

  listReviews: ({ projectId, limit }) => {
    return executionRecordStore.listReviews(
      projectId,
      limit
    );
  },

  getReview: ({
    projectId,
    verificationId
  }) => {
    const record =
      executionRecordStore.getByVerificationId(
        verificationId
      );

    if (
      !record ||
      record.project_id !== projectId ||
      !record.review ||
      record.review.required !== true
    ) {
      return null;
    }

    return record;
  },

  updateReview: ({
    projectId,
    verificationId,
    decision,
    reason
  }) => {
    return executionRecordStore.updateReview(
      verificationId,
      projectId,
      decision,
      reason
    );
  },

  createSecurityAlert: alert => {
    return securityAlertStore.createAlert(
      alert
    );
  },

  listSecurityAlerts: ({
    projectId,
    limit
  }) => {
    return securityAlertStore.listByProject(
      projectId,
      limit
    );
  },

  resolveSecurityAlert: ({
    projectId,
    alertId
  }) => {
    return securityAlertStore.resolveAlert(
      alertId,
      projectId
    );
  },

  authenticate: async (req) => {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return false;
    }

    const suppliedKey =
      authorization.slice("Bearer ".length).trim();

    if (!suppliedKey) {
      return false;
    }

    const identity =
      apiKeyStore.authenticate(suppliedKey);

    if (!identity) {
      return false;
    }

    req.phorvaIdentity = identity;

    return true;
  }
});

app.use(
  "/v1",
  createApiRateLimiter(),
  productionApi
);


// PHORVA_DOCS_ROUTES
const phorvaDocsRoutes = [
  "/docs",
  "/docs/",
  "/docs/actions/approvals",
  "/docs/actions/bridges",
  "/docs/actions/custom-calls",
  "/docs/actions/defi",
  "/docs/actions/multi-step",
  "/docs/actions/swaps",
  "/docs/actions/transfers",
  "/docs/actions/withdrawals",
  "/docs/api",
  "/docs/architecture",
  "/docs/authentication",
  "/docs/connect",
  "/docs/core-concepts",
  "/docs/developer/api",
  "/docs/developer/api-keys",
  "/docs/developer/errors",
  "/docs/developer/integration",
  "/docs/developer/sdk",
  "/docs/infrastructure/chains",
  "/docs/infrastructure/protocols",
  "/docs/infrastructure/providers",
  "/docs/infrastructure/security",
  "/docs/introduction",
  "/docs/phorva-vs-infrastructure",
  "/docs/quickstart",
  "/docs/roadmap",
  "/docs/sdk",
  "/docs/security/architecture",
  "/docs/security/auditability",
  "/docs/security/threat-model",
  "/docs/security/verification-integrity",
  "/docs/use-cases",
  "/docs/use-cases/agent-payments",
  "/docs/use-cases/agent-wallets",
  "/docs/use-cases/autonomous-trading",
  "/docs/use-cases/daos-treasuries",
  "/docs/use-cases/defi",
  "/docs/use-cases/gaming",
  "/docs/use-cases/onchain-automation",
  "/docs/use-cases/prediction-markets",
  "/docs/use-cases/virtual-cards",
  "/docs/verification/authorization",
  "/docs/verification/commitment",
  "/docs/verification/execution-graph",
  "/docs/verification/failure-states",
  "/docs/verification/final-state",
  "/docs/verification/intent",
  "/docs/verification/policy",
  "/docs/verification/proof",
  "/docs/verification/receipts",
  "/docs/verification/risk",
  "/docs/verification/security-model",
  "/docs/verification/semantics",
  "/docs/verification/trace",
  "/docs/verification/transaction",
  "/docs/verification/transaction-analysis",
  "/docs/what-is"
];

app.get(phorvaDocsRoutes, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "docs", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});


// Global HTTP error boundary.
// Prevents parser/framework errors from exposing stack traces,
// internal paths, or implementation details to API clients.
app.use((error, req, res, next) => {
  const requestId =
    typeof req.requestId === "string" &&
    req.requestId
      ? req.requestId
      : `req_${require("crypto").randomUUID()}`;

  if (res.headersSent) {
    return next(error);
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      requestId,
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON"
      }
    });
  }

  if (
    error &&
    (
      error.type === "entity.too.large" ||
      error.status === 413
    )
  ) {
    return res.status(413).json({
      requestId,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request payload exceeds the allowed size"
      }
    });
  }

  console.error("Unhandled HTTP error:", error);

  return res.status(
    error && Number.isInteger(error.status)
      ? error.status
      : 500
  ).json({
    requestId,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred"
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AgentGuard running on port ${PORT}`);
    console.log("Security verdict engine enabled");
  });
}

module.exports = app;
