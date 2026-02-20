import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
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
        body: JSON.stringify({ test_name, url, testScript, owner, rps, ramp, hold }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const result = await res.json().catch(() => null);
      toast.success("Performance test created successfully!");
      const testData = { test_name, url, testScript, owner, rps, ramp, hold };
      const testId = result?.id || encodeURIComponent(test_name);
      setIsSubmitting(false);
      navigate(`/test/${testId}`, { state: testData });
      return;
    } catch (err: any) {
      toast.error(err.message || "Failed to create test");
      setIsSubmitting(false);
      return;
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
                <Input
                  id="ramp"
                  placeholder="time to warm up the app e.g. 3m "
                  value={ramp}
                  onChange={(e) => setRamp(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hold" className="font-semibold">
                  hold <span className="text-danger">*</span>
                </Label>
                <Input
                  id="hold"
                  placeholder="Time to run the performance test e.g. 10m"
                  value={hold}
                  onChange={(e) => setHold(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2"
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
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
