export function friendlyWeek(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const day = d.getUTCDate();
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${mon} ${day}`;
}

export function friendlyMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  const mon = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${mon} '${y.slice(2)}`;
}

export function friendlyBucket(key: string): string {
  return key.length <= 7 ? friendlyMonth(key) : friendlyWeek(key);
}
