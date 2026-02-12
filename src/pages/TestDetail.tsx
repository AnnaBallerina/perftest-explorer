import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTestDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Clock } from "lucide-react";

const statusVariant = (status: string) => {
  switch (status) {
    case "passed": return "default" as const;
    case "failed": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export default function TestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["testDetail", id],
    queryFn: () => fetchTestDetail(id!),
    enabled: !!id,
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isLoading ? "Loading…" : data?.name ?? "Test Detail"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              perftest.test.com/perftest
            </p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error).message || "Could not load test details."}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusVariant(data.status)} className="mt-1">{data.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {data.duration}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium mt-1">{new Date(data.timestamp).toLocaleString()}</p>
                </div>
                {data.environment && (
                  <div>
                    <p className="text-xs text-muted-foreground">Environment</p>
                    <p className="text-sm font-medium mt-1">{data.environment}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {data.description && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
                <CardContent><p className="text-sm">{data.description}</p></CardContent>
              </Card>
            )}

            {data.metrics && Object.keys(data.metrics).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Metrics</CardTitle></CardHeader>
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

            {data.errors && data.errors.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg text-destructive">Errors</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    {data.errors.map((err, i) => <li key={i}>{err}</li>)}
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
