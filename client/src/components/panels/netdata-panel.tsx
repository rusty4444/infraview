import { useNetdataChartData, useNetdataInfo, useNetdataAlarms } from "@/hooks/use-service-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, MemoryStick, HardDrive, Network, AlertTriangle, Server } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function NetdataPanel() {
  const { data: info, isLoading: infoLoading } = useNetdataInfo();

  return (
    <section data-testid="section-netdata">
      <div className="flex items-center gap-2 mb-4">
        <Server className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          System Metrics
        </h2>
        {info && !infoLoading && (
          <Badge variant="secondary" className="text-xs ml-auto" data-testid="badge-hostname">
            {(info as any).hostname || "Unknown Host"}
          </Badge>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <CpuCard />
        <RamCard />
        <DiskCard />
        <NetworkCard />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ChartCard title="CPU Usage" chart="system.cpu" unit="%" color="hsl(var(--chart-1))" />
        <ChartCard title="RAM Usage" chart="system.ram" unit="MiB" color="hsl(var(--chart-3))" />
      </div>

      {/* Alarms */}
      <AlarmsSection />
    </section>
  );
}

function CpuCard() {
  const { data, isLoading, isError } = useNetdataChartData("system.cpu", -2, 1);

  let value = "—";
  if (data && data.data && data.data.length > 0) {
    const row = data.data[data.data.length - 1];
    // Sum all dimensions except idle (usually last)
    const labels = data.labels || [];
    const idleIdx = labels.indexOf("idle");
    let total = 0;
    for (let i = 1; i < row.length; i++) {
      if (i !== idleIdx) total += row[i] || 0;
    }
    value = total.toFixed(1) + "%";
  }

  return (
    <KpiCard
      icon={<Cpu className="w-4 h-4" />}
      label="CPU"
      value={value}
      loading={isLoading}
      error={isError}
      testId="kpi-cpu"
    />
  );
}

function RamCard() {
  const { data, isLoading, isError } = useNetdataChartData("system.ram", -2, 1);

  let value = "—";
  let detail = "";
  if (data && data.data && data.data.length > 0) {
    const labels = data.labels || [];
    const row = data.data[data.data.length - 1];
    const usedIdx = labels.indexOf("used");
    const freeIdx = labels.indexOf("free");
    const cachedIdx = labels.indexOf("cached");
    const buffersIdx = labels.indexOf("buffers");
    const used = usedIdx > 0 ? row[usedIdx] : 0;
    const free = freeIdx > 0 ? row[freeIdx] : 0;
    const cached = cachedIdx > 0 ? row[cachedIdx] : 0;
    const buffers = buffersIdx > 0 ? row[buffersIdx] : 0;
    const total = used + free + cached + buffers;
    if (total > 0) {
      const pct = ((used / total) * 100).toFixed(1);
      value = pct + "%";
      detail = `${formatMiB(used)} / ${formatMiB(total)}`;
    }
  }

  return (
    <KpiCard
      icon={<MemoryStick className="w-4 h-4" />}
      label="RAM"
      value={value}
      detail={detail}
      loading={isLoading}
      error={isError}
      testId="kpi-ram"
    />
  );
}

function DiskCard() {
  const { data, isLoading, isError } = useNetdataChartData("disk_space._", -2, 1);

  let value = "—";
  if (data && data.data && data.data.length > 0) {
    const labels = data.labels || [];
    const row = data.data[data.data.length - 1];
    const usedIdx = labels.indexOf("used");
    const availIdx = labels.indexOf("avail");
    const reservedIdx = labels.indexOf("reserved_for_root");
    const used = usedIdx > 0 ? row[usedIdx] : 0;
    const avail = availIdx > 0 ? row[availIdx] : 0;
    const reserved = reservedIdx > 0 ? row[reservedIdx] : 0;
    const total = used + avail + reserved;
    if (total > 0) {
      value = ((used / total) * 100).toFixed(1) + "%";
    }
  }

  return (
    <KpiCard
      icon={<HardDrive className="w-4 h-4" />}
      label="Disk"
      value={value}
      loading={isLoading}
      error={isError}
      testId="kpi-disk"
    />
  );
}

function NetworkCard() {
  const { data, isLoading, isError } = useNetdataChartData("system.net", -2, 1);

  let value = "—";
  if (data && data.data && data.data.length > 0) {
    const labels = data.labels || [];
    const row = data.data[data.data.length - 1];
    const recvIdx = labels.indexOf("InOctets");
    const sentIdx = labels.indexOf("OutOctets");
    const recv = recvIdx > 0 ? Math.abs(row[recvIdx] || 0) : 0;
    const sent = sentIdx > 0 ? Math.abs(row[sentIdx] || 0) : 0;
    value = `↓${formatKiB(recv)} ↑${formatKiB(sent)}`;
  }

  return (
    <KpiCard
      icon={<Network className="w-4 h-4" />}
      label="Network"
      value={value}
      loading={isLoading}
      error={isError}
      testId="kpi-network"
    />
  );
}

function ChartCard({
  title,
  chart,
  unit,
  color,
}: {
  title: string;
  chart: string;
  unit: string;
  color: string;
}) {
  const { data, isLoading } = useNetdataChartData(chart, -600, 60);

  const chartData =
    data && data.data
      ? data.data.map((row: number[]) => {
          const labels = data.labels || [];
          const point: any = { time: row[0] };
          // For CPU: sum non-idle; for RAM: use "used"
          if (chart === "system.cpu") {
            const idleIdx = labels.indexOf("idle");
            let total = 0;
            for (let i = 1; i < row.length; i++) {
              if (i !== idleIdx) total += row[i] || 0;
            }
            point.value = total;
          } else if (chart === "system.ram") {
            const usedIdx = labels.indexOf("used");
            point.value = usedIdx > 0 ? row[usedIdx] : 0;
          } else {
            point.value = row[1] || 0;
          }
          return point;
        })
      : [];

  return (
    <Card className="border-card-border" data-testid={`chart-${chart.replace(/\./g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">10min</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-[160px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${chart}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(t: number) => {
                  const d = new Date(t * 1000);
                  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                }}
                stroke="hsl(var(--border))"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={45}
                stroke="hsl(var(--border))"
                tickFormatter={(v: number) =>
                  unit === "MiB" ? formatMiB(v) : `${v.toFixed(0)}${unit}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "hsl(var(--foreground))",
                }}
                labelFormatter={(t: number) => new Date(t * 1000).toLocaleTimeString()}
                formatter={(v: number) => [
                  unit === "MiB" ? formatMiB(v) : `${v.toFixed(1)}${unit}`,
                  title,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={`url(#grad-${chart})`}
                strokeWidth={1.5}
                dot={false}
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function AlarmsSection() {
  const { data, isLoading } = useNetdataAlarms();

  if (isLoading) return null;

  const alarms = data?.alarms ? Object.values(data.alarms) : [];
  const active = (alarms as any[]).filter((a: any) => a.status === "WARNING" || a.status === "CRITICAL");

  if (active.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-medium text-amber-500">{active.length} active alarm{active.length > 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-1.5">
        {active.slice(0, 5).map((alarm: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-md bg-muted/50">
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                alarm.status === "CRITICAL" ? "bg-red-500" : "bg-amber-500"
              }`}
            />
            <span className="font-medium truncate">{alarm.name}</span>
            <span className="text-muted-foreground truncate ml-auto">{alarm.info}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Components ──────────────────────────

function KpiCard({
  icon,
  label,
  value,
  detail,
  loading,
  error,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  loading: boolean;
  error: boolean;
  testId: string;
}) {
  return (
    <Card className="border-card-border" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : error ? (
          <span className="text-sm text-muted-foreground">Unavailable</span>
        ) : (
          <>
            <span className="text-xl font-semibold tabular-nums" data-testid={`${testId}-value`}>{value}</span>
            {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatMiB(mib: number): string {
  if (Math.abs(mib) >= 1024) return (mib / 1024).toFixed(1) + " GiB";
  return mib.toFixed(0) + " MiB";
}

function formatKiB(kib: number): string {
  if (Math.abs(kib) >= 1024 * 1024) return (kib / (1024 * 1024)).toFixed(1) + " GiB/s";
  if (Math.abs(kib) >= 1024) return (kib / 1024).toFixed(1) + " MiB/s";
  return kib.toFixed(0) + " KiB/s";
}
