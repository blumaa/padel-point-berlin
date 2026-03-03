export interface PlaytomicLink {
  id: string;
  url: string;
}

export function extractPlaytomicId(text: string): PlaytomicLink | null {
  // Match lesson_class URLs (UUID format)
  const lessonMatch = text.match(
    /https:\/\/app\.playtomic\.io\/lesson_class\/([0-9a-f-]{36})/
  );
  if (lessonMatch) {
    return { id: lessonMatch[1], url: lessonMatch[0] };
  }

  // Match short /t/ URLs
  const matchUrl = text.match(
    /https:\/\/app\.playtomic\.io\/t\/([A-Za-z0-9]+)/
  );
  if (matchUrl) {
    return { id: matchUrl[1], url: matchUrl[0] };
  }

  return null;
}
