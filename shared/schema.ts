import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const serviceConfigs = sqliteTable("service_configs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceType: text("service_type").notNull(), // 'netdata' | 'uptimekuma' | 'backrest'
  url: text("url").notNull(),
  apiKey: text("api_key"),
  username: text("username"),
  password: text("password"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const insertServiceConfigSchema = createInsertSchema(serviceConfigs).omit({
  id: true,
});

export type InsertServiceConfig = z.infer<typeof insertServiceConfigSchema>;
export type ServiceConfig = typeof serviceConfigs.$inferSelect;
