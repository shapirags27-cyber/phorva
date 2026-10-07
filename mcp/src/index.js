import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import phorvaSdk from "@phorva/sdk";

const { Phorva } = phorvaSdk;

const baseUrl =
  process.env.PHORVA_BASE_URL ||
  "http://localhost:3000";

const apiKey =
  process.env.PHORVA_API_KEY ||
  "";

const network =
  process.env.PHORVA_NETWORK ||
  "baseSepolia";

function createPhorvaClient() {
  return new Phorva({
    baseUrl,
    apiKey,
    network
  });
}

function createServer() {
  const server = new McpServer({
    name: "phorva",
    version: "0.1.0"
  });

  server.registerTool(
    "phorva_verify",
    {
      title: "Verify an autonomous execution",
      description:
        "Submit an autonomous agent execution request to Phorva for identity, intent, policy, risk, authorization, and execution verification. Phorva returns the canonical security decision.",
      inputSchema: {
        agent: z.record(z.string(), z.unknown()).optional(),
        action: z.record(z.string(), z.unknown()).optional(),
        intent: z.record(z.string(), z.unknown()).optional(),
        policy: z.record(z.string(), z.unknown()).optional(),
        transaction: z.record(z.string(), z.unknown()).optional(),
        phorvaIdentity: z.record(z.string(), z.unknown()).optional()
      }
    },
    async (args) => {
      try {
        const client = createPhorvaClient();

        const result = await client.verify({
          ...args,
          network
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: error?.message || String(error),
                  source: "phorva"
                },
                null,
                2
              )
            }
          ]
        };
      }
    }
  );

  server.registerTool(
    "phorva_health",
    {
      title: "Check Phorva health",
      description:
        "Check whether the configured Phorva verification service is reachable.",
      inputSchema: {}
    },
    async () => {
      try {
        const client = createPhorvaClient();
        const result = await client.health();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: error?.message || String(error),
                  source: "phorva"
                },
                null,
                2
              )
            }
          ]
        };
      }
    }
  );

  return server;
}

console.error(
  `Phorva MCP server starting on ${baseUrl} (${network})`
);

serveStdio(createServer);
