import { useUptimeKumaMetrics } from "@/hooks/use-service-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, CircleCheck, CircleX, Clock, ShieldCheck } from "lucide-react";

export function UptimeKumaPanel() {
  const { data, isLoading, isError } = useUptimeKumaMetrics();

  const monitors = (data as any)?.monitors || [];
  const upCount = monitors.filter((m: any) => m.status === 1).length;
  const downCount = monitors.filter((m: any) => m.status === 0).length;
  const total = monitors.length;

  return (
    <section data-testid="section-uptimekuma">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Uptime Monitors
        </h2>
        {!isLoading && (
          <div className="flex items-center gap-2 ml-auto">
            <Badge variant="secondary" className="text-xs gap-1" data-testid="badge-up-count">
              <CircleCheck className="w-3 h-3 text-emerald-500" />
              {upCount} up
            </Badge>
            {downCount > 0 && (
              <Badge variant="destructive" className="text-xs gap-1" data-testid="badge-down-count">
                <CircleX className="w-3 h-3" />
                {downCount} down
              </Badge>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Unable to reach Uptime Kuma. Check your configuration.
          </CardContent>
        </Card>
      ) : monitors.length === 0 ? (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No monitors found. Make sure your Uptime Kuma instance has monitors configured.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {monitors.map((monitor: any, i: number) => (
            <MonitorCard key={i} monitor={monitor} />
          ))}
        </div>
      )}
    </section>
  );
}

function MonitorCard({ monitor }: { monitor: any }) {
  const isUp = monitor.status === 1;
  const statusColor = isUp ? "text-emerald-500" : "text-red-500";
  const statusBg = isUp ? "bg-emerald-500/10" : "bg-red-500/10";
  const StatusIcon = isUp ? CircleCheck : CircleX;

  return (
    <Card className="border-card-border" data-testid={`monitor-${monitor.name?.replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusBg}`}>
            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate" data-testid="text-monitor-name">
              {monitor.name}
            </h3>
            {monitor.url && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{monitor.url}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {monitor.responseTime != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="tabular-nums">{monitor.responseTime.toFixed(0)}ms</span>
                </span>
              )}
              {monitor.certDaysRemaining != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="tabular-nums">{Math.floor(monitor.certDaysRemaining)}d</span>
                </span>
              )}
              {monitor.type && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 uppercase">
                  {monitor.type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
