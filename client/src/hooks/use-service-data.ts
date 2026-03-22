import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ─── Netdata Hooks ───────────────────────────────

export function useNetdataInfo() {
  return useQuery({
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

export function useNetdataAlarms() {
  return useQuery({
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
  return useQuery({
    queryKey: ["/api/configs"],
    staleTime: 5000,
  });
}
