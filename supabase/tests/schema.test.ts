import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildFilter } from "@/lib/search/parse";
import { WIPE_TABLES } from "@/lib/reset";

// Minimal stand-ins for the Supabase-managed auth and storage schemas.
const SUPABASE_STUBS = `
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select string_to_array(name, '/') $$;
  create schema extensions;
`;

const USER_A = "00000000-0000-0000-0000-00000000000a";
const USER_B = "00000000-0000-0000-0000-00000000000b";

let db: PGlite;

async function as<T>(user: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role;`);
  }
}

async function search(query: string, facets = {}) {
  const filter = buildFilter(query, facets);
  const res = await db.query<{ id: string; total: number }>(
    `select * from public.search_contacts($1::jsonb, 'name', 100, 0)`,
    [JSON.stringify(filter)],
  );
  return res.rows.map((r) => r.id);
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pg_trgm } });
  await db.exec(SUPABASE_STUBS);
  const dir = path.resolve(__dirname, "../migrations");
  for (const file of readdirSync(dir).sort()) {
    await db.exec(readFileSync(path.join(dir, file), "utf8"));
  }
  await db.exec(`
    grant usage on schema public, auth, extensions to authenticated;
    grant all on all tables in schema public to authenticated;
    grant usage, select on all sequences in schema public to authenticated;
    grant execute on all functions in schema public to authenticated;
    insert into auth.users values ('${USER_A}', 'a@x.com'), ('${USER_B}', 'b@x.com');
  `);

  await as(USER_A, async () => {
    await db.exec(`
      insert into public.accounts (id, name, domain) values ('10000000-0000-0000-0000-000000000001', 'Carvana', 'carvana.com');
      insert into public.orgs (id, account_id, name, aliases) values
        ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Data Platform', '{DPE}');
      insert into public.contacts (id, account_id, org_id, first_name, last_name, title, summary, seniority, statuses, personas, is_key, email, role_start, company_start, location_city) values
        ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
         'Brian', 'Secrest', 'Data Platform Manager', 'Snowflake, Azure Databricks and AI tooling', 'manager', '{Working}', '{Technical}', true, 'brian@carvana.com', current_date - 400, current_date - 4000, 'Gilbert'),
        ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', null,
         'Keyur', 'Joshi', 'Lead Data Engineer', 'Gen AI and agentic AI on Databricks', 'ic', '{"Do Not Contact"}', '{}', false, null, current_date - 200, current_date - 1500, 'Phoenix'),
        ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', null,
         'Matt', 'Thomas', 'Staff Engineer II, Data Platform', 'T-SQL, C#, .NET 4.0 and SSIS; maintains pipelines', 'ic', '{}', '{}', false, null, current_date - 3800, current_date - 3800, 'Phoenix');
    `);
  });
});

describe("boolean search", () => {
  const BRIAN = "30000000-0000-0000-0000-000000000001";
  const KEYUR = "30000000-0000-0000-0000-000000000002";
  const MATT = "30000000-0000-0000-0000-000000000003";

  it("matches whole words, not substrings", () =>
    as(USER_A, async () => {
      // "maintains" contains "ai" but must not match the term AI.
      expect((await search("AI")).sort()).toEqual([BRIAN, KEYUR].sort());
    }));

  it("supports AND, OR, NOT and phrases", () =>
    as(USER_A, async () => {
      expect(await search("manager AND AI")).toEqual([BRIAN]);
      expect((await search("snowflake OR ssis")).sort()).toEqual([BRIAN, MATT].sort());
      expect(await search('AI -status:"Do Not Contact"')).toEqual([BRIAN]);
      expect(await search('"agentic ai"')).toEqual([KEYUR]);
    }));

  it("handles symbols and prefixes", () =>
    as(USER_A, async () => {
      expect(await search(".net")).toEqual([MATT]);
      expect(await search("c#")).toEqual([MATT]);
      expect((await search("data*")).length).toBe(3);
    }));

  it("searches org names and aliases", () =>
    as(USER_A, async () => {
      expect(await search("org:dpe")).toEqual([BRIAN]);
      expect(await search("account:carvana")).toHaveLength(3);
    }));

  it("applies facets and live tenure ranges", () =>
    as(USER_A, async () => {
      expect(await search("", { keyOnly: true })).toEqual([BRIAN]);
      expect(await search("", { seniority: ["ic"], cities: ["phoenix"] })).toEqual([KEYUR, MATT].sort());
      expect(await search("", { changeAgents: true })).toEqual([KEYUR]);
      expect(await search("has:email")).toEqual([BRIAN]);
    }));

  it("is safe against injection in values", () =>
    as(USER_A, async () => {
      expect(await search(`x') or true or ('`)).toEqual([]);
      const filter = { t: "in", f: "seniority", v: ["ic') or true --"] };
      const res = await db.query(`select * from public.search_contacts($1::jsonb)`, [JSON.stringify(filter)]);
      expect(res.rows).toEqual([]);
    }));
});

describe("triggers", () => {
  it("updates Last Updated and search text when tags and notes change", () =>
    as(USER_A, async () => {
      const id = "30000000-0000-0000-0000-000000000003";
      const before = (await db.query<{ updated_at: string }>(`select updated_at from public.contacts where id = $1`, [id])).rows[0];
      await new Promise((r) => setTimeout(r, 20));
      await db.exec(`
        insert into public.tags (id, name, description) values ('40000000-0000-0000-0000-000000000001', 'Phoenix Dinner', 'Invite to the October dinner');
        insert into public.contact_tags (contact_id, tag_id) values ('${id}', '40000000-0000-0000-0000-000000000001');
        insert into public.notes (contact_id, body_html) values ('${id}', '<p>Loves <strong>Negroni</strong> cocktails</p>');
      `);
      const after = (
        await db.query<{ updated_at: string; search_text: string }>(`select updated_at, search_text from public.contacts where id = $1`, [id])
      ).rows[0];
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime());
      expect(after.search_text).toContain("phoenix dinner");
      expect(after.search_text).toContain("negroni");
      expect(await search("tag:phoenix")).toEqual([id]);
      expect(await search("notes:negroni")).toEqual([id]);
    }));

  it("refreshes search but not Last Updated when an org is renamed", () =>
    as(USER_A, async () => {
      const id = "30000000-0000-0000-0000-000000000001";
      const before = (await db.query<{ updated_at: string }>(`select updated_at from public.contacts where id = $1`, [id])).rows[0];
      await db.exec(`update public.orgs set name = 'Engineering Data Platform' where id = '20000000-0000-0000-0000-000000000001'`);
      const after = (
        await db.query<{ updated_at: string; search_text: string }>(`select updated_at, search_text from public.contacts where id = $1`, [id])
      ).rows[0];
      expect(after.search_text).toContain("engineering data platform");
      expect(after.updated_at).toEqual(before.updated_at);
    }));

  it("requires a tag description", () =>
    as(USER_A, async () => {
      await expect(db.exec(`insert into public.tags (name, description) values ('x', '  ')`)).rejects.toThrow();
    }));
});

describe("row level security", () => {
  it("hides another owner's data", () =>
    as(USER_B, async () => {
      const res = await db.query(`select id from public.contacts`);
      expect(res.rows).toEqual([]);
      expect(await search("")).toEqual([]);
    }));

  it("stamps owner_id from the session", () =>
    as(USER_B, async () => {
      await db.exec(`insert into public.accounts (name) values ('Amex')`);
      const res = await db.query<{ owner_id: string }>(`select owner_id from public.accounts`);
      expect(res.rows).toEqual([{ owner_id: USER_B }]);
    }));
});

describe("knowledge schema", () => {
  const ACCOUNT = "10000000-0000-0000-0000-000000000001";
  const BRIAN = "30000000-0000-0000-0000-000000000001";
  const KEYUR = "30000000-0000-0000-0000-000000000002";
  const MATT = "30000000-0000-0000-0000-000000000003";
  const INITIATIVE = "50000000-0000-0000-0000-000000000001";
  const CHALLENGE = "60000000-0000-0000-0000-000000000001";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.initiatives (id, account_id, code, name, summary, factory_fit, rank, confidence, sources)
        values ('${INITIATIVE}', '${ACCOUNT}', 'I1', 'BigQuery Migration',
                'Moving a core on-prem warehouse and hundreds of apps to BigQuery.',
                'very_strong', 1, 'confirmed',
                '[{"label":"Google Cloud","url":"https://cloud.google.com/"}]'::jsonb);
        insert into public.challenges (id, account_id, code, name, impact, factory_fit, rank, confidence)
        values ('${CHALLENGE}', '${ACCOUNT}', 'Ch1', 'BSA/AML consent orders', 'Very high', 'medium', 1, 'confirmed');
        insert into public.contact_initiatives (contact_id, initiative_id, strength, source)
        values ('${BRIAN}', '${INITIATIVE}', 'documented', 'research');
        insert into public.contact_challenges (contact_id, challenge_id, strength, source)
        values ('${BRIAN}', '${CHALLENGE}', 'inferred', 'research');
        insert into public.org_initiatives (org_id, initiative_id, source)
        values ('20000000-0000-0000-0000-000000000001', '${INITIATIVE}', 'research');
        update public.contacts set seniority_level = 'L3', champion_flag = 'potential',
          persona_status = 'indicated', can_veto = true, influence_score = 72,
          engage_stage = 'Discovery', buying_role = 'Project Buyer',
          gaps = '{"business unit unconfirmed"}'
        where id = '${BRIAN}';
        insert into public.inferences (subject_type, subject_id, kind, value, confidence, evidence, source)
        values ('contact', '${BRIAN}', 'org_assignment',
                '{"org_id": "20000000-0000-0000-0000-000000000001"}'::jsonb, 'inference',
                '[{"claim":"Title mentions Data Platform","confidence":"inference"}]'::jsonb, 'import');
        insert into public.research_docs (title, scope, doc_type, body_html)
        values ('Factory Knowledge Base', 'seller', 'product_kb', '<p>Droids, Missions, Router.</p>');
      `);
    }),
  );

  it("searches contacts by linked initiative and challenge", () =>
    as(USER_A, async () => {
      expect(await search("bigquery")).toEqual([BRIAN]);
      expect(await search("I1")).toEqual([BRIAN]);
      expect(await search("ch1")).toEqual([BRIAN]);
      expect(await search('buying_role:"project buyer"')).toEqual([BRIAN]);
    }));

  it("filters and sorts with the new facets", () =>
    as(USER_A, async () => {
      const run = async (filter: unknown, sort = "name") =>
        (
          await db.query<{ id: string }>(
            `select * from public.search_contacts($1::jsonb, '${sort}', 100, 0)`,
            [JSON.stringify(filter)],
          )
        ).rows.map((r) => r.id);

      expect(await run({ t: "in", f: "seniority_level", v: ["L3"] })).toEqual([BRIAN]);
      expect(await run({ t: "in", f: "champion_flag", v: ["potential"] })).toEqual([BRIAN]);
      expect(await run({ t: "in", f: "persona_status", v: ["indicated"] })).toEqual([BRIAN]);
      expect(await run({ t: "in", f: "engage_stage", v: ["Discovery"] })).toEqual([BRIAN]);
      expect(await run({ t: "bool", f: "can_veto", v: true })).toEqual([BRIAN]);
      // Unknown (null) is "not a veto holder", so the other contacts match.
      expect(await run({ t: "bool", f: "can_veto", v: false }).then((r) => r.sort())).toEqual([KEYUR, MATT].sort());
      expect(await run({ t: "range", f: "influence_score", min: 70 })).toEqual([BRIAN]);
      expect(await run({ t: "range", f: "influence_score", max: 70 })).toEqual([]);
      expect(await run({ t: "text", v: "bigquery" }, "influence")).toEqual([BRIAN]);
    }));

  it("keeps initiative codes unique per account and enforces link ownership", () =>
    as(USER_A, async () => {
      await expect(
        db.exec(`insert into public.initiatives (account_id, code, name) values ('${ACCOUNT}', 'I1', 'Duplicate')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`insert into public.contact_initiatives (contact_id, initiative_id) values ('${BRIAN}', '${INITIATIVE}')`),
      ).rejects.toThrow();
    }),
  );

  it("refreshes contact search when an initiative is renamed", () =>
    as(USER_A, async () => {
      await db.exec(`update public.initiatives set name = 'GCP Warehouse Migration' where id = '${INITIATIVE}'`);
      expect(await search("bigquery")).toEqual([]);
      expect(await search("warehouse migration")).toEqual([BRIAN]);
      await db.exec(`update public.initiatives set name = 'BigQuery Migration' where id = '${INITIATIVE}'`);
    }));

  it("scopes knowledge rows and seller docs to their owner", () =>
    as(USER_B, async () => {
      const inits = await db.query(`select id from public.initiatives`);
      const inferences = await db.query(`select id from public.inferences`);
      const docs = await db.query(`select id from public.research_docs`);
      expect(inits.rows).toEqual([]);
      expect(inferences.rows).toEqual([]);
      expect(docs.rows).toEqual([]);
      // Seller-scoped docs need no account.
      await db.exec(`insert into public.research_docs (title, scope, doc_type) values ('B KB', 'seller', 'personas')`);
      const own = await db.query<{ scope: string }>(`select scope from public.research_docs`);
      expect(own.rows).toEqual([{ scope: "seller" }]);
    }));

  it("bumps Last Updated when inference fields change directly", () =>
    as(USER_A, async () => {
      const before = (
        await db.query<{ updated_at: string }>(`select updated_at from public.contacts where id = '${BRIAN}'`)
      ).rows[0];
      await new Promise((r) => setTimeout(r, 20));
      await db.exec(`update public.contacts set influence_score = 80 where id = '${BRIAN}'`);
      const after = (
        await db.query<{ updated_at: string }>(`select updated_at from public.contacts where id = '${BRIAN}'`)
      ).rows[0];
      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(new Date(before.updated_at).getTime());
    }));
});

describe("ingestion schema", () => {
  const ACCOUNT = "10000000-0000-0000-0000-000000000001";
  const BRIAN = "30000000-0000-0000-0000-000000000001";
  const DOC = "80000000-0000-0000-0000-000000000001";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.documents (id, account_id, title, raw_text, call_type, notes_html, status)
        values ('${DOC}', '${ACCOUNT}', 'Carvana discovery', 'Priya said Dan runs everything through her…',
                'discovery', '<h2>Attendees</h2>', 'done');
        insert into public.inferences (subject_type, subject_id, kind, value, confidence, evidence, source, document_id)
        values ('contact', '${BRIAN}', 'influence_edge',
                '{"to": "Keyur Joshi", "strength": "high"}'::jsonb, 'confirmed',
                '[{"claim":"“Brian defers to Keyur on tooling.”","confidence":"confirmed"}]'::jsonb, 'ai', '${DOC}');
      `);
    }),
  );

  it("accepts influence edges and links proposals to their document", () =>
    as(USER_A, async () => {
      const rows = await db.query<{ kind: string; document_id: string }>(
        `select kind, document_id from public.inferences where subject_id = '${BRIAN}' and kind = 'influence_edge'`,
      );
      expect(rows.rows[0]).toEqual({ kind: "influence_edge", document_id: DOC });
    }));

  it("enforces the call-type and status vocabularies", () =>
    as(USER_A, async () => {
      await expect(
        db.exec(`insert into public.documents (account_id, raw_text, call_type) values ('${ACCOUNT}', 'x', 'cold_call')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`insert into public.documents (account_id, raw_text, status) values ('${ACCOUNT}', 'x', 'paused')`),
      ).rejects.toThrow();
    }));

  it("scopes documents to their owner", () =>
    as(USER_B, async () => {
      const docs = await db.query(`select id from public.documents`);
      expect(docs.rows).toEqual([]);
    }));

  it("keeps proposals when their source document is deleted", () =>
    as(USER_A, async () => {
      await db.exec(`delete from public.documents where id = '${DOC}'`);
      const rows = await db.query<{ id: string; document_id: string | null; status: string }>(
        `select id, document_id, status from public.inferences where subject_id = '${BRIAN}' and kind = 'influence_edge'`,
      );
      expect(rows.rows).toHaveLength(1);
      expect(rows.rows[0]).toMatchObject({ document_id: null, status: "pending" });
    }));

  it("stores the undo snapshot for accepted proposals", () =>
    as(USER_A, async () => {
      const undo = { type: "patch", table: "contacts", patch: { org_id: null } };
      await db.exec(`
        update public.inferences
           set status = 'accepted', resolved_at = now(), undo = '${JSON.stringify(undo)}'::jsonb
         where subject_id = '${BRIAN}' and kind = 'influence_edge'
      `);
      const row = await db.query<{ status: string; undo: { type: string } }>(
        `select status, undo from public.inferences where subject_id = '${BRIAN}' and kind = 'influence_edge'`,
      );
      expect(row.rows[0]).toMatchObject({ status: "accepted", undo: { type: "patch" } });
    }));
});

describe("workflow schema", () => {
  const ACCOUNT = "10000000-0000-0000-0000-000000000001";
  const BRIAN = "30000000-0000-0000-0000-000000000001";
  const TEMPLATE = "90000000-0000-0000-0000-000000000001";
  const OPP = "a0000000-0000-0000-0000-000000000001";
  const ITEM = "a0000000-0000-0000-0000-00000000000a";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.qualification_templates (id, name, elements, is_default)
        values ('${TEMPLATE}', 'MEDDPICC',
                '[{"key":"metrics","label":"Metrics"},{"key":"economic_buyer","label":"Economic Buyer"}]'::jsonb, true);
        insert into public.opportunities (id, account_id, name, template_id, amount, close_date)
        values ('${OPP}', '${ACCOUNT}', 'Factory pilot', '${TEMPLATE}', 250000, current_date + 60);
        insert into public.qualification_items (id, opportunity_id, key, label, sort_order, status)
        values ('${ITEM}', '${OPP}', 'metrics', 'Metrics', 0, 'identified');
        insert into public.qualification_evidence (item_id, contact_id, note)
        values ('${ITEM}', '${BRIAN}', 'Wants a 20% cycle-time cut by Q2.');
        insert into public.tasks (account_id, opportunity_id, title, due_date)
        values ('${ACCOUNT}', '${OPP}', 'Send the pilot plan', current_date + 3);
      `);
    }),
  );

  it("keeps element keys unique per opportunity and allows custom ones", () =>
    as(USER_A, async () => {
      await expect(
        db.exec(`insert into public.qualification_items (opportunity_id, key, label) values ('${OPP}', 'metrics', 'Metrics again')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`insert into public.qualification_items (opportunity_id, key, label) values ('${OPP}', 'champion', 'Champion')`),
      ).resolves.toBeDefined();
    }),
  );

  it("enforces the status and source vocabularies", () =>
    as(USER_A, async () => {
      await expect(db.exec(`update public.opportunities set status = 'maybe' where id = '${OPP}'`)).rejects.toThrow();
      await expect(
        db.exec(`insert into public.qualification_evidence (item_id, note, source) values ('${ITEM}', 'x', 'gossip')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`update public.qualification_items set status = 'certain' where id = '${ITEM}'`),
      ).rejects.toThrow();
    }),
  );

  it("cascades items and evidence when the deal goes, and keeps tasks", () =>
    as(USER_A, async () => {
      await db.exec(`delete from public.opportunities where id = '${OPP}'`);
      const items = await db.query(`select id from public.qualification_items where opportunity_id = '${OPP}'`);
      const ev = await db.query(`select id from public.qualification_evidence where item_id = '${ITEM}'`);
      const tasks = await db.query<{ opportunity_id: string | null }>(`select opportunity_id from public.tasks`);
      expect(items.rows).toEqual([]);
      expect(ev.rows).toEqual([]);
      expect(tasks.rows).toEqual([{ opportunity_id: null }]);
    }),
  );

  it("scopes workflow rows to their owner", () =>
    as(USER_B, async () => {
      const opps = await db.query(`select id from public.opportunities`);
      const tasks = await db.query(`select id from public.tasks`);
      const templates = await db.query(`select id from public.qualification_templates`);
      expect(opps.rows).toEqual([]);
      expect(tasks.rows).toEqual([]);
      expect(templates.rows).toEqual([]);
    }),
  );
});

