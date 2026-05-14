import { describe, expect, it } from "vitest";
import { getSession, login, logout, refreshSession } from "../auth/authService";
import { SESSION_KEY } from "../auth/authTypes";

describe("authService", () => {
  it("logs in with valid credentials", async () => {
    const session = await login("KataS", "Tota95");
    expect(session).not.toBeNull();
    expect(session?.role).toBe("admin");
    expect(getSession()?.username).toBe("KataS");
    logout();
  });

  it("rejects invalid credentials", async () => {
    const session = await login("KataS", "bad-pass");
    expect(session).toBeNull();
  });

  it("expires sessions past expiresAt", () => {
    const expired = {
      username: "KataS",
      role: "admin",
      displayName: "Katarina S.",
      loginAt: Date.now() - 1000,
      expiresAt: Date.now() - 1,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(expired));
    expect(getSession()).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("refreshes session expiration", async () => {
    const session = await login("KataS", "Tota95");
    expect(session).not.toBeNull();
    const before = getSession()?.expiresAt ?? 0;
    // Ensure at least 1ms passes so the refreshed timestamp differs
    await new Promise(r => setTimeout(r, 2));
    refreshSession();
    const after = getSession()?.expiresAt ?? 0;
    expect(after).toBeGreaterThan(before);
    logout();
  });
});
