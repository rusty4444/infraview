import { useBackrestConfig, useBackrestOperations } from "@/hooks/use-service-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive, CheckCircle2, XCircle, Clock, Database, FolderArchive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function BackrestPanel() {
  const { data: config, isLoading: configLoading, isError: configError } = useBackrestConfig();
  const { data: opsData, isLoading: opsLoading } = useBackrestOperations();

  const repos = (config as any)?.repos || [];
  const plans = (config as any)?.plans || [];
  const operations = (opsData as any)?.operations || [];

  return (
    <section data-testid="section-backrest">
      <div className="flex items-center gap-2 mb-4">
        <Archive className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Backups
        </h2>
        {!configLoading && repos.length > 0 && (
          <Badge variant="secondary" className="text-xs ml-auto" data-testid="badge-repo-count">
            {repos.length} repo{repos.length > 1 ? "s" : ""}, {plans.length} plan{plans.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {configLoading || opsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-card-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-3" />
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configError ? (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Unable to reach Backrest. Check your configuration.
          </CardContent>
        </Card>
      ) : plans.length === 0 ? (
        <Card className="border-card-border">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No backup plans found. Configure plans in your Backrest instance.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Repos Overview */}
          {repos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              {repos.map((repo: any, i: number) => (
                <RepoCard key={i} repo={repo} />
              ))}
            </div>
          )}

          {/* Plans + Recent Operations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan: any, i: number) => {
              const planOps = operations.filter(
                (op: any) => op.planId === plan.id || op.planId === plan.id
              );
              return <PlanCard key={i} plan={plan} operations={planOps} />;
            })}
          </div>
        </>
      )}
    </section>
  );
}

function RepoCard({ repo }: { repo: any }) {
  return (
    <Card className="border-card-border" data-testid={`repo-${repo.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium truncate">{repo.id}</h3>
        </div>
        <p className="text-xs text-muted-foreground truncate">{repo.uri}</p>
        {repo.prunePolicy && (
          <div className="flex items-center gap-1 mt-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              Prune: {repo.prunePolicy.maxUnusedPercent || "auto"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanCard({ plan, operations }: { plan: any; operations: any[] }) {
  // Find last completed backup operation
  const lastBackup = operations.find(
    (op: any) => op.op?.operationBackup || op.operationBackup
  );
  const lastStatus = lastBackup
    ? (lastBackup.status === 3 || lastBackup.status === "STATUS_SUCCESS" ? "success" : "error")
    : "unknown";

  const lastTime = lastBackup?.unixTimeEndMs
    ? new Date(parseInt(lastBackup.unixTimeEndMs))
    : null;

  const StatusIcon = lastStatus === "success" ? CheckCircle2 : lastStatus === "error" ? XCircle : Clock;
  const statusColor =
    lastStatus === "success"
      ? "text-emerald-500"
      : lastStatus === "error"
        ? "text-red-500"
        : "text-muted-foreground";

  return (
    <Card className="border-card-border" data-testid={`plan-${plan.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FolderArchive className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium truncate">{plan.id}</h3>
            {plan.paths && plan.paths.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {plan.paths[0]}{plan.paths.length > 1 ? ` +${plan.paths.length - 1}` : ""}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`flex items-center gap-1 text-xs ${statusColor}`}>
                <StatusIcon className="w-3 h-3" />
                {lastStatus === "success" ? "OK" : lastStatus === "error" ? "Failed" : "No data"}
              </span>
              {lastTime && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(lastTime, { addSuffix: true })}
                </span>
              )}
              {plan.repo && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                  {plan.repo}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