describe("campaigns schema", () => {
  const ACCOUNT = "10000000-0000-0000-0000-000000000001";
  const OTHER_ACCOUNT = "10000000-0000-0000-0000-000000000002";
  const BRIAN = "30000000-0000-0000-0000-000000000001";
  const OUTSIDER = "30000000-0000-0000-0000-000000000011";
  const CAMP = "b0000000-0000-0000-0000-000000000001";
  const WEBINAR = "b0000000-0000-0000-0000-000000000002";
  const MEMBER = "b0000000-0000-0000-0000-00000000000a";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.accounts (id, name, domain) values ('${OTHER_ACCOUNT}', 'Stripe', 'stripe.com');
        insert into public.contacts (id, account_id, first_name, last_name, title)
          values ('${OUTSIDER}', '${OTHER_ACCOUNT}', 'Ada', 'Lovelace', 'CTO');
        insert into public.campaigns (id, account_id, name, type)
          values ('${CAMP}', '${ACCOUNT}', 'Carvana exec dinner', 'event_dinner');
        insert into public.campaign_members (id, campaign_id, contact_id, contact_account_id, funnel_stage, outcome)
          values ('${MEMBER}', '${CAMP}', '${BRIAN}', '${ACCOUNT}', 'attended', 'wants a follow-up');
      `);
    }),
  );

  it("defaults to an event dinner in planning, owned by the creator", () =>
    as(USER_A, async () => {
      await db.exec(`insert into public.campaigns (id, name) values ('${WEBINAR}', 'Q4 webinar')`);
      const res = await db.query<{ type: string; status: string; owner_id: string }>(
        `select type, status, owner_id from public.campaigns where id = '${WEBINAR}'`,
      );
      expect(res.rows).toEqual([{ type: "event_dinner", status: "planning", owner_id: USER_A }]);
    }),
  );

  it("enforces the type, status and funnel vocabularies and one row per member", () =>
    as(USER_A, async () => {
      await expect(db.exec(`insert into public.campaigns (name, type) values ('x', 'hackathon')`)).rejects.toThrow();
      await expect(db.exec(`update public.campaigns set status = 'paused' where id = '${CAMP}'`)).rejects.toThrow();
      await expect(
        db.exec(`insert into public.campaign_members (campaign_id, contact_id) values ('${CAMP}', '${OUTSIDER}')`),
      ).resolves.toBeDefined();
      await expect(
        db.exec(`insert into public.campaign_members (campaign_id, contact_id) values ('${CAMP}', '${BRIAN}')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`update public.campaign_members set funnel_stage = 'showed_up' where campaign_id = '${CAMP}'`),
      ).rejects.toThrow();
    }),
  );

  it("keeps the member but clears the snapshot when their account goes", () =>
    as(USER_A, async () => {
      await db.exec(`update public.campaign_members set contact_account_id = '${OTHER_ACCOUNT}' where id = '${MEMBER}'`);
      await db.exec(`delete from public.accounts where id = '${OTHER_ACCOUNT}'`);
      const res = await db.query<{ id: string; contact_account_id: string | null }>(
        `select id, contact_account_id from public.campaign_members where id = '${MEMBER}'`,
      );
      expect(res.rows).toEqual([{ id: MEMBER, contact_account_id: null }]);
    }),
  );

  it("cascades the funnel when the campaign goes", () =>
    as(USER_A, async () => {
      await db.exec(`delete from public.campaigns where id = '${CAMP}'`);
      const members = await db.query(`select id from public.campaign_members where campaign_id = '${CAMP}'`);
      expect(members.rows).toEqual([]);
    }),
  );

  it("scopes campaigns and members to their owner", () =>
    as(USER_B, async () => {
      const camps = await db.query(`select id from public.campaigns`);
      const members = await db.query(`select id from public.campaign_members`);
      expect(camps.rows).toEqual([]);
      expect(members.rows).toEqual([]);
    }),
  );
});

