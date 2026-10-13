/**
 * The deterministic classification pass over a contact's profile text, run at import
 * time. Produces what a title can earn — nothing more (rules 2 and 3): persona_status
 * stays "assumed", Champion appears only as a potential, and no one becomes a key
 * person from a title alone. Research ground truth and AI evidence upgrade these
 * values afterwards through the inference queue.
 */
import type { PersonaCode, SeniorityLevelValue } from "@/lib/constants";
import { bucketCanVeto, functionBucket, isIcTrack, legacySeniority, seniorityLevel } from "@/lib/inference/title";
import { assignOrg, type OrgMatch, type OrgRef } from "@/lib/inference/orgs";
import { scoreFromTitle } from "@/lib/inference/score";

export type Classification = {
  seniority_level: SeniorityLevelValue | null;
  /** The coarser ladder already stored on contacts (c_level…ic). */
  seniority: "c_level" | "vp" | "director" | "manager" | "ic" | null;
  function_bucket: number | null;
  personas: PersonaCode[];
  /** First persona of the bucket's default list; the set is what matters. */
  primary_persona: PersonaCode | null;
  persona_status: "assumed";
  champion_flag: "none" | "potential";
  can_veto: boolean;
  influence_score: number | null;
  ic_track: boolean;
  org: OrgMatch | null;
};

export type ClassifyInput = {
  title?: string | null;
  headline?: string | null;
  summary?: string | null;
  companyName?: string | null;
  orgs?: OrgRef[];
};

export function classifyContact(input: ClassifyInput): Classification {
  const text = [input.title, input.headline, input.summary].filter(Boolean).join(" ");
  const level = seniorityLevel({ title: input.title, headline: input.headline, companyName: input.companyName });
  const bucket = functionBucket({ title: input.title, headline: input.headline });
  const icTrack = isIcTrack({ title: input.title, headline: input.headline });
  const personas = bucket?.personas ?? [];
  const org = input.orgs?.length ? assignOrg(text, input.orgs) : null;
  return {
    seniority_level: level,
    seniority: legacySeniority(level),
    function_bucket: bucket?.bucket ?? null,
    personas,
    primary_persona: personas[0] ?? null,
    persona_status: "assumed",
    // Rule 3: a title can never earn a Champion, not even a potential one.
    // champion_flag "potential" only comes from evidence (published work, owned
    // initiatives) via ground truth or the AI pass.
    champion_flag: "none",
    can_veto: bucketCanVeto(bucket?.bucket ?? null),
    influence_score: scoreFromTitle({ level, title: input.title, headline: input.headline }),
    ic_track: icTrack,
    org,
  };
}
