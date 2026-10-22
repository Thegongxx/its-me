import { receiveHeartbeat } from "@/lib/heartbeat";
import { deviceServiceClient } from "@/lib/supabase/server";
import { json } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (process.env.DEMO_MODE === "true") return json({ error: "Demo mode does not accept telemetry" }, 503);
  return receiveHeartbeat(request, async args => {
    const { data, error } = await deviceServiceClient().rpc("ingest_heartbeat", args);
    if (error) throw new Error("Heartbeat persistence failed");
    return data as string;
  }, process.env.NODE_ENV === "development");
}
