import type { MessageFormat } from "@/lib/types";

export function detectFormat(text: string): MessageFormat {
  if (text.includes("app.playtomic.io/lesson_class/")) {
    return "formatB";
  }

  if (text.includes("📅") && text.includes("app.playtomic.io/t/")) {
    return "formatA";
  }

  if (text.includes("app.playtomic.io/t/")) {
    return "formatA";
  }

  return "formatC";
}
