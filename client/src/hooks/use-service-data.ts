import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ServiceConfig } from "@shared/schema";

// These hooks rely on the QueryClient's default queryFn (see lib/queryClient.ts),
// which fetches queryKey.join("/") and returns the parsed JSON body. With the
// locked @tanstack/react-query (5.94.5), useQuery without an inline queryFn
// infers data as unknown/{}, so each hook declares its response shape
// explicitly. Runtime behaviour is unchanged.

// ─── Netdata Hooks ───────────────────────────────

// Netdata /api/v1/info passthrough: dynamic JSON object (hostname, version, …).
export function useNetdataInfo() {
  return useQuery<Record<string, any>>({
    queryKey: ["/api/netdata/info"],
    refetchInterval: 30000,
    retry: 1,
  });
}

export function useNetdataChartData(chart: string, after = -600, points = 60) {
  return useQuery({
    queryKey: ["/api/netdata/data", chart, after, points],
    queryFn: async () => {
      const params = new URLSearchParams({
        chart,
        after: String(after),
        points: String(points),
        format: "json",
        options: "seconds",
      });
      const resp = await apiRequest("GET", `/api/netdata/data?${params}`);
      return resp.json();
    },
    refetchInterval: 5000,
    retry: 1,
  });
}

// Netdata /api/v1/alarms?active passthrough: map of alarm entries under `alarms`.
export function useNetdataAlarms() {
  return useQuery<{ alarms?: Record<string, any> }>({
    queryKey: ["/api/netdata/alarms"],
    refetchInterval: 15000,
    retry: 1,
  });
}

// ─── Uptime Kuma Hooks ───────────────────────────

export function useUptimeKumaMetrics() {
  return useQuery({
    queryKey: ["/api/uptimekuma/metrics"],
    refetchInterval: 30000,
    retry: 1,
  });
}

// ─── Backrest Hooks ──────────────────────────────

export function useBackrestConfig() {
  return useQuery({
    queryKey: ["/api/backrest/config"],
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useBackrestOperations(planId?: string) {
  return useQuery({
    queryKey: ["/api/backrest/operations", planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : "";
      const resp = await apiRequest("GET", `/api/backrest/operations${params}`);
      return resp.json();
    },
    refetchInterval: 30000,
    retry: 1,
  });
}

// ─── UniFi Hooks ─────────────────────────────────

export function useUnifiHealth() {
  return useQuery({
    queryKey: ["/api/unifi/health"],
    refetchInterval: 30000,
    retry: 1,
  });
}

export function useUnifiDevices() {
  return useQuery({
    queryKey: ["/api/unifi/devices"],
    refetchInterval: 30000,
    retry: 1,
  });
}

export function useUnifiClients() {
  return useQuery({
    queryKey: ["/api/unifi/clients"],
    refetchInterval: 30000,
    retry: 1,
  });
}

// ─── Service Configs ─────────────────────────────

export function useServiceConfigs() {
  return useQuery<ServiceConfig[]>({
    queryKey: ["/api/configs"],
    staleTime: 5000,
  });
}
