import { describe, expect, it } from "vitest";

describe("ilk yönetici (ortam değişkeniyle)", () => {
  it("hiç kullanıcı yokken ADMIN_EMAIL ve ADMIN_PASSWORD ile yönetici açar; giriş yapılabilir", async () => {
    process.env.ADMIN_EMAIL = "Kurulum@Example.com";
    process.env.ADMIN_PASSWORD = "kurulum-parolasi-123";
    const { getDb } = await import("@/lib/db/client");
    const { users } = await import("@/lib/db/schema");
    const { login } = await import("@/lib/auth/sessions");
    const rows = getDb().select().from(users).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("kurulum@example.com");
    expect(rows[0].role).toBe("admin");
    expect(rows[0].passwordHash).not.toContain("kurulum-parolasi-123");
    expect((await login("kurulum@example.com", "kurulum-parolasi-123", "1.1.1.1")).ok).toBe(true);
    expect((await login("kurulum@example.com", "yanlis-parola-000", "1.1.1.1")).ok).toBe(false);
  });
});
