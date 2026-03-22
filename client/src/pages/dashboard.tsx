import { useTheme } from "@/lib/theme";
import { useServiceConfigs } from "@/hooks/use-service-data";
import { NetdataPanel } from "@/components/panels/netdata-panel";
import { UptimeKumaPanel } from "@/components/panels/uptimekuma-panel";
import { BackrestPanel } from "@/components/panels/backrest-panel";
import { Sun, Moon, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { theme, toggle } = useTheme();
  const { data: configs } = useServiceConfigs();

  const hasNetdata = configs?.some((c: any) => c.serviceType === "netdata" && c.enabled);
  const hasUptimeKuma = configs?.some((c: any) => c.serviceType === "uptimekuma" && c.enabled);
  const hasBackrest = configs?.some((c: any) => c.serviceType === "backrest" && c.enabled);
  const hasAny = hasNetdata || hasUptimeKuma || hasBackrest;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Activity className="w-4.5 h-4.5 text-primary" />
            </div>
            <h1 className="text-base font-semibold tracking-tight" data-testid="text-app-title">InfraView</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} data-testid="button-theme-toggle"
              className="h-8 w-8">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="link-settings">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        {!hasAny ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {hasNetdata && <NetdataPanel />}
            {hasUptimeKuma && <UptimeKumaPanel />}
            {hasBackrest && <BackrestPanel />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="text-center text-xs text-muted-foreground">
          <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer"
            className="hover:text-foreground transition-colors">
            Created with Perplexity Computer
          </a>
        </div>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Activity className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-2" data-testid="text-empty-title">No services configured</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Add your Netdata, Uptime Kuma, and Backrest endpoints to start monitoring your infrastructure.
      </p>
      <Link href="/settings">
        <Button data-testid="button-go-settings">
          <Settings className="w-4 h-4 mr-2" />
          Configure services
        </Button>
      </Link>
    </div>
  );
}
