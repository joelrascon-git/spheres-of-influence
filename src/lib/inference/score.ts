/**
 * Influence score, ported verbatim from the persona knowledge base (§8.2):
 *
 *   influence = 0.35*authority + 0.25*initiative_fit + 0.20*proximity_to_EB
 *             + 0.10*evidence_strength + 0.10*access
 *
 * It is an Inference heuristic by design: weights are labeled as such in the source
 * and should be calibrated against closed-won data. Veto power is tracked
 * separately and never added to the score.
 */
import type { ResearchConfidence, SeniorityLevelValue } from "@/lib/constants";
import { isIcTrack } from "@/lib/inference/title";

export type InitiativeFit = "owns" | "adjacent" | "none";
export type ProximityToEb = "eb" | "direct_report" | "two_levels" | "other" | "unknown";
export type Access = "met" | "warm" | "cold";

const AUTHORITY: Record<SeniorityLevelValue, number> = { L1: 100, L2: 85, L3: 70, L4: 50, L5: 30, L6: 10 };
/** Technical career path: influence without budget authority (§8.2). */
const IC_AUTHORITY: Partial<Record<SeniorityLevelValue, number>> = { L2: 70, L3: 60, L4: 40 };

const EVIDENCE: Record<ResearchConfidence, number> = {
  confirmed: 100,
  secondhand: 70,
  unverified: 30,
  inference: 20,
};

const FIT: Record<InitiativeFit, number> = { owns: 100, adjacent: 60, none: 20 };
const PROXIMITY: Record<ProximityToEb, number> = {
  eb: 100,
  direct_report: 80,
  two_levels: 50,
  other: 20,
  unknown: 20,
};
const ACCESS: Record<Access, number> = { met: 100, warm: 60, cold: 20 };

export type ScoreInput = {
  level: SeniorityLevelValue | null;
  initiativeFit: InitiativeFit;
  proximityToEb: ProximityToEb;
  evidence: ResearchConfidence;
  access?: Access;
  /** True when the level comes from the technical career path (Fellow/Distinguished/Principal/Staff). */
  icTrack?: boolean;
};

export function influenceScore(input: ScoreInput): number | null {
  if (!input.level) return null;
  const authority = input.icTrack ? (IC_AUTHORITY[input.level] ?? AUTHORITY[input.level]) : AUTHORITY[input.level];
  const raw =
    0.35 * authority +
    0.25 * FIT[input.initiativeFit] +
    0.2 * PROXIMITY[input.proximityToEb] +
    0.1 * EVIDENCE[input.evidence] +
    0.1 * ACCESS[input.access ?? "cold"];
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Score for a freshly imported contact: the export itself is a first-hand source for
 * title facts (confirmed), but nothing else is known yet. Ground truth (research
 * links, reporting lines) upgrades this later.
 */
export function importBaselineScore(input: {
  level: SeniorityLevelValue | null;
  icTrack?: boolean;
  initiativeFit?: InitiativeFit;
}): number | null {
  return influenceScore({
    level: input.level,
    icTrack: input.icTrack,
    initiativeFit: input.initiativeFit ?? "none",
    proximityToEb: "unknown",
    evidence: "confirmed", // LinkedIn profile data is self-reported, i.e. first-hand for the title.
    access: "cold",
  });
}

/** Convenience wrapper used where the title is all we have. */
export function scoreFromTitle(input: {
  level: SeniorityLevelValue | null;
  title?: string | null;
  headline?: string | null;
}): number | null {
  return importBaselineScore({ level: input.level, icTrack: isIcTrack(input) });
}
