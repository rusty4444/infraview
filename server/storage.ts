import { serviceConfigs, type InsertServiceConfig, type ServiceConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const dbPath = process.env.DATABASE_PATH || "infraview.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

export interface IStorage {
  getServiceConfigs(): ServiceConfig[];
  getServiceConfig(id: number): ServiceConfig | undefined;
  getServiceConfigByType(serviceType: string): ServiceConfig | undefined;
  createServiceConfig(config: InsertServiceConfig): ServiceConfig;
  updateServiceConfig(id: number, config: Partial<InsertServiceConfig>): ServiceConfig | undefined;
  deleteServiceConfig(id: number): void;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Ensure table exists
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS service_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT NOT NULL,
        url TEXT NOT NULL,
        api_key TEXT,
        username TEXT,
        password TEXT,
        enabled INTEGER NOT NULL DEFAULT 1
      )
    `);
  }

  getServiceConfigs(): ServiceConfig[] {
    return db.select().from(serviceConfigs).all();
  }

  getServiceConfig(id: number): ServiceConfig | undefined {
    return db.select().from(serviceConfigs).where(eq(serviceConfigs.id, id)).get();
  }

  getServiceConfigByType(serviceType: string): ServiceConfig | undefined {
    return db.select().from(serviceConfigs).where(eq(serviceConfigs.serviceType, serviceType)).get();
  }

  createServiceConfig(config: InsertServiceConfig): ServiceConfig {
    return db.insert(serviceConfigs).values(config).returning().get();
  }

  updateServiceConfig(id: number, config: Partial<InsertServiceConfig>): ServiceConfig | undefined {
    return db.update(serviceConfigs).set(config).where(eq(serviceConfigs.id, id)).returning().get();
  }

  deleteServiceConfig(id: number): void {
    db.delete(serviceConfigs).where(eq(serviceConfigs.id, id)).run();
  }
}

export const storage = new DatabaseStorage();

// Seed default configs from environment variables on first run
function seedFromEnv() {
  const existing = storage.getServiceConfigs();
  if (existing.length > 0) return; // already configured

  const seeds: { type: string; urlEnv: string; apiKeyEnv?: string; userEnv?: string; passEnv?: string }[] = [
    { type: "netdata", urlEnv: "NETDATA_URL" },
    { type: "uptimekuma", urlEnv: "UPTIMEKUMA_URL", apiKeyEnv: "UPTIMEKUMA_API_KEY" },
    { type: "backrest", urlEnv: "BACKREST_URL", userEnv: "BACKREST_USERNAME", passEnv: "BACKREST_PASSWORD" },
    { type: "unifi", urlEnv: "UNIFI_URL", apiKeyEnv: "UNIFI_API_KEY" },
  ];

  for (const s of seeds) {
    const url = process.env[s.urlEnv];
    if (!url) continue;
    storage.createServiceConfig({
      serviceType: s.type,
      url: url.replace(/\/$/, ""),
      apiKey: s.apiKeyEnv ? process.env[s.apiKeyEnv] || null : null,
      username: s.userEnv ? process.env[s.userEnv] || null : null,
      password: s.passEnv ? process.env[s.passEnv] || null : null,
      enabled: true,
    });
    console.log(`[seed] Added ${s.type} → ${url}`);
  }
}

seedFromEnv();
