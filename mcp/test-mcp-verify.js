import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
  name: "phorva-mcp-verify-test",
  version: "0.1.0"
});

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["src/index.js"],
  env: {
    ...process.env,
    PHORVA_BASE_URL: "http://localhost:3000",
    PHORVA_NETWORK: "baseSepolia",
    PHORVA_API_KEY: process.env.PHORVA_API_KEY
  }
});

await client.connect(transport);

console.log("MCP connected");

const result = await client.callTool({
  name: "phorva_verify",
  arguments: {
    agent: {
      id: "agent_7a38298d-dda4-4940-b5d4-6e67df44b5b9"
    },

    action: {
      type: "send",
      chain: "baseSepolia",
      amount: 100,
      recipient: "0x0000000000000000000000000000000000000001"
    },

    intent: {
      type: "send",
      amount: 100,
      recipient: "0x0000000000000000000000000000000000000001",
      nativeValue: "100"
    },

    transaction: {
      chainId: 84532,
      expectedChainId: 84532,
      to: "0x0000000000000000000000000000000000000001",
      value: "100",
      calldata: "0x"
    }
  }
});

console.log("MCP verification result:");
console.log(JSON.stringify(result, null, 2));

await client.close();
