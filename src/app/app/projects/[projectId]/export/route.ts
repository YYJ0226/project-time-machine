import { loadDelivery } from "@/lib/delivery-server";
import { exportMarkdown } from "@/lib/delivery";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "report" && format !== "script")
    return new Response("Unsupported export format", { status: 400 });
  const { snapshot } = await loadDelivery(projectId);
  return new Response(exportMarkdown(snapshot, format), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="project-${projectId}-${format}.md"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
