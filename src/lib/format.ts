export function dateLabel(value: string | null) {
  if (!value) return "待更新";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(value)).replaceAll("/", ".");
}
export function readingMinutes(body: string) { return Math.max(1, Math.ceil(body.replace(/\s/g, "").length / 400)); }
export function headingId(text: string) { return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-"); }
