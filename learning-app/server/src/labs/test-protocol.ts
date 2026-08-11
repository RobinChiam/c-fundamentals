import { randomBytes } from "node:crypto";

const PROTOCOL_LINE_PATTERN =
  /^(?<token>[A-Za-z0-9_-]+) TEST (?<testId>[a-z0-9-]+) (?<result>PASS|FAIL)$/;

export function generateProtocolToken(): string {
  return randomBytes(16).toString("hex");
}

export function parseProtocolResults(
  stdout: string,
  protocolToken: string,
): Map<string, boolean> {
  const results = new Map<string, boolean>();

  for (const line of stdout.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const match = PROTOCOL_LINE_PATTERN.exec(trimmed);
    if (!match?.groups) {
      continue;
    }

    if (match.groups.token !== protocolToken) {
      continue;
    }

    results.set(match.groups.testId, match.groups.result === "PASS");
  }

  return results;
}

export function buildProtocolLine(
  protocolToken: string,
  testId: string,
  passed: boolean,
): string {
  return `${protocolToken} TEST ${testId} ${passed ? "PASS" : "FAIL"}`;
}
