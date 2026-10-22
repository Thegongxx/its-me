import type { PublicStatus } from "./types";
export const categoryLabels = { development: "开发与构建", design: "设计与探索", reading: "阅读与学习", writing: "记录与写作", other: "自由探索", none: "未公开类别" };
export const stateLabels = { active: "正在进行", idle: "暂时离开", paused: "已暂停共享", focusing: "专注中", thinking: "思考中", available: "可以交流", away: "暂时离开" };
export function statusView(status: PublicStatus | null, now: number) {
  if (!status) return { mode: "unconnected", label: "还没有公开状态", description: "等待一次新的连接。", live: false };
  if (!status.sharing || status.state === "paused") return { mode: "paused", label: "共享已暂停", description: "此刻，留一点空间给自己。", live: false };
  const expires = status.expires_at ? Date.parse(status.expires_at) : NaN;
  if (!Number.isFinite(expires) || now >= expires) return { mode: "stale", label: "状态已过期", description: "暂时没有收到新的心跳，上次状态已停止展示。", live: false };
  return { mode: "live", label: stateLabels[status.state], description: categoryLabels[status.category], live: true };
}
