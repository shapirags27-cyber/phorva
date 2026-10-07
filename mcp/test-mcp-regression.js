import { spawn } from "node:child_process";

function runTest(file) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], {
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", data => {
      stdout += data.toString();
    });

    child.stderr.on("data", data => {
      stderr += data.toString();
    });

    child.on("error", reject);

    child.on("close", code => {
      resolve({
        file,
        code,
        stdout,
        stderr
      });
    });
  });
}

function extractResult(output) {
  const marker = '"text": "';
  const start = output.indexOf(marker);

  if (start === -1) {
    throw new Error("Could not find MCP result text.");
  }

  const jsonStart = start + marker.length;

  let escaped = "";
  let escapedBackslashes = false;

  for (let i = jsonStart; i < output.length; i++) {
    const char = output[i];

    if (char === '"' && !escapedBackslashes) {
      break;
    }

    escaped += char;

    if (char === "\\" && !escapedBackslashes) {
      escapedBackslashes = true;
    } else {
      escapedBackslashes = false;
    }
  }

  const decoded = JSON.parse(`"${escaped}"`);

  return JSON.parse(decoded);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

const tests = [
  {
    file: "test-mcp-verify.js",
    name: "AUTHORIZED execution",
    expectations: {
      verdict: "AUTHORIZED",
      intentMatch: true,
      policyPassed: true,
      capabilityAllowed: true,
      authorizationPassed: true,
      transactionSecuritySafe: true
    }
  },
  {
    file: "test-mcp-negative.js",
    name: "CAPABILITY BLOCK",
    expectations: {
      verdict: "BLOCKED",
      intentMatch: true,
      policyPassed: true,
      capabilityAllowed: false,
      authorizationPassed: false,
      transactionSecuritySafe: true
    }
  }
];

let failures = 0;

for (const test of tests) {
  console.log(`\n=== ${test.name} ===`);

  const result = await runTest(test.file);

  if (result.code !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    console.error(`FAIL: ${test.file} exited with code ${result.code}`);
    failures++;
    continue;
  }

  try {
    const verification = extractResult(result.stdout);

    for (const [field, expected] of Object.entries(test.expectations)) {
      assertEqual(
        verification[field],
        expected,
        `${test.name} / ${field}`
      );
    }

    console.log("PASS");
    console.log(`verdict: ${verification.verdict}`);
    console.log(`intentMatch: ${verification.intentMatch}`);
    console.log(`policyPassed: ${verification.policyPassed}`);
    console.log(`capabilityAllowed: ${verification.capabilityAllowed}`);
    console.log(`authorizationPassed: ${verification.authorizationPassed}`);
    console.log(
      `transactionSecuritySafe: ${verification.transactionSecuritySafe}`
    );
  } catch (error) {
    console.error("FAIL");
    console.error(error.message);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\nMCP regression suite FAILED: ${failures} test(s) failed.`);
  process.exit(1);
}

console.log("\nMCP regression suite PASSED.");
