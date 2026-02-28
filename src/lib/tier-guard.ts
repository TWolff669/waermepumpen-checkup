/**
 * Tier-Guard: Zentrale Prüflogik für Feature-Zugriff basierend auf User-Tier.
 *
 * Tier-Hierarchie:
 *   free (0) → einzel (1) → starter (2) → professional (3)
 *
 * Limits:
 *   free:          0 Projekte, kein Speichern, keine Cost-Overrides
 *   einzel:        1 Projekt,  Adresse, kein Cost-Override
 *   starter:       3 Projekte, Adresse, Cost-Overrides
 *   professional: 15 Projekte, Adresse, Cost-Overrides, Priority-Support
 */

import { supabase } from "@/integrations/supabase/client";

export type UserTier = "free" | "einzel" | "starter" | "professional";

export interface TierProfile {
  tier: UserTier;
  maxProjects: number;
  tierExpiresAt: string | null;
}

const TIER_ORDER: Record<UserTier, number> = {
  free: 0,
  einzel: 1,
  starter: 2,
  professional: 3,
};

const MAX_PROJECTS: Record<UserTier, number> = {
  free: 0,
  einzel: 1,
  starter: 3,
  professional: 15,
};

// ─── Pure helper functions (no DB calls) ───────────────────────────

export function getMaxProjects(tier: UserTier): number {
  return MAX_PROJECTS[tier] ?? 0;
}

export function canCustomizeCosts(tier: UserTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER.starter;
}

export function canAccessAddressFields(tier: UserTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER.einzel;
}

export function canSaveProjects(tier: UserTier): boolean {
  return TIER_ORDER[tier] >= TIER_ORDER.einzel;
}

export function isTierExpired(tierExpiresAt: string | null): boolean {
  if (!tierExpiresAt) return false;
  return new Date(tierExpiresAt) < new Date();
}

/** Grace period: 30 Tage nach Ablauf → Projekte read-only, danach Löschmarkierung */
export function isInGracePeriod(tierExpiresAt: string | null): boolean {
  if (!tierExpiresAt) return false;
  const expires = new Date(tierExpiresAt);
  if (expires >= new Date()) return false; // not expired
  const graceEnd = new Date(expires);
  graceEnd.setDate(graceEnd.getDate() + 30);
  return new Date() <= graceEnd;
}

export function isPastGracePeriod(tierExpiresAt: string | null): boolean {
  if (!tierExpiresAt) return false;
  const expires = new Date(tierExpiresAt);
  const graceEnd = new Date(expires);
  graceEnd.setDate(graceEnd.getDate() + 30);
  return new Date() > graceEnd;
}

export function getTierLabel(tier: UserTier): string {
  const labels: Record<UserTier, string> = {
    free: "Free",
    einzel: "Einzel",
    starter: "Starter",
    professional: "Professional",
  };
  return labels[tier] ?? tier;
}

export function getTierColor(tier: UserTier): string {
  const colors: Record<UserTier, string> = {
    free: "bg-muted text-muted-foreground",
    einzel: "bg-primary/10 text-primary",
    starter: "bg-success/10 text-success",
    professional: "bg-warning/10 text-warning",
  };
  return colors[tier] ?? colors.free;
}

// ─── Async helpers (with DB calls) ─────────────────────────────────

export async function fetchTierProfile(userId: string): Promise<TierProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tier, max_projects, tier_expires_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    tier: data.tier as UserTier,
    maxProjects: data.max_projects,
    tierExpiresAt: data.tier_expires_at,
  };
}

export async function countUserProjects(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

export async function canCreateProject(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxCount: number;
}> {
  const profile = await fetchTierProfile(userId);
  if (!profile) {
    return { allowed: false, reason: "Profil nicht gefunden", currentCount: 0, maxCount: 0 };
  }

  if (isTierExpired(profile.tierExpiresAt)) {
    return {
      allowed: false,
      reason: `Ihr ${getTierLabel(profile.tier)}-Plan ist abgelaufen. Bitte verlängern Sie Ihr Abo.`,
      currentCount: 0,
      maxCount: profile.maxProjects,
    };
  }

  if (!canSaveProjects(profile.tier)) {
    return {
      allowed: false,
      reason: "Mit dem Free-Plan können keine Projekte gespeichert werden. Jetzt upgraden!",
      currentCount: 0,
      maxCount: 0,
    };
  }

  const currentCount = await countUserProjects(userId);
  const maxCount = profile.maxProjects;

  if (currentCount >= maxCount) {
    return {
      allowed: false,
      reason: `Projektlimit erreicht (${currentCount}/${maxCount}). Upgrade für mehr Projekte.`,
      currentCount,
      maxCount,
    };
  }

  return { allowed: true, currentCount, maxCount };
}
