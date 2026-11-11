import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Her test dosyası kendi geçici veritabanıyla çalışır.
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "magaza-test-"));
process.env.APP_SECRET = "test-secret-test-secret-test-secret-1234";
process.env.PAYMENTS_PROVIDER = "test";
process.env.PAYMENTS_MODE = "test";
