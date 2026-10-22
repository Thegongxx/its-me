import { sessionClient } from "@/lib/supabase/server";
import { errorResponse, json } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params; const key = path.join("/");
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/.test(key) || process.env.DEMO_MODE === "true") return json({ error: "Image not found" }, 404);
    const supabase = await sessionClient();
    const { data, error } = await supabase.storage.from("project-media").download(key);
    if (error || !data) return json({ error: "Image not found" }, 404);
    return new Response(data, { headers: { "Content-Type": "image/webp", "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
  } catch (error) { return errorResponse(error); }
}
