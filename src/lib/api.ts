export interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "running" | "pending";
  duration: number;
  timestamp: string;
  [key: string]: unknown;
}

export interface TestDetail extends TestResult {
  metrics: Record<string, unknown>;
  description?: string;
  environment?: string;
  errors?: string[];
}

const BASE_URL = "https://perftest.test.com";

export async function fetchTestResults(): Promise<TestResult[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error(`Failed to fetch test results: ${res.status}`);
  return res.json();
}

export async function fetchTestDetail(id: string): Promise<TestDetail> {
  const res = await fetch(`${BASE_URL}/perftest?id=${id}`);
  if (!res.ok) throw new Error(`Failed to fetch test detail: ${res.status}`);
  return res.json();
}
