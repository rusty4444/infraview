import { useState } from "react";
import { useServiceConfigs } from "@/hooks/use-service-data";
import { useTheme } from "@/lib/theme";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Sun,
  Moon,
  Activity,
  Server,
  Globe,
  Archive,
  Plus,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceType = "netdata" | "uptimekuma" | "backrest";

const SERVICE_INFO: Record<ServiceType, { icon: any; label: string; placeholder: string; description: string }> = {
  netdata: {
    icon: Server,
    label: "Netdata",
    placeholder: "http://192.168.1.100:19999",
    description: "System metrics agent — CPU, RAM, disk, network. Connects via the Agent REST API.",
  },
  uptimekuma: {
    icon: Globe,
    label: "Uptime Kuma",
    placeholder: "http://192.168.1.100:3001",
    description: "Uptime monitoring. Reads from the /metrics Prometheus endpoint.",
  },
  backrest: {
    icon: Archive,
    label: "Backrest",
    placeholder: "http://192.168.1.100:9898",
    description: "Restic backup orchestrator. Connects via the gRPC-Web API.",
  },
};

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { data: configs, isLoading } = useServiceConfigs();
  const { toast } = useToast();

  const [newType, setNewType] = useState<ServiceType>("netdata");
  const [newUrl, setNewUrl] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        serviceType: newType,
        url: newUrl.replace(/\/$/, ""),
        enabled: true,
      };
      if (newUsername) body.username = newUsername;
      if (newPassword) body.password = newPassword;
      if (newApiKey) body.apiKey = newApiKey;
      return apiRequest("POST", "/api/configs", body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configs"] });
      setNewUrl("");
      setNewUsername("");
      setNewPassword("");
      setNewApiKey("");
      toast({ title: "Service added", description: `${SERVICE_INFO[newType].label} configured successfully.` });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configs"] });
      toast({ title: "Service removed" });
    },
  });

  // Determine which service types are already configured
  const configuredTypes = new Set(
    ((configs as any[]) || []).map((c: any) => c.serviceType)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Activity className="w-4.5 h-4.5 text-primary" />
              </div>
              <h1 className="text-base font-semibold tracking-tight">Settings</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle} className="h-8 w-8">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Current Services */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Connected Services
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Card key={i} className="border-card-border animate-pulse">
                  <CardContent className="p-4 h-16" />
                </Card>
              ))}
            </div>
          ) : ((configs as any[]) || []).length === 0 ? (
            <Card className="border-card-border">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No services configured yet. Add one below.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {((configs as any[]) || []).map((config: any) => {
                const info = SERVICE_INFO[config.serviceType as ServiceType];
                const Icon = info?.icon || Server;
                return (
                  <Card key={config.id} className="border-card-border" data-testid={`config-${config.id}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{info?.label || config.serviceType}</span>
                          <Badge variant={config.enabled ? "secondary" : "outline"} className="text-[10px]">
                            {config.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{config.url}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(config.id)}
                        data-testid={`button-delete-${config.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Add New Service */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Add Service
          </h2>
          <Card className="border-card-border">
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Service Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as ServiceType)}>
                  <SelectTrigger data-testid="select-service-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="netdata">Netdata</SelectItem>
                    <SelectItem value="uptimekuma">Uptime Kuma</SelectItem>
                    <SelectItem value="backrest">Backrest</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">{SERVICE_INFO[newType].description}</p>
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">URL</Label>
                <Input
                  placeholder={SERVICE_INFO[newType].placeholder}
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  data-testid="input-url"
                />
              </div>

              {(newType === "uptimekuma" || newType === "backrest") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Username</Label>
                    <Input
                      placeholder="Optional"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      data-testid="input-username"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Password</Label>
                    <Input
                      type="password"
                      placeholder="Optional"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-password"
                    />
                  </div>
                </div>
              )}

              {newType === "uptimekuma" && (
                <div>
                  <Label className="text-xs mb-1.5 block">API Key (alternative to username/password)</Label>
                  <Input
                    type="password"
                    placeholder="Optional Prometheus API key"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    data-testid="input-apikey"
                  />
                </div>
              )}

              {configuredTypes.has(newType) && (
                <p className="text-xs text-amber-500">
                  A {SERVICE_INFO[newType].label} service is already configured. Adding another will replace it in the dashboard.
                </p>
              )}

              <Button
                onClick={() => addMutation.mutate()}
                disabled={!newUrl.trim() || addMutation.isPending}
                className="w-full"
                data-testid="button-add-service"
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add {SERVICE_INFO[newType].label}
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

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
