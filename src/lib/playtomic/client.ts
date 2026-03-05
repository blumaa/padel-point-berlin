import type { PlaytomicMatch, PlaytomicTenant } from "./types";

const BASE = "https://api.playtomic.io/v1";

export async function fetchBerlinVenues(): Promise<PlaytomicTenant[]> {
  const url =
    `${BASE}/tenants?playtomic_status=ACTIVE&sport_id=PADEL` +
    `&coordinate=52.5200,13.4050&radius=30000&size=40`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchBerlinVenues: ${res.status}`);
  return res.json() as Promise<PlaytomicTenant[]>;
}

const PAGE_SIZE = 200;

export async function fetchOpenMatches(
  tenantId: string,
  fromDate: string
): Promise<PlaytomicMatch[]> {
  const to = new Date(fromDate);
  to.setDate(to.getDate() + 14);
  const toDate = to.toISOString().split("T")[0];
  const base =
    `${BASE}/matches?sport_id=PADEL&tenant_id=${tenantId}` +
    `&match_type=OPEN_MATCH&status=PENDING` +
    `&from_start_date=${fromDate}T00:00:00&to_start_date=${toDate}T00:00:00&size=${PAGE_SIZE}`;

  const all: PlaytomicMatch[] = [];
  let page = 0;

  while (true) {
    const res = await fetch(`${base}&page=${page}`);
    if (!res.ok) throw new Error(`fetchOpenMatches(${tenantId}): ${res.status}`);
    const batch = await res.json() as PlaytomicMatch[];
    all.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page++;
  }

  return all;
}