describe("signals schema", () => {
  const ACCOUNT = "10000000-0000-0000-0000-000000000001";
  const SIGNAL = "c0000000-0000-0000-0000-000000000001";
  const DUP_SIGNAL = "c0000000-0000-0000-0000-000000000002";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.signals (id, account_id, title, summary, so_what, source_name, source_url, source_date, relevance, url_hash)
        values ('${SIGNAL}', '${ACCOUNT}', 'AmEx ups tech spend', 'What happened.', 'Budget has air cover.',
                'Payments Dive', 'https://www.paymentsdive.com/news/amex-ups-marketing-tech-spend/826146/', '2026-07-24', 3, 'hash-a');
        insert into public.hypotheses (account_id, content, version, source)
        values ('${ACCOUNT}', 'The bet: agents everywhere, Factory the guardrails.', 1, 'manual');
      `);
    }),
  );

  it("defaults to a new relevance-3 signal owned by the creator", () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.signals (id, account_id, title, summary, so_what, source_name, source_url, url_hash)
        values ('${DUP_SIGNAL}', '${ACCOUNT}', 'x', 'y', 'z', 'w', 'https://x.example.com/a', 'hash-b')
      `);
      const res = await db.query<{ status: string; relevance: number; owner_id: string }>(
        `select status, relevance, owner_id from public.signals where id = '${DUP_SIGNAL}'`,
      );
      expect(res.rows).toEqual([{ status: "new", relevance: 3, owner_id: USER_A }]);
    }),
  );

  it("enforces the relevance band, the status vocabulary and url dedupe", () =>
    as(USER_A, async () => {
      await expect(
        db.exec(`insert into public.signals (title, summary, so_what, source_name, source_url, relevance, url_hash)
                 values ('x', 'y', 'z', 'w', 'https://x.example.com/b', 0, 'hash-c')`),
      ).rejects.toThrow();
      await expect(
        db.exec(`insert into public.signals (title, summary, so_what, source_name, source_url, relevance, url_hash)
                 values ('x', 'y', 'z', 'w', 'https://x.example.com/c', 6, 'hash-d')`),
      ).rejects.toThrow();
      await expect(db.exec(`update public.signals set status = 'read' where id = '${SIGNAL}'`)).rejects.toThrow();
      await expect(
        db.exec(`insert into public.signals (title, summary, so_what, source_name, source_url, url_hash)
                 values ('x', 'y', 'z', 'w', 'https://x.example.com/a', 'hash-a')`),
      ).rejects.toThrow(); // unique (owner_id, url_hash)
    }),
  );

  it("versions hypotheses instead of updating them", () =>
    as(USER_A, async () => {
      await db.exec(`insert into public.hypotheses (account_id, content, version, source)
                     values ('${ACCOUNT}', 'v2 with a signal folded in.', 2, 'signal')`);
      const res = await db.query<{ version: number; source: string }>(
        `select version, source from public.hypotheses where account_id = '${ACCOUNT}' order by version desc`,
      );
      expect(res.rows).toEqual([
        { version: 2, source: "signal" },
        { version: 1, source: "manual" },
      ]);
    }),
  );

  it("scopes signals and hypotheses to their owner", () =>
    as(USER_B, async () => {
      const signals = await db.query(`select id from public.signals`);
      const hypotheses = await db.query(`select id from public.hypotheses`);
      expect(signals.rows).toEqual([]);
      expect(hypotheses.rows).toEqual([]);
    }),
  );

  it("cascades signals and hypotheses when the account goes", () =>
    as(USER_A, async () => {
      await db.exec(`delete from public.accounts where id = '${ACCOUNT}'`);
      const signals = await db.query(`select id from public.signals`);
      const hypotheses = await db.query(`select id from public.hypotheses`);
      expect(signals.rows).toEqual([]);
      expect(hypotheses.rows).toEqual([]);
    }),
  );
});

