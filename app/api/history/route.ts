import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { testRecords } from "../../../db/schema";

async function ensureSchema() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS test_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    ai_name TEXT NOT NULL,
    question_count INTEGER NOT NULL,
    primary_type TEXT NOT NULL,
    primary_match INTEGER NOT NULL,
    secondary_type TEXT NOT NULL,
    secondary_match INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_test_records_client_created ON test_records(client_id, created_at)").run();
}

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("clientId")?.trim();
  if (!clientId) return Response.json({ records: [] });
  await ensureSchema();
  const records = await getDb().select().from(testRecords).where(eq(testRecords.clientId, clientId)).orderBy(desc(testRecords.createdAt), desc(testRecords.id)).limit(20);
  return Response.json({ records });
}

export async function POST(request: Request) {
  const payload = await request.json() as {
    clientId?: string; aiName?: string; questionCount?: number;
    primaryType?: string; primaryMatch?: number; secondaryType?: string; secondaryMatch?: number;
  };
  if (!payload.clientId || !payload.aiName || !payload.primaryType || !payload.secondaryType || ![36, 48].includes(payload.questionCount ?? 0)) {
    return Response.json({ error: "invalid test record" }, { status: 400 });
  }
  await ensureSchema();
  const [record] = await getDb().insert(testRecords).values({
    clientId: payload.clientId.slice(0, 80), aiName: payload.aiName.slice(0, 16), questionCount: payload.questionCount!,
    primaryType: payload.primaryType, primaryMatch: payload.primaryMatch ?? 0,
    secondaryType: payload.secondaryType, secondaryMatch: payload.secondaryMatch ?? 0,
  }).returning();
  return Response.json({ record }, { status: 201 });
}
