import { checkReleaseEnvironment } from "../src/lib/release-config.ts";

const issues = checkReleaseEnvironment(process.env);
for (const issue of issues)
  console.log(
    `${issue.severity === "error" ? "FAIL" : "WARN"} [${issue.code}] ${issue.message}`,
  );
if (issues.some((issue) => issue.severity === "error")) {
  console.log(
    "Production configuration is not ready. Values are intentionally not printed; this command changes nothing.",
  );
  process.exitCode = 1;
} else
  console.log(
    "PASS: production configuration shape. OAuth allowlist, database policies and provider connectivity still require live verification.",
  );
