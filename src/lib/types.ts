export type EntryKind = "project" | "learn";
export type Theme = "sage" | "butter" | "ink";
export type Category = { id: string; name: string; slug: string; description: string; published: boolean };
export type Entry = {
  id: string; kind: EntryKind; slug: string; title: string; summary: string;
  body: string; cover_path: string | null; theme: Theme; status: "draft" | "published";
  featured: boolean; published_at: string | null; created_at: string; updated_at: string;
  role: string; year: string; external_url: string; repository_url: string;
  categories: Category[]; demo?: boolean;
};
export type Profile = {
  id: number; name: string; headline: string; bio: string; location: string;
  email: string; github_url: string; introduction: string; published: boolean;
};
export type Experience = {
  id: string; kind: "education" | "work" | "practice"; title: string; organization: string;
  period: string; description: string; sort_order: number; published: boolean;
};
export const activityCategories = ["development", "design", "reading", "writing", "other", "none"] as const;
export const activityStates = ["active", "idle", "paused", "focusing", "thinking", "available", "away"] as const;
export type ActivityCategory = typeof activityCategories[number];
export type ActivityState = typeof activityStates[number];
export type PublicStatus = { id: number; category: ActivityCategory; state: ActivityState; sharing: boolean; heartbeat_at: string | null; expires_at: string | null };
export type Device = { id: string; label: string; created_at: string; last_seen_at: string | null; revoked_at: string | null };
export type SharingSettings = { id: number; enabled: boolean; active_device_id: string | null };
