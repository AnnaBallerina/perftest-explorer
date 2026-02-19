import { HtmlHTMLAttributes } from "react";

export interface TestResult {
  id: number;
  test_name: string;
  url: string;
  owner: number;
  rps: string;
  ramp: string;
  hold: string;
  dashboard: string;
  [key: string]: unknown;
}

export interface TestDetail extends TestResult {
  metrics: Record<string, unknown>;
  description?: string;
  environment?: string;
  errors?: string[];
}

const BASE_URL = "http://k6.verisk.com";

export async function fetchTestResults(): Promise<TestResult[]> {
  const res = await fetch(`${BASE_URL}/backend/list`);
  if (!res.ok) throw new Error(`Failed to fetch test results: ${res.status}`);
  return res.json();
}

export async function fetchTestDetail(id: string): Promise<TestDetail> {
  const res = await fetch(`${BASE_URL}/backend/test/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch test detail: ${res.status}`);
  return res.json();
}
