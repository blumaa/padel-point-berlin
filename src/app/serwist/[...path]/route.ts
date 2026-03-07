import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";
import type { NextRequest } from "next/server";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

const route = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "src/app/sw.ts",
  nextConfig: {},
});

export const { dynamic, dynamicParams, revalidate } = route;

export async function generateStaticParams() {
  const params = await route.generateStaticParams();
  return params.map((p: { path: string }) => ({ path: [p.path] }));
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const adapted = { params: Promise.resolve({ path: path.join("/") }) };
  return route.GET(request, adapted);
}
