"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { PageReplacementResult } from "@/lib/types";
import { Play, XCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageReplacement() {
  const [frames, setFrames] = useState(3);
  const [pageString, setPageString] = useState("7,0,1,2,0,3,0,4,2,3,0,3,2");
  const [algorithm, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");
  const [result, setResult] = useState<PageReplacementResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const pages = pageString
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));

      const response = await fetch("/api/page-replacement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          pageString: pages,
          algorithm,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Simulation failed");
      }

      const data: PageReplacementResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const pages = pageString
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Page Replacement</h1>
        <p className="text-muted-foreground">
          Simulate FIFO and LRU page replacement algorithms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>
              Configure frames and page reference string
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Number of Frames
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={frames}
                onChange={(e) => setFrames(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Page Reference String
              </label>
              <Input
                value={pageString}
                onChange={(e) => setPageString(e.target.value)}
                placeholder="e.g., 7,0,1,2,0,3,0,4"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Comma-separated page numbers
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Algorithm</label>
              <Select
                value={algorithm}
                onChange={(e) =>
                  setAlgorithm(e.target.value as "FIFO" | "LRU")
                }
              >
                <option value="FIFO">FIFO (First In First Out)</option>
                <option value="LRU">LRU (Least Recently Used)</option>
              </Select>
            </div>

            <Button onClick={runSimulation} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Page replacement performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-destructive/10 p-4">
                  <p className="text-sm text-muted-foreground">Page Faults</p>
                  <p className="text-3xl font-bold text-destructive">
                    {result.pageFaults}
                  </p>
                </div>
                <div className="rounded-lg bg-success/10 p-4">
                  <p className="text-sm text-muted-foreground">Page Hits</p>
                  <p className="text-3xl font-bold text-success">
                    {pages.length - result.pageFaults}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Hit Ratio</p>
                  <p className="text-3xl font-bold text-primary">
                    {(result.hitRatio * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Run simulation to see statistics
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Frame Table */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Frame Table</CardTitle>
            <CardDescription>
              Visual representation of page replacement steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-fit">
                {/* Page References Header */}
                <div className="mb-2 flex gap-1">
                  <div className="w-20 shrink-0 px-2 py-1 text-sm font-medium text-muted-foreground">
                    Page Ref
                  </div>
                  {pages.map((page, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex h-10 w-12 items-center justify-center rounded-md text-sm font-medium",
                        result.faultIndices.includes(index)
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-success text-success-foreground"
                      )}
                    >
                      {page}
                    </div>
                  ))}
                </div>

                {/* Frame Rows */}
                {Array(frames)
                  .fill(null)
                  .map((_, frameIndex) => (
                    <div key={frameIndex} className="flex gap-1">
                      <div className="flex w-20 shrink-0 items-center px-2 py-1 text-sm font-medium text-muted-foreground">
                        Frame {frameIndex}
                      </div>
                      {result.frameStates.map((state, stepIndex) => (
                        <div
                          key={stepIndex}
                          className={cn(
                            "flex h-10 w-12 items-center justify-center rounded-md border text-sm transition-all duration-300",
                            state[frameIndex] !== null
                              ? "border-border bg-secondary font-medium"
                              : "border-dashed border-muted-foreground/30"
                          )}
                        >
                          {state[frameIndex] ?? "-"}
                        </div>
                      ))}
                    </div>
                  ))}

                {/* Fault/Hit Indicators */}
                <div className="mt-2 flex gap-1">
                  <div className="w-20 shrink-0 px-2 py-1 text-sm font-medium text-muted-foreground">
                    Status
                  </div>
                  {pages.map((_, index) => (
                    <div
                      key={index}
                      className="flex h-10 w-12 items-center justify-center"
                    >
                      {result.faultIndices.includes(index) ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">Page Fault</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-muted-foreground">Page Hit</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
