import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NewPfrtTest() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Test name is required");
      return;
    }
    toast.success("Performance test created successfully!");
    navigate("/");
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
                  id="name"
                  placeholder="e.g. Homepage Load Test"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="environment" className="font-semibold">Environment</Label>
                <Input
                  id="environment"
                  placeholder="e.g. staging, production"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="focus-visible:ring-info"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">Description</Label>
                <textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the performance test..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="bg-success hover:bg-success/90 text-success-foreground">
                  Create Test
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
