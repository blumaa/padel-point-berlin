export type SortField = "date" | "added";
export type SortDirection = "asc" | "desc";

interface SortableMatch {
  match_time: string;
  created_at: string;
}

export function sortMatches<T extends SortableMatch>(
  matches: T[],
  field: SortField,
  direction: SortDirection
): T[] {
  const sorted = [...matches];

  if (field === "date") {
    sorted.sort((a, b) => a.match_time.localeCompare(b.match_time));
  } else {
    sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  if (direction === "desc") sorted.reverse();

  return sorted;
}
