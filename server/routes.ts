import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertServiceConfigSchema } from "@shared/schema";

// UniFi controllers use self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ─── Service Configs CRUD ───────────────────────
  app.get("/api/configs", (_req, res) => {
    const configs = storage.getServiceConfigs();
    const safe = configs.map(c => ({
      ...c,
      apiKey: c.apiKey ? "••••••" : null,
      password: c.password ? "••••••" : null,
    }));
    res.json(safe);
  });

  app.post("/api/configs", (req, res) => {
    const parsed = insertServiceConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const config = storage.createServiceConfig(parsed.data);
    res.json(config);
  });

  app.put("/api/configs/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const existing = storage.getServiceConfig(id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    const updated = storage.updateServiceConfig(id, req.body);
    res.json(updated);
  });

  app.delete("/api/configs/:id", (req, res) => {
    const id = parseInt(req.params.id);
    storage.deleteServiceConfig(id);
    res.json({ success: true });
  });

  // ─── Netdata Proxy ─────────────────────────────
  app.get("/api/netdata/info", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("netdata");
      if (!config || !config.enabled) return res.status(404).json({ error: "Netdata not configured" });
      const resp = await fetch(`${config.url}/api/v1/info`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/netdata/charts", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("netdata");
      if (!config || !config.enabled) return res.status(404).json({ error: "Netdata not configured" });
      const resp = await fetch(`${config.url}/api/v1/charts`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/netdata/data", async (req, res) => {
    try {
      const config = storage.getServiceConfigByType("netdata");
      if (!config || !config.enabled) return res.status(404).json({ error: "Netdata not configured" });
      const params = new URLSearchParams(req.query as any);
      const resp = await fetch(`${config.url}/api/v1/data?${params}`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/netdata/alarms", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("netdata");
      if (!config || !config.enabled) return res.status(404).json({ error: "Netdata not configured" });
      const resp = await fetch(`${config.url}/api/v1/alarms?active`);
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ─── Uptime Kuma Proxy ─────────────────────────
  app.get("/api/uptimekuma/metrics", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("uptimekuma");
      if (!config || !config.enabled) return res.status(404).json({ error: "Uptime Kuma not configured" });
      const headers: Record<string, string> = {};
      if (config.username && config.password) {
        headers["Authorization"] = "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64");
      }
      if (config.apiKey) {
        headers["Authorization"] = "Basic " + Buffer.from(`:${config.apiKey}`).toString("base64");
      }
      const resp = await fetch(`${config.url}/metrics`, { headers });
      const text = await resp.text();
      const monitors: any[] = [];
      const lines = text.split("\n");
      const statusMap = new Map<string, any>();

      for (const line of lines) {
        if (line.startsWith("#") || !line.trim()) continue;

        const statusMatch = line.match(/^monitor_status\{([^}]+)\}\s+(\S+)/);
        if (statusMatch) {
          const labels = parsePrometheusLabels(statusMatch[1]);
          const name = labels.monitor_name || "Unknown";
          if (!statusMap.has(name)) statusMap.set(name, { name, type: labels.monitor_type, url: labels.monitor_url || labels.monitor_hostname });
          statusMap.get(name)!.status = parseFloat(statusMatch[2]);
        }

        const rtMatch = line.match(/^monitor_response_time\{([^}]+)\}\s+(\S+)/);
        if (rtMatch) {
          const labels = parsePrometheusLabels(rtMatch[1]);
          const name = labels.monitor_name || "Unknown";
          if (!statusMap.has(name)) statusMap.set(name, { name, type: labels.monitor_type, url: labels.monitor_url || labels.monitor_hostname });
          statusMap.get(name)!.responseTime = parseFloat(rtMatch[2]);
        }

        const certMatch = line.match(/^monitor_cert_days_remaining\{([^}]+)\}\s+(\S+)/);
        if (certMatch) {
          const labels = parsePrometheusLabels(certMatch[1]);
          const name = labels.monitor_name || "Unknown";
          if (!statusMap.has(name)) statusMap.set(name, { name });
          statusMap.get(name)!.certDaysRemaining = parseFloat(certMatch[2]);
        }

        const certValidMatch = line.match(/^monitor_cert_is_valid\{([^}]+)\}\s+(\S+)/);
        if (certValidMatch) {
          const labels = parsePrometheusLabels(certValidMatch[1]);
          const name = labels.monitor_name || "Unknown";
          if (!statusMap.has(name)) statusMap.set(name, { name });
          statusMap.get(name)!.certValid = parseFloat(certValidMatch[2]) === 1;
        }
      }

      statusMap.forEach((v) => monitors.push(v));
      res.json({ monitors });
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ─── Backrest Proxy ────────────────────────────
  app.get("/api/backrest/config", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("backrest");
      if (!config || !config.enabled) return res.status(404).json({ error: "Backrest not configured" });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
      };
      if (config.username && config.password) {
        headers["Authorization"] = "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64");
      }
      // Try Connect protocol first, fall back to plain REST
      let resp = await fetch(`${config.url}/v1/GetConfig`, {
        method: "POST",
        headers,
        body: "{}",
      });
      if (!resp.ok) {
        // Try the alternative endpoint pattern
        resp = await fetch(`${config.url}/api/v1/config`, {
          method: "GET",
          headers: { Authorization: headers["Authorization"] || "" },
        });
      }
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/backrest/operations", async (req, res) => {
    try {
      const config = storage.getServiceConfigByType("backrest");
      if (!config || !config.enabled) return res.status(404).json({ error: "Backrest not configured" });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Connect-Protocol-Version": "1",
      };
      if (config.username && config.password) {
        headers["Authorization"] = "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64");
      }
      const resp = await fetch(`${config.url}/v1/GetOperations`, {
        method: "POST",
        headers,
        body: JSON.stringify({ selector: { planId: req.query.planId || undefined }, lastN: "50" }),
      });
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ─── UniFi Proxy ───────────────────────────────
  app.get("/api/unifi/health", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("unifi");
      if (!config || !config.enabled) return res.status(404).json({ error: "UniFi not configured" });
      const headers: Record<string, string> = { "X-API-KEY": config.apiKey || "" };
      const resp = await fetch(`https://${new URL(config.url).host}/proxy/network/api/s/default/stat/health`, {
        headers,
        // UniFi uses self-signed certs
        ...(typeof process !== 'undefined' ? {} : {}),
      });
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/unifi/devices", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("unifi");
      if (!config || !config.enabled) return res.status(404).json({ error: "UniFi not configured" });
      const baseUrl = config.url.replace(/\/$/, "");
      const headers: Record<string, string> = { "X-API-KEY": config.apiKey || "" };
      const resp = await fetch(`${baseUrl}/proxy/network/api/s/default/stat/device`, { headers });
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/unifi/clients", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("unifi");
      if (!config || !config.enabled) return res.status(404).json({ error: "UniFi not configured" });
      const baseUrl = config.url.replace(/\/$/, "");
      const headers: Record<string, string> = { "X-API-KEY": config.apiKey || "" };
      const resp = await fetch(`${baseUrl}/proxy/network/api/s/default/stat/sta`, { headers });
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  app.get("/api/unifi/sysinfo", async (_req, res) => {
    try {
      const config = storage.getServiceConfigByType("unifi");
      if (!config || !config.enabled) return res.status(404).json({ error: "UniFi not configured" });
      const baseUrl = config.url.replace(/\/$/, "");
      const headers: Record<string, string> = { "X-API-KEY": config.apiKey || "" };
      const resp = await fetch(`${baseUrl}/proxy/network/api/s/default/stat/sysinfo`, { headers });
      const data = await resp.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ─── Health Check ──────────────────────────────
  app.get("/api/health", (_req, res) => {
    const configs = storage.getServiceConfigs();
    res.json({
      status: "ok",
      services: configs.map(c => ({ type: c.serviceType, enabled: c.enabled })),
    });
  });

  return httpServer;
}

function parsePrometheusLabels(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}
