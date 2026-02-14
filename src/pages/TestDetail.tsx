import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTestDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Clock, Play } from "lucide-react";
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

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state as {
    name: string;
    environment: string;
    url: string;
    auth: string;
    testScript: string;
    owner: string;
  } | null;

  const [isRunning, setIsRunning] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["testDetail", id],
    queryFn: () => fetchTestDetail(id!),
    enabled: !!id && !stateData,
  });

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("/backend/run/test", {
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

  const testName = stateData?.name || data?.name || "Test Detail";

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

        {/* Show state data from creation or fetched data */}
        {(stateData || data) && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Test Name</p>
                  <p className="text-sm font-medium mt-1">{stateData?.name || data?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Environment</p>
                  <p className="text-sm font-medium mt-1">{stateData?.environment || data?.environment || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">URL</p>
                  <p className="text-sm font-medium mt-1 break-all">{stateData?.url || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <p className="text-sm font-medium mt-1">{stateData?.owner || "—"}</p>
                </div>
                {stateData?.auth && (
                  <div>
                    <p className="text-xs text-muted-foreground">AUTH</p>
                    <p className="text-sm font-medium mt-1">••••••••</p>
                  </div>
                )}
                {data?.status && (
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={statusVariant(data.status)} className="mt-1">
                      {data.status}
                    </Badge>
                  </div>
                )}
                {data?.duration !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-sm font-medium flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {data.duration}ms
                    </p>
                  </div>
                )}
                {data?.timestamp && (
                  <div>
                    <p className="text-xs text-muted-foreground">Timestamp</p>
                    <p className="text-sm font-medium mt-1">{new Date(data.timestamp).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {stateData?.testScript && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Test Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                    {stateData.testScript}
                  </pre>
                </CardContent>
              </Card>
            )}

            {data?.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{data.description}</p>
                </CardContent>
              </Card>
            )}

            {data?.metrics && Object.keys(data.metrics).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    {Object.entries(data.metrics).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs text-muted-foreground">{key}</dt>
                        <dd className="text-sm font-medium mt-0.5">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}

            {data?.errors && data.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-destructive">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {data.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>
    </main>
  );
}
