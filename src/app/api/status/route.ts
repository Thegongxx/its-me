import { getPublicStatus, isDemo } from "@/lib/content";
import { errorResponse, json } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() { try { return json({ status: await getPublicStatus(), demo: isDemo(), server_time: Date.now() }); } catch (error) { return errorResponse(error); } }
