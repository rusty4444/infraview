import { useUnifiHealth, useUnifiDevices, useUnifiClients } from "@/hooks/use-service-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Wifi, Router, Monitor, Smartphone, HardDrive, CircleCheck, CircleX, ArrowDown, ArrowUp, Users } from "lucide-react";

export function UnifiPanel() {
  const { data: healthData, isLoading: healthLoading, isError: healthError } = useUnifiHealth();
  const { data: devicesData, isLoading: devicesLoading } = useUnifiDevices();
  const { data: clientsData, isLoading: clientsLoading } = useUnifiClients();

  const health = (healthData as any)?.data || [];
  const devices = (devicesData as any)?.data || [];
  const clients = (clientsData as any)?.data || [];

  // Extract health subsystems
  const wan = health.find((h: any) => h.subsystem === "wan");
  const lan = health.find((h: any) => h.subsystem === "lan");
  const wlan = health.find((h: any) => h.subsystem === "wlan");

  // Count device types
  const aps = devices.filter((d: any) => d.type === "uap");
  const switches = devices.filter((d: any) => d.type === "usw");
  const gateways = devices.filter((d: any) => d.type === "ugw" || d.type === "udm");
  const adoptedDevices = devices.filter((d: any) => d.adopted === true);

  // Client counts
  const wiredClients = clients.filter((c: any) => !c.is_wired === false || c.is_wired === true);
  const wirelessClients = clients.filter((c: any) => c.is_wired === false);
  const totalClients = clients.length;

  return (
    <section data-testid="section-unifi">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Network
        </h2>
        {!healthLoading && adoptedDevices.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-auto" data-testid="badge-device-count">
            {adoptedDevices.length} device{adoptedDevices.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {healthLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-7 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : healthError ? (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Unable to reach UniFi controller. Check your configuration.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {/* WAN Status */}
            <Card className="border-card-border" data-testid="kpi-wan">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Router className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">WAN</span>
                </div>
                {wan ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      {wan.status === "ok" ? (
                        <CircleCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <CircleX className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xl font-semibold">{wan.status === "ok" ? "Online" : "Down"}</span>
                    </div>
                    {(wan["rx_bytes-r"] || wan["tx_bytes-r"]) && (
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5 tabular-nums">
                          <ArrowDown className="w-3 h-3" />
                          {formatBytesRate(wan["rx_bytes-r"])}
                        </span>
                        <span className="flex items-center gap-0.5 tabular-nums">
                          <ArrowUp className="w-3 h-3" />
                          {formatBytesRate(wan["tx_bytes-r"])}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">No data</span>
                )}
              </CardContent>
            </Card>

            {/* Clients */}
            <Card className="border-card-border" data-testid="kpi-clients">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clients</span>
                </div>
                <span className="text-xl font-semibold tabular-nums">{totalClients}</span>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    {wlan?.num_user || wirelessClients.length} WiFi
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {lan?.num_user || (totalClients - wirelessClients.length)} Wired
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* APs */}
            <Card className="border-card-border" data-testid="kpi-aps">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">APs</span>
                </div>
                <span className="text-xl font-semibold tabular-nums">{aps.length}</span>
                {wlan && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {wlan.status === "ok" ? "All operational" : wlan.status}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Switches */}
            <Card className="border-card-border" data-testid="kpi-switches">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Switches</span>
                </div>
                <span className="text-xl font-semibold tabular-nums">{switches.length}</span>
                {lan && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {lan.status === "ok" ? "All operational" : lan.status}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Cards */}
          {devices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {devices.map((device: any, i: number) => (
                <DeviceCard key={i} device={device} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function DeviceCard({ device }: { device: any }) {
  const isOnline = device.state === 1;
  const statusColor = isOnline ? "text-emerald-500" : "text-red-500";
  const statusBg = isOnline ? "bg-emerald-500/10" : "bg-red-500/10";

  const typeIcon = () => {
    switch (device.type) {
      case "uap": return <Wifi className="w-4 h-4" />;
      case "usw": return <HardDrive className="w-4 h-4" />;
      case "ugw": case "udm": return <Router className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const typeName = () => {
    switch (device.type) {
      case "uap": return "AP";
      case "usw": return "Switch";
      case "ugw": case "udm": return "Gateway";
      default: return device.type?.toUpperCase() || "Device";
    }
  };

  return (
    <Card className="border-card-border" data-testid={`device-${device.mac}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusBg}`}>
            <span className={statusColor}>{typeIcon()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{device.name || device.mac}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {device.model_in_lts || device.model} · {device.ip}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase">
                {typeName()}
              </Badge>
              {device.version && (
                <span className="text-[10px] text-muted-foreground tabular-nums">v{device.version}</span>
              )}
              {device.uptime && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  Up {formatUptime(device.uptime)}
                </span>
              )}
              {device.type === "uap" && device.num_sta != null && (
                <span className="text-[10px] text-muted-foreground">{device.num_sta} clients</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytesRate(bytesPerSec: number): string {
  if (!bytesPerSec) return "0 B/s";
  const bps = bytesPerSec;
  if (bps >= 1e9) return (bps / 1e9).toFixed(1) + " GB/s";
  if (bps >= 1e6) return (bps / 1e6).toFixed(1) + " MB/s";
  if (bps >= 1e3) return (bps / 1e3).toFixed(1) + " KB/s";
  return bps.toFixed(0) + " B/s";
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
