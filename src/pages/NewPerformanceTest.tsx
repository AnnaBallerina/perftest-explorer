import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function NewPerformanceTest() {
  const navigate = useNavigate();
  const [test_name, setName] = useState("");
  const [rps, setRPS] = useState("");
  const [url, setUrl] = useState("");
  const [ramp, setRamp] = useState("");
  const [testScript, setTestScript] = useState("");
  const [owner, setOwner] = useState("");
  const [hold, setHold] = useState("");
  const [k6File, setK6File] = useState<File | null>(null);
  const [dataFile, setDataFile] = useState<File | null>(null);
  const [isUploadingK6, setIsUploadingK6] = useState(false);
  const [isUploadingData, setIsUploadingData] = useState(false);
  const k6InputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!test_name.trim()) {
      toast.error("Test name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://k6.verisk.com/backend/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_name, url, owner, rps, ramp, hold }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const result = await res.json().catch(() => null);
      toast.success("Performance test created successfully!");
      const testData = { test_name, url, owner, rps, ramp, hold };
      const testId = result?.id || encodeURIComponent(test_name);
      // Upload files if selected
      const uploads: Promise<void>[] = [];
      if (k6File) uploads.push(uploadFile(String(testId), "k6", k6File));
      if (dataFile) uploads.push(uploadFile(String(testId), "data", dataFile));
      if (uploads.length) await Promise.all(uploads);
      setIsSubmitting(false);
      navigate(`/test/${testId}`, { state: testData });
      return;
    } catch (err: any) {
      toast.error(err.message || "Failed to create test");
      setIsSubmitting(false);
      return;
    }
  };

  const uploadFile = async (testId: string, type: "k6" | "data", file: File) => {
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

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-info text-info-foreground">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-info-foreground hover:bg-info-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Performance Test</h1>
            <p className="text-sm opacity-80 mt-1">Create and configure a new test run</p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-info/30 shadow-md">
          <CardHeader className="bg-info/5 rounded-t-lg">
            <CardTitle className="text-lg text-info">Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold">
                  Test Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="test_name"
                  placeholder="e.g. Homepage Load Test"
                  value={test_name}
                  onChange={(e) => setName(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rps" className="font-semibold">
                  RPS <span className="text-danger">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Used as <code className="bg-muted px-1 rounded">TARGET_RPS</code> in k6.js</p>
                <Input
                  id="rps"
                  placeholder="e.g. staging, production"
                  value={rps}
                  onChange={(e) => setRPS(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="font-semibold">
                  URL <span className="text-danger">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Used as <code className="bg-muted px-1 rounded">TARGET_URL</code> in k6.js</p>
                <Input
                  id="url"
                  placeholder="e.g. http://k6.verisk.com/backend/health"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ramp" className="font-semibold">
                  RAMP <span className="text-danger">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Used as <code className="bg-muted px-1 rounded">RAMP_DURATION</code> in k6.js</p>
                <Input
                  id="ramp"
                  placeholder="time to warm up the app e.g. 3m"
                  value={ramp}
                  onChange={(e) => setRamp(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hold" className="font-semibold">
                  HOLD <span className="text-danger">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">Used as <code className="bg-muted px-1 rounded">HOLD_DURATION</code> in k6.js</p>
                <Input
                  id="hold"
                  placeholder="Time to run the performance test e.g. 10m"
                  value={hold}
                  onChange={(e) => setHold(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner" className="font-semibold">
                  Owner <span className="text-danger">*</span>
                </Label>
                <Input
                  id="owner"
                  placeholder="e.g. john.doe@company.com"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>


              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  {isSubmitting ? "Creating..." : "Create Test"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
              </div>

              <div className="border-t pt-5 mt-2 space-y-4">
                <p className="text-sm font-semibold text-muted-foreground">File Uploads</p>
                <p className="text-xs text-muted-foreground">Upload files after creating the test. The test ID will be used in the upload path.</p>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="font-semibold">k6.js Script</Label>
                    <input
                      ref={k6InputRef}
                      type="file"
                      accept=".js"
                      className="hidden"
                      onChange={(e) => setK6File(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => k6InputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {k6File ? k6File.name : "Choose k6.js"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="font-semibold">data.csv</Label>
                    <input
                      ref={dataInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setDataFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => dataInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {dataFile ? dataFile.name : "Choose data.csv"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
