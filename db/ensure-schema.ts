import { env } from "cloudflare:workers";

const optionalColumns: Record<string, string> = {
  raw_ei: "INTEGER",
  raw_sn: "INTEGER",
  raw_tf: "INTEGER",
  raw_jp: "INTEGER",
};

export async function ensureTestRecordSchema() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS test_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    ai_name TEXT NOT NULL,
    question_count INTEGER NOT NULL,
    primary_type TEXT NOT NULL,
    primary_match INTEGER NOT NULL,
    secondary_type TEXT NOT NULL,
    secondary_match INTEGER NOT NULL,
    raw_ei INTEGER,
    raw_sn INTEGER,
    raw_tf INTEGER,
    raw_jp INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const schema = await env.DB.prepare("PRAGMA table_info(test_records)").all<{ name: string }>();
  const existing = new Set(schema.results.map((column) => column.name));
  for (const [name, type] of Object.entries(optionalColumns)) {
    if (!existing.has(name)) await env.DB.prepare(`ALTER TABLE test_records ADD COLUMN ${name} ${type}`).run();
  }
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_test_records_client_created ON test_records(client_id, created_at)").run();
}
