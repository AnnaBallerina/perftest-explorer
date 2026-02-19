import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTestDetail, fetchExecutions, fetchExecutionDetail, type Execution, type ExecutionDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusVariant = (status: string) => {
  switch (status) {
    case "passed":
      return "default" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const METRIC_LABELS: Record<string, string> = {
  http_req_duration: "HTTP Request Duration",
  http_req_waiting: "HTTP Request Waiting",
  http_req_connecting: "HTTP Request Connecting",
  http_req_tls_handshaking: "TLS Handshaking",
  http_req_sending: "HTTP Request Sending",
  http_req_receiving: "HTTP Request Receiving",
  http_req_blocked: "HTTP Request Blocked",
  iteration_duration: "Iteration Duration",
  http_reqs: "HTTP Requests",
  iterations: "Iterations",
  data_received: "Data Received",
  data_sent: "Data Sent",
  vus: "Virtual Users",
  vus_max: "Max Virtual Users",
  checks: "Checks",
  http_req_failed: "HTTP Request Failed",
};

function MetricCard({ name, values }: { name: string; values: Record<string, number> }) {
  const label = METRIC_LABELS[name] || name;
  return (
    <div className="rounded-md border p-3 space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm">
        {Object.entries(values).map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-mono">{typeof v === "number" ? v.toFixed(2) : String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutionBox({ execution }: { execution: Execution }) {
  const [expanded, setExpanded] = useState(false);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["executionDetail", execution.job],
    queryFn: () => fetchExecutionDetail(execution.job),
    enabled: expanded,
  });

  return (
    <Card>
      <CardHeader
        className="cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <CardTitle className="text-base">Execution #{execution.id}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Job: {execution.job}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{execution.rps} RPS</Badge>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">Owner</span><p>{execution.owner}</p></div>
            <div><span className="text-muted-foreground text-xs">Ramp</span><p>{execution.ramp}</p></div>
            <div><span className="text-muted-foreground text-xs">Hold</span><p>{execution.hold}</p></div>
            <div><span className="text-muted-foreground text-xs">URL</span><p className="break-all">{execution.url}</p></div>
          </div>

          {isLoading && <Skeleton className="h-32 w-full" />}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}

          {detail?.result && (
            <>
              {/* Checks */}
              {detail.result.root_group?.checks && Object.keys(detail.result.root_group.checks).length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Checks</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(detail.result.root_group.checks).map((check) => (
                      <Badge key={check.name} variant={check.fails === 0 ? "default" : "destructive"}>
                        {check.name}: {check.passes}✓ {check.fails}✗
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div>
                <p className="text-sm font-semibold mb-2">Metrics</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(detail.result.metrics)
                    .filter(([name]) => !name.includes("{"))
                    .map(([name, values]) => (
                      <MetricCard key={name} name={name} values={values} />
                    ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as {
    test_name: string;
    dashboard: string;
    url: string;
    owner: string;
    rps: string;
    ramp: string;
    hold: string;
  } | null;

  const [isRunning, setIsRunning] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["testDetail", id],
    queryFn: () => fetchTestDetail(id!),
    enabled: !!id && !stateData,
  });

  const { data: executions, isLoading: execLoading, error: execError } = useQuery({
    queryKey: ["executions", id],
    queryFn: () => fetchExecutions(id!),
    enabled: !!id,
  });

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/backend/runtest/" + id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...(stateData || {}) }),
      });
      if (!res.ok) throw new Error(`Run failed: ${res.status}`);
      toast.success("Test started successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to run test");
    }
    setIsRunning(false);
  };

  const testName = stateData?.test_name || data?.test_name || "Test Detail";

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-info text-info-foreground">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-info-foreground hover:bg-info-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{isLoading ? "Loading…" : testName}</h1>
              <p className="text-sm opacity-80 mt-0.5">Test ID: {id}</p>
            </div>
          </div>
          <Button
            onClick={handleRunTest}
            disabled={isRunning}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <Play className="h-4 w-4 mr-1" />
            {isRunning ? "Running..." : "Run Test"}
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 space-y-6">
        {isLoading && !stateData && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}

        {error && !stateData && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{(error as Error).message || "Could not load test details."}</AlertDescription>
          </Alert>
        )}

        {(stateData || data) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Test Name</p>
                <p className="text-sm font-medium mt-1">{stateData?.test_name || data?.test_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">URL</p>
                <p className="text-sm font-medium mt-1">{stateData?.url || data?.url}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium mt-1 break-all">{stateData?.owner || data?.owner}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RPS</p>
                <p className="text-sm font-medium mt-1">{stateData?.rps || data?.rps}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RAMP</p>
                <p className="text-sm font-medium mt-1">{stateData?.ramp || data?.ramp}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">HOLD</p>
                <p className="text-sm font-medium mt-1">{stateData?.hold || data?.hold}</p>
              </div>
              <div>
                <a href={stateData?.dashboard || data?.dashboard} target="_blank" rel="noopener noreferrer">
                  <p className="text-sm font-medium mt-1">Grafana dashboard LINK</p>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Executions Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Executions</h2>

          {execLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          )}

          {execError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{(execError as Error).message}</AlertDescription>
            </Alert>
          )}

          {executions && executions.length === 0 && (
            <p className="text-sm text-muted-foreground">No executions found.</p>
          )}

          {executions?.map((exec) => (
            <ExecutionBox key={exec.id} execution={exec} />
          ))}
        </div>
      </section>
    </main>
  );
}