describe("demo reset", () => {
  const ACCOUNT = "10000000-0000-0000-0000-0000000000f1";
  const PERSON_A = "30000000-0000-0000-0000-0000000000f1";
  const PERSON_B = "30000000-0000-0000-0000-0000000000f2";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.accounts (id, name, domain) values ('${ACCOUNT}', 'Reset Co', 'reset.example');
        insert into public.orgs (id, account_id, name) values ('20000000-0000-0000-0000-0000000000f1', '${ACCOUNT}', 'Platform');
        insert into public.contacts (id, account_id, org_id, first_name, last_name) values
          ('${PERSON_A}', '${ACCOUNT}', '20000000-0000-0000-0000-0000000000f1', 'Asha', 'Patel'),
          ('${PERSON_B}', '${ACCOUNT}', null, 'Ben', 'Orta');
        insert into public.notes (contact_id, account_id, body_html) values ('${PERSON_A}', '${ACCOUNT}', '<p>hi</p>');
        insert into public.influences (from_contact_id, to_contact_id, strength, evidence) values ('${PERSON_B}', '${PERSON_A}', 'high', '[]');
        insert into public.tasks (account_id, title) values ('${ACCOUNT}', 'Reset check');
        insert into public.campaigns (id, account_id, name) values ('d0000000-0000-0000-0000-000000000001', '${ACCOUNT}', 'Reset dinner');
        insert into public.campaign_members (campaign_id, contact_id, contact_account_id) values ('d0000000-0000-0000-0000-000000000001', '${PERSON_A}', '${ACCOUNT}');
        insert into public.signals (account_id, title, summary, so_what, source_name, source_url, url_hash) values ('${ACCOUNT}', 's', 's', 's', 's', 'https://reset.example/s', 'hash-r');
        insert into public.hypotheses (account_id, content) values ('${ACCOUNT}', 'reset v1');
        insert into public.documents (account_id, title, raw_text) values ('${ACCOUNT}', 'Transcript', 'hello');
        insert into public.inferences (subject_type, subject_id, kind, value, confidence, evidence) values ('contact', '${PERSON_A}', 'persona', '{"personas":["CH"]}', 'inference', '[]');
        insert into public.import_batches (file_name, status) values ('reset.csv', 'review');
        insert into public.import_items (batch_id, row_index, action, payload) values ((select id from public.import_batches limit 1), 0, 'create', '{}'::jsonb);
        insert into public.research_docs (scope, doc_type, title, body_html) values ('account', 'org_map', 'Reset map', '<p>map</p>');
        insert into public.tags (name, description) values ('reset-tag', 'why');
        insert into public.contact_tags (contact_id, tag_id) values ('${PERSON_A}', (select id from public.tags limit 1));
      `);
    }),
  );

  it("only names tables that exist", async () => {
    const res = await db.query<{ table_name: string }>(`select table_name from information_schema.tables where table_schema = 'public'`);
    const names = new Set(res.rows.map((r) => r.table_name));
    for (const t of WIPE_TABLES) expect(names.has(t)).toBe(true);
  });

  it("wipes every root and cascades the children, in the reset order", () =>
    as(USER_A, async () => {
      for (const table of WIPE_TABLES) {
        await db.exec(`delete from public.${table}`);
      }
      for (const t of [
        ...WIPE_TABLES,
        "orgs",
        "notes",
        "influences",
        "campaign_members",
        "import_items",
        "contact_tags",
        "contact_initiatives",
        "contact_challenges",
      ]) {
        const res = await db.query<{ n: number }>(`select count(*)::int as n from public.${t}`);
        expect(res.rows[0]?.n).toBe(0);
      }
    }),
  );
});

describe("import chunks", () => {
  const BATCH = "70000000-0000-0000-0000-000000000001";
  const ITEM_A = "70000000-0000-0000-0000-00000000000a";
  const ITEM_B = "70000000-0000-0000-0000-00000000000b";

  beforeAll(async () =>
    as(USER_A, async () => {
      await db.exec(`
        insert into public.import_batches (id, file_name, status) values ('${BATCH}', 'amex.csv', 'applying');
        insert into public.import_items (id, batch_id, row_index, action, payload, decision) values
          ('${ITEM_A}', '${BATCH}', 0, 'create', '{}'::jsonb, 'accept'),
          ('${ITEM_B}', '${BATCH}', 1, 'create', '{}'::jsonb, 'accept');
      `);
    }),
  );

  it("accepts the applying status", () =>
    as(USER_A, async () => {
      const res = await db.query<{ status: string }>(`select status from public.import_batches where id = '${BATCH}'`);
      expect(res.rows).toEqual([{ status: "applying" }]);
    }));

  it("marks processed rows so an interrupted apply resumes", () =>
    as(USER_A, async () => {
      await db.exec(`update public.import_items set processed_at = now() where id = '${ITEM_A}'`);
      const pending = await db.query<{ id: string }>(
        `select id from public.import_items where batch_id = '${BATCH}' and processed_at is null order by row_index`,
      );
      expect(pending.rows).toEqual([{ id: ITEM_B }]);
    }));

  it("keeps other owners' import rows invisible", () =>
    as(USER_B, async () => {
      const rows = await db.query(`select id from public.import_items`);
      expect(rows.rows).toEqual([]);
    }));
});
