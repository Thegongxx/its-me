import { Hero } from "@/components/hero";
import type { Metadata } from "next";
import { getEntries, getProfile, getPublicStatus, isDemo } from "@/lib/content";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [projects, notes, profile, status] = await Promise.all([
    getEntries("project"), getEntries("learn"), getProfile(), getPublicStatus(),
  ]);
  const selected = projects.filter(project => project.featured);
  return <Hero profile={profile} projects={selected.length ? selected : projects} notes={notes} status={status} demo={isDemo()}/>;
}
