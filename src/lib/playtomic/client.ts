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

export async function fetchOpenMatches(
  tenantId: string,
  fromDate: string
): Promise<PlaytomicMatch[]> {
  const to = new Date(fromDate);
  to.setDate(to.getDate() + 14);
  const toDate = to.toISOString().split("T")[0];
  const url =
    `${BASE}/matches?sport_id=PADEL&tenant_id=${tenantId}` +
    `&match_type=OPEN_MATCH&status=PENDING` +
    `&from_start_date=${fromDate}T00:00:00&to_start_date=${toDate}T00:00:00&size=200`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchOpenMatches(${tenantId}): ${res.status}`);
  return res.json() as Promise<PlaytomicMatch[]>;
}
