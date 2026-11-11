/**
 * İlk yönetici hesabını (ya da ek bir hesabı) oluşturur.
 *
 *   npm run admin:create -- --email siz@ornek.com --name "Ad Soyad"
 *
 * Parola komut satırından sorulur (ekranda görünmez). Otomasyon için
 * ADMIN_PASSWORD ortam değişkeni de kullanılabilir. Varsayılan parola yoktur.
 */
import { eq } from "drizzle-orm";
import { recordAudit } from "../src/lib/audit";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";
import { getDb } from "../src/lib/db/client";
import { users } from "../src/lib/db/schema";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      let data = "";
      stdin.on("data", (chunk) => (data += chunk));
      stdin.on("end", () => resolve(data.split("\n")[0].trim()));
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (chunk: Buffer) => {
      const ch = chunk.toString("utf8");
      if (ch === "\r" || ch === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") process.exit(1);
      else if (ch === "\u007f") value = value.slice(0, -1);
      else value += ch;
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = (arg("email") ?? "").trim().toLowerCase();
  const name = (arg("name") ?? "").trim() || email;
  const role = arg("role") === "staff" ? "staff" : "admin";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error('Kullanım: npm run admin:create -- --email siz@ornek.com --name "Ad Soyad" [--role staff]');
    process.exit(1);
  }
  const password = process.env.ADMIN_PASSWORD ?? (await askHidden("Parola (en az 10 karakter): "));
  const problem = passwordProblem(password);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
  const db = getDb();
  const passwordHash = await hashPassword(password);
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    db.update(users).set({ passwordHash, role, name, active: true }).where(eq(users.id, existing.id)).run();
    recordAudit(null, "user.cli_update", "user", existing.id, `${email} · ${role}`);
    console.log(`Güncellendi: ${email} (${role})`);
  } else {
    const created = db.insert(users).values({ email, name, role, passwordHash, createdAt: Date.now() }).returning({ id: users.id }).get();
    recordAudit(null, "user.cli_create", "user", created.id, `${email} · ${role}`);
    console.log(`Oluşturuldu: ${email} (${role})`);
  }
}

void main();
