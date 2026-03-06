describe("cron route config", () => {
  it("morning route exports maxDuration of 60", async () => {
    jest.mock("@/lib/playtomic/pollAndCleanup", () => ({
      pollAndCleanup: jest.fn().mockResolvedValue({ ok: true }),
    }));
    const route = await import("@/app/api/poll-playtomic/morning/route");
    expect(route.maxDuration).toBe(60);
  });

  it("evening route exports maxDuration of 60", async () => {
    jest.mock("@/lib/playtomic/pollAndCleanup", () => ({
      pollAndCleanup: jest.fn().mockResolvedValue({ ok: true }),
    }));
    const route = await import("@/app/api/poll-playtomic/evening/route");
    expect(route.maxDuration).toBe(60);
  });
});
