import { execFileSync } from "node:child_process";

const required = [
  {
    command: "node",
    args: ["--version"],
    expected: "Node 24",
    pattern: /^v24\./,
  },
  {
    command: "pnpm",
    args: ["--version"],
    expected: "pnpm >=11.11",
    pattern: /^11\.(?:1[1-9]|[2-9]\d)\./,
  },
  {
    command: "python3",
    args: ["--version"],
    expected: "Python 3.12 or 3.13",
    pattern: /^Python 3\.1[23]\./,
  },
  {
    command: "uv",
    args: ["--version"],
    expected: "uv 0.11.28",
    pattern: /^uv 0\.11\.28\b/,
  },
  {
    command: "git",
    args: ["--version"],
    expected: "Git 2.x",
    pattern: /^git version 2\./,
  },
  {
    command: "docker",
    args: ["info", "--format", "{{.ServerVersion}}"],
    expected: "a running Docker daemon",
    pattern: /^\d+\.\d+\.\d+$/,
  },
];

let failed = false;

for (const { command, args, expected, pattern } of required) {
  try {
    const output = execFileSync(command, args, { encoding: "utf8" }).trim();
    if (!pattern.test(output)) {
      failed = true;
      console.error(`✗ ${command}: ${output} (expected ${expected})`);
    } else {
      console.log(`✓ ${command}: ${output}`);
    }
  } catch {
    failed = true;
    console.error(`✗ ${command}: missing (expected ${expected})`);
  }
}

if (failed) {
  console.error(
    "\nInstall missing prerequisites before starting the full local stack.",
  );
  process.exitCode = 1;
}
