import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchTestResults, type TestResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, ArrowRight, Plus } from "lucide-react";

const statusVariant = (status: TestResult["status"]) => {
  switch (status) {
    case "passed": return "default" as const;
    case "failed": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export default function TestList() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["testResults"],
    queryFn: fetchTestResults,
  });

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-info text-info-foreground">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance Tests</h1>
            <p className="text-sm opacity-80 mt-1">
              Results fetched from perftest.test.com
            </p>
          </div>
          <Button
            onClick={() => navigate("/newpfrttest")}
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Test
          </Button>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 space-y-3">
        {isLoading && (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {(error as Error).message || "Could not load test results."}
            </AlertDescription>
          </Alert>
        )}

        {data?.map((test) => (
          <Card
            key={test.id}
            className="cursor-pointer transition-colors hover:bg-muted/40"
            onClick={() => navigate(`/test/${test.id}`)}
          >
            <CardContent className="flex items-center justify-between py-4 px-6">
              <div className="space-y-1">
                <p className="font-medium leading-none">{test.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {test.duration}ms
                  </span>
                  <span>{new Date(test.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(test.status)}>{test.status}</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}

        {data && data.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No test results found.</p>
        )}
      </section>
    </main>
  );
}
