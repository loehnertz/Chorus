#!/usr/bin/env node

import { spawn } from "node:child_process";

const BACKOFF_MS = [5_000, 10_000, 20_000, 30_000];
const MAX_ATTEMPTS = BACKOFF_MS.length + 1;

function log(message) {
  console.log(`[vercel-build] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isProductionDeploy() {
  return process.env.VERCEL_ENV === "production";
}

function resolveMigrationDatabaseUrl() {
  return (
    process.env.MIGRATE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  );
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env,
    });

    let combinedOutput = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        output: combinedOutput,
      });
    });
  });
}

function isAdvisoryLockTimeout(output) {
  const lowered = output.toLowerCase();
  return lowered.includes("p1002") && lowered.includes("advisory lock");
}

async function runMigrationsWithRetry() {
  const migrationDatabaseUrl = resolveMigrationDatabaseUrl();

  if (!migrationDatabaseUrl) {
    throw new Error(
      "Missing database connection string for migrations. Set MIGRATE_DATABASE_URL (recommended), DATABASE_URL, or POSTGRES_URL.",
    );
  }

  const migrationEnv = {
    ...process.env,
    DATABASE_URL: migrationDatabaseUrl,
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    log(`Running Prisma migrations (attempt ${attempt}/${MAX_ATTEMPTS}).`);
    const result = await runCommand("npx", ["prisma", "migrate", "deploy"], migrationEnv);

    if (result.code === 0) {
      log("Prisma migrations completed successfully.");
      return;
    }

    const canRetry = attempt < MAX_ATTEMPTS && isAdvisoryLockTimeout(result.output);
    if (!canRetry) {
      throw new Error("Prisma migrations failed.");
    }

    const waitMs = BACKOFF_MS[attempt - 1];
    log(
      `Detected advisory-lock timeout (P1002). Waiting ${waitMs / 1000}s before retry.`,
    );
    await sleep(waitMs);
  }
}

async function runNextBuild() {
  log("Starting Next.js build.");
  const result = await runCommand("npx", ["next", "build", "--webpack"]);
  if (result.code !== 0) {
    throw new Error("Next.js build failed.");
  }
}

async function main() {
  const envName = process.env.VERCEL_ENV || "local";
  log(`Build environment: ${envName}.`);

  if (!isProductionDeploy()) {
    log("Skipping Prisma migrations for non-production build.");
    await runNextBuild();
    return;
  }

  log("Production deploy detected. Running Prisma migrations before build.");
  await runMigrationsWithRetry();
  await runNextBuild();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(message);
  process.exit(1);
});
