
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const client = new Client({
  name: "phorva-health-test",
  version: "0.1.0"
});

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["src/index.js"],
  env: {
    ...process.env,
    PHORVA_BASE_URL: "http://localhost:3000",
    PHORVA_NETWORK: "baseSepolia"
  }
});

await client.connect(transport);

console.log("MCP connected: true");

const result = await client.callTool({
  name: "phorva_health",
  arguments: {}
});

console.log(
  "Health result:",
  JSON.stringify(result, null, 2)
);

await client.close();
