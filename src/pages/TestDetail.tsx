import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchTestDetail, fetchExecutions, fetchExecutionDetail, fetchPodLogs, updateTest, deleteTest, deleteExecution, type Execution, type ExecutionDetail } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ArrowLeft, Play, ChevronDown, ChevronUp, Pencil, Save, X, Trash2, Upload, FileText } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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

function ExecutionBox({ execution, testId, onDeleted }: { execution: Execution; testId: string; onDeleted: () => void }) {
  const [isDeleteExec, setIsDeleteExec] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["executionDetail", execution.job],
    queryFn: () => fetchExecutionDetail(execution.job),
    enabled: expanded,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message.includes("404")) return false;
      return failureCount < 3;
    },
  });

  const is404 = error instanceof Error && error.message.includes("404");

  const handleFetchLogs = async () => {
    if (showLogs && logs !== null) {
      setShowLogs(false);
      return;
    }
    setLogsLoading(true);
    setLogsError(null);
    try {
      const text = await fetchPodLogs(execution.job);
      setLogs(text);
      setShowLogs(true);
    } catch (err: any) {
      setLogsError(err.message || "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

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
           <Button
             variant="destructive"
             size="icon"
             className="h-7 w-7"
             disabled={isDeleteExec}
             onClick={async (e) => {
               e.stopPropagation();
               setIsDeleteExec(true);
               try {
                 await deleteExecution(execution.id);
                 toast.success("Execution deleted");
                 onDeleted();
               } catch (err: any) {
                 toast.error(err.message || "Failed to delete execution");
               }
               setIsDeleteExec(false);
             }}
           >
             <Trash2 className="h-3.5 w-3.5" />
           </Button>
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
          {is404 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative flex items-center justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Test is running…</p>
              <Progress value={undefined} className="w-48 h-2 animate-pulse" />
            </div>
          )}
          {error && !is404 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}

          {detail?.result && (
            <>
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

          {/* Logs Section */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleFetchLogs(); }}
              disabled={logsLoading}
            >
              <FileText className="h-4 w-4 mr-1" />
              {logsLoading ? "Loading logs..." : showLogs ? "Hide Logs" : "View Logs"}
            </Button>
            {logsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{logsError}</AlertDescription>
              </Alert>
            )}
            {showLogs && logs !== null && (
              <pre className="bg-muted text-muted-foreground text-xs p-4 rounded-md overflow-auto max-h-96 whitespace-pre-wrap break-all">
                {logs}
              </pre>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function FileUploadSection({ testId }: { testId: string }) {
  const k6InputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const [k6File, setK6File] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [isUploadingK6, setIsUploadingK6] = useState(false);
  const [isUploadingData, setIsUploadingData] = useState(false);

  const uploadFile = async (type: "k6" | "data", file: File) => {
    const setUploading = type === "k6" ? setIsUploadingK6 : setIsUploadingData;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`http://k6.verisk.com/backend/test/${testId}/upload/${type}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      toast.success(`${type === "k6" ? "k6.js" : "data.csv"} uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${type === "k6" ? "k6.js" : "data.csv"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadK6 = () => {
    if (k6File) uploadFile("k6", k6File);
  };
  const handleUploadData = () => {
    if (dataFile) uploadFile("data", dataFile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">File Uploads</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">k6.js Script</p>
          <input ref={k6InputRef} type="file" accept=".js" className="hidden" onChange={(e) => setK6File(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => k6InputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              {k6File ? k6File.name : "Choose k6.js"}
            </Button>
            {k6File && (
              <Button size="sm" onClick={handleUploadK6} disabled={isUploadingK6}>
                {isUploadingK6 ? "Uploading..." : "Upload"}
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs text-muted-foreground font-semibold">data.csv</p>
          <input ref={dataInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => setDataFile(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => dataInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              {dataFile ? dataFile.name : "Choose data.csv"}
            </Button>
            {dataFile && (
              <Button size="sm" onClick={handleUploadData} disabled={isUploadingData}>
                {isUploadingData ? "Uploading..." : "Upload"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    test_name: "",
    url: "",
    owner: "",
    rps: "",
    ramp: "",
    hold: "",
    dashboard: "",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["testDetail", id],
    queryFn: () => fetchTestDetail(id!),
    enabled: !!id && !stateData,
  });

  const currentData = stateData || data;

  useEffect(() => {
    if (currentData) {
      setEditValues({
        test_name: String(currentData.test_name || ""),
        url: String(currentData.url || ""),
        owner: String(currentData.owner || ""),
        rps: String(currentData.rps || ""),
        ramp: String(currentData.ramp || ""),
        hold: String(currentData.hold || ""),
        dashboard: String(currentData.dashboard || ""),
      });
    }
  }, [currentData]);

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      // Only send changed fields
      const changes: Record<string, string> = {};
      const original = currentData;
      if (original) {
        for (const key of Object.keys(editValues) as (keyof typeof editValues)[]) {
          if (editValues[key] !== String(original[key] || "")) {
            changes[key] = editValues[key];
          }
        }
      }
      if (Object.keys(changes).length === 0) {
        toast.info("No changes to save");
        setIsEditing(false);
        setIsSaving(false);
        return;
      }
      await updateTest(id, changes);
      toast.success("Test updated successfully!");
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update test");
    }
    setIsSaving(false);
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteTest(id);
      toast.success("Test deleted successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete test");
    }
    setIsDeleting(false);
  };

  const { data: executions, isLoading: execLoading, error: execError, refetch: refetchExecutions } = useQuery({
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
      setTimeout(() => refetchExecutions(), 1000);
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
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => { setShowDeleteDialog(true); setDeleteConfirmName(""); }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button
              onClick={handleRunTest}
              disabled={isRunning}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-4 w-4 mr-1" />
              {isRunning ? "Running..." : "Run Test"}
            </Button>
          </div>
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

        {currentData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Test Configuration</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditValues({ test_name: String(currentData.test_name || ""), url: String(currentData.url || ""), owner: String(currentData.owner || ""), rps: String(currentData.rps || ""), ramp: String(currentData.ramp || ""), hold: String(currentData.hold || ""), dashboard: String(currentData.dashboard || "") }); }} disabled={isSaving}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {([
                { key: "test_name", label: "Test Name" },
                { key: "url", label: "URL" },
                { key: "owner", label: "Owner" },
                { key: "rps", label: "RPS" },
                { key: "ramp", label: "RAMP" },
                { key: "hold", label: "HOLD" },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {isEditing && key !== "test_name" ? (
                    <Input
                      className="mt-1"
                      value={editValues[key]}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1 break-all">{String(currentData[key] || "")}</p>
                  )}
                </div>
              ))}
              <div>
                <a href={String(currentData.dashboard || "")} target="_blank" rel="noopener noreferrer">
                  <p className="text-sm font-medium mt-1">Grafana dashboard LINK</p>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Uploads Section */}
        {currentData && <FileUploadSection testId={id!} />}

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
            <ExecutionBox key={exec.id} execution={exec} testId={id!} onDeleted={() => refetchExecutions()} />
          ))}
        </div>
      </section>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type <span className="font-semibold text-foreground">{testName}</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Type the test name to confirm"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmName !== testName || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
