import { connection } from "next/server";

export async function GET() {
  await connection();
  // Liveness only; never runs a database query or exposes credentials/configuration.
  return Response.json(
    { status: "ok", app: "project-time-machine" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
