import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureTestRecordSchema } from "../../../db/ensure-schema";
import { testRecords } from "../../../db/schema";

const validPercentage = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("clientId")?.trim();
  if (!clientId) return Response.json({ records: [] });
  await ensureTestRecordSchema();
  const records = await getDb().select().from(testRecords).where(eq(testRecords.clientId, clientId)).orderBy(desc(testRecords.createdAt), desc(testRecords.id)).limit(20);
  return Response.json({ records });
}

export async function POST(request: Request) {
  const payload = await request.json() as {
    clientId?: string; aiName?: string; questionCount?: number;
    primaryType?: string; primaryMatch?: number; secondaryType?: string; secondaryMatch?: number;
    rawEi?: number; rawSn?: number; rawTf?: number; rawJp?: number;
  };
  const percentages = [payload.primaryMatch, payload.secondaryMatch, payload.rawEi, payload.rawSn, payload.rawTf, payload.rawJp];
  if (!payload.clientId || !payload.aiName || !payload.primaryType || !payload.secondaryType || ![68].includes(payload.questionCount ?? 0) ||
    percentages.some((value) => !validPercentage(value))) {
    return Response.json({ error: "invalid test record" }, { status: 400 });
  }
  await ensureTestRecordSchema();
  const [record] = await getDb().insert(testRecords).values({
    clientId: payload.clientId.slice(0, 80), aiName: payload.aiName.slice(0, 16), questionCount: payload.questionCount!,
    primaryType: payload.primaryType, primaryMatch: payload.primaryMatch ?? 0,
    secondaryType: payload.secondaryType, secondaryMatch: payload.secondaryMatch ?? 0,
    rawEi: payload.rawEi, rawSn: payload.rawSn, rawTf: payload.rawTf, rawJp: payload.rawJp,
  }).returning();
  return Response.json({ record }, { status: 201 });
}
