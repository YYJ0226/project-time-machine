import { connection } from "next/server";
import { checkReleaseEnvironment } from "@/lib/release-config";

export async function GET() {
  await connection();
  const configured = !checkReleaseEnvironment(process.env).some(
    (issue) => issue.severity === "error",
  );
  // Configuration readiness, NOT a promise that upstream providers or migrations are healthy.
  return Response.json(
    { status: configured ? "configured" : "configuration_required" },
    {
      status: configured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
