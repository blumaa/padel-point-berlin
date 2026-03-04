/**
 * Probe the Playtomic internal API to check what data is available
 * for Berlin padel venues without authentication.
 *
 * Usage:  npx tsx scripts/probe-playtomic.ts
 */

const BERLIN_COORD = "52.5200,13.4050";
const RADIUS_M = 30_000;
const TENANTS_URL = "https://api.playtomic.io/v1/tenants";
const MATCHES_URL = "https://api.playtomic.io/v1/matches";

// ── helpers ──────────────────────────────────────────────────────────────────

function isoNow() {
  return new Date().toISOString().replace(/\.\d+Z$/, "");
}

function iso14Days() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().replace(/\.\d+Z$/, "");
}

async function fetchJSON(url: string, label: string): Promise<unknown> {
  console.log(`\n→ GET ${url}`);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; probe-script/1.0)",
      "Accept": "application/json",
    },
    redirect: "follow",
  });
  console.log(`  Status: ${res.status} ${res.statusText}`);
  console.log(`  Content-Type: ${res.headers.get("content-type")}`);
  const text = await res.text();
  if (!res.ok || text.trimStart().startsWith("<")) {
    console.error(`  Response preview: ${text.slice(0, 300)}`);
    return null;
  }
  return JSON.parse(text);
}

function printKeys(obj: unknown, indent = "  ") {
  if (Array.isArray(obj)) {
    console.log(`${indent}[array of ${obj.length}]`);
    if (obj.length > 0) printKeys(obj[0], indent + "  ");
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      const type = Array.isArray(v) ? `array(${(v as unknown[]).length})` : typeof v;
      console.log(`${indent}${k}: ${type} = ${JSON.stringify(v)?.slice(0, 80)}`);
      if (v && typeof v === "object" && !Array.isArray(v)) {
        printKeys(v, indent + "  ");
      }
    }
  }
}

// ── step 1: venues ────────────────────────────────────────────────────────────

async function probeVenues() {
  const params = new URLSearchParams({
    playtomic_status: "ACTIVE",
    sport_id: "PADEL",
    coordinate: BERLIN_COORD,
    radius: String(RADIUS_M),
    size: "40",
  });

  const data = await fetchJSON(`${TENANTS_URL}?${params}`, "tenants") as unknown[] | null;
  if (!data || !Array.isArray(data)) return [];

  console.log(`\n✓ Found ${data.length} venues`);
  console.log("\nFirst venue — all fields:");
  printKeys(data[0]);

  console.log("\nAll venues:");
  for (const v of data as Record<string, unknown>[]) {
    console.log(`  ${v["tenant_id"]}  ${v["tenant_name"]}  ${(v["address"] as Record<string,unknown>)?.["city"] ?? ""}`);
  }

  return (data as Record<string, unknown>[]).map((v) => v["tenant_id"] as string);
}

// ── step 2: matches ───────────────────────────────────────────────────────────

async function probeMatches(tenantIds: string[]) {
  if (tenantIds.length === 0) {
    console.log("\n⚠ No tenant IDs — skipping matches probe");
    return;
  }

  // Use first 5 venues to keep URL short
  const sample = tenantIds.slice(0, 5);
  const params = new URLSearchParams({
    sport_id: "PADEL",
    visibility: "PUBLIC",
    from_start_date: isoNow(),
    to_start_date: iso14Days(),
    has_players: "true",
    size: "10",
    page: "0",
  });
  for (const id of sample) params.append("tenant_ids[]", id);

  const data = await fetchJSON(`${MATCHES_URL}?${params}`, "matches") as unknown[] | null;
  if (data === null) return;

  if (!Array.isArray(data)) {
    console.log("\nUnexpected response shape:");
    printKeys(data);
    return;
  }

  console.log(`\n✓ Found ${data.length} open matches (first 5 venues, next 14 days)`);

  if (data.length === 0) {
    console.log("  (no open matches right now — try widening the date range or check all venues)");
    return;
  }

  console.log("\nFirst match — all fields:");
  printKeys(data[0]);

  console.log("\nAll matches summary:");
  for (const m of data as Record<string, unknown>[]) {
    const rp = m["resource_properties"] as Record<string, unknown> | undefined;
    const tenant = m["tenant"] as Record<string, unknown> | undefined;
    console.log(
      `  ${m["match_id"]}  ${m["start_date"]}  ` +
      `level ${m["min_level"]}–${m["max_level"]}  ` +
      `${m["gender"]}  ` +
      `${tenant?.["tenant_name"] ?? ""}  ` +
      `feature=${rp?.["resource_feature"] ?? "?"}  ` +
      `type=${rp?.["resource_type"] ?? "?"}`
    );
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Playtomic API Probe ===");
  console.log(`Berlin coord: ${BERLIN_COORD}, radius: ${RADIUS_M}m`);

  const tenantIds = await probeVenues();
  await probeMatches(tenantIds);

  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
