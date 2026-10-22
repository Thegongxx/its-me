import { z } from "zod";
import { activityCategories, activityStates } from "./types";
const httpsUrl = z.union([z.literal(""), z.url().max(2000).refine(v => new URL(v).protocol === "https:", "链接必须使用 HTTPS")]);
const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "路径只使用小写字母、数字和连字符").max(100);
export const entryInput = z.object({
  id: z.uuid(), kind: z.enum(["project", "learn"]), slug, title: z.string().trim().min(1).max(160),
  summary: z.string().max(1000), body: z.string().max(100000), cover_path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/).nullable(),
  theme: z.enum(["sage", "butter", "ink"]), status: z.enum(["draft", "published"]), featured: z.boolean(),
  role: z.string().max(250), year: z.string().max(20), external_url: httpsUrl, repository_url: httpsUrl,
  category_ids: z.array(z.uuid()).max(30)
}).strict().refine(v => !v.cover_path || v.cover_path.startsWith(`${v.id}/`), "封面必须属于当前条目");
export const profileInput = z.object({
  id: z.literal(1), name: z.string().trim().min(1).max(80), headline: z.string().max(160), bio: z.string().max(1200),
  location: z.string().max(100), email: z.union([z.literal(""), z.email().max(254)]), github_url: httpsUrl,
  introduction: z.string().max(50000), published: z.boolean()
}).strict();
export const experienceInput = z.object({ id: z.uuid(), kind: z.enum(["education", "work", "practice"]), title: z.string().trim().min(1).max(150), organization: z.string().max(150), period: z.string().max(100), description: z.string().max(5000), sort_order: z.number().int().min(-10000).max(10000), published: z.boolean() }).strict();
export const categoryInput = z.object({ id: z.uuid(), name: z.string().trim().min(1).max(80), slug: slug.max(80), description: z.string().max(500), published: z.boolean() }).strict();
export const heartbeatInput = z.object({ sequence: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), category: z.enum(activityCategories), state: z.enum(activityStates) }).strict();
export const sharingInput = z.object({ enabled: z.boolean(), active_device_id: z.uuid().nullable() }).strict().refine(v => !v.enabled || !!v.active_device_id, "请先选择设备");
export const deviceInput = z.object({ label: z.string().trim().min(1).max(80) }).strict();
