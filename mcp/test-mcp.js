import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

async function main() {
  const client = new Client({
    name: "phorva-mcp-test",
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

  const result = await client.listTools();

  console.log(
    "Tools:",
    result.tools.map(tool => tool.name).join(", ")
  );

  await client.close();
}

main().catch(error => {
  console.error("MCP test failed:", error);
  process.exit(1);
});
