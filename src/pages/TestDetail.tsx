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

  const handleRunTest = async () => {
    setIsRunning(true);
    try {
      const res = await fetch("http://k6.verisk.com/backend/runtest/" + id, {
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
          </>
        )}
      </section>
    </main>
  );
}
