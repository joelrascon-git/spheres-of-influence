import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildFilter } from "@/lib/search/parse";

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
