import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const testRecords = sqliteTable("test_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id").notNull(),
  aiName: text("ai_name").notNull(),
  questionCount: integer("question_count").notNull(),
  primaryType: text("primary_type").notNull(),
  primaryMatch: integer("primary_match").notNull(),
  secondaryType: text("secondary_type").notNull(),
  secondaryMatch: integer("secondary_match").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
