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
import type { DiskSchedulingResult } from "@/lib/types";
import { Play, HardDrive } from "lucide-react";

export function DiskScheduling() {
  const [requests, setRequests] = useState("98,183,37,122,14,124,65,67");
  const [headPosition, setHeadPosition] = useState(53);
  const [algorithm, setAlgorithm] = useState<"FCFS" | "SSTF" | "SCAN" | "CSCAN">(
    "FCFS"
  );
  const [diskSize, setDiskSize] = useState(200);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [result, setResult] = useState<DiskSchedulingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runSimulation = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const requestArray = requests
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));

      const response = await fetch("/api/disk-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: requestArray,
          headPosition,
          algorithm,
          diskSize,
          direction,
        }),
      });

      if (!response.ok) throw new Error("Simulation failed");

      const data: DiskSchedulingResult = await response.json();
      setResult(data);
    } catch {
      console.error("Simulation error");
    } finally {
      setIsLoading(false);
    }
  };

  const requestArray = requests
    .split(",")
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Disk Scheduling</h1>
        <p className="text-muted-foreground">
          Simulate FCFS, SSTF, SCAN, and C-SCAN disk scheduling algorithms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Input Parameters</CardTitle>
            <CardDescription>
              Configure disk requests and initial head position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Disk Requests
              </label>
              <Input
                value={requests}
                onChange={(e) => setRequests(e.target.value)}
                placeholder="e.g., 98,183,37,122,14"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Comma-separated cylinder numbers
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Initial Head Position
              </label>
              <Input
                type="number"
                min={0}
                max={diskSize - 1}
                value={headPosition}
                onChange={(e) => setHeadPosition(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Disk Size</label>
              <Input
                type="number"
                min={1}
                value={diskSize}
                onChange={(e) => setDiskSize(parseInt(e.target.value) || 200)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Algorithm</label>
              <Select
                value={algorithm}
                onChange={(e) =>
                  setAlgorithm(
                    e.target.value as "FCFS" | "SSTF" | "SCAN" | "CSCAN"
                  )
                }
              >
                <option value="FCFS">FCFS</option>
                <option value="SSTF">SSTF</option>
                <option value="SCAN">SCAN (Elevator)</option>
                <option value="CSCAN">C-SCAN</option>
              </Select>
            </div>

            {(algorithm === "SCAN" || algorithm === "CSCAN") && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Initial Direction
                </label>
                <Select
                  value={direction}
                  onChange={(e) =>
                    setDirection(e.target.value as "left" | "right")
                  }
                >
                  <option value="right">Right (Higher)</option>
                  <option value="left">Left (Lower)</option>
                </Select>
              </div>
            )}

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
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Total head movement and seek sequence
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                    <HardDrive className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Head Movement
                    </p>
                    <p className="text-3xl font-bold">
                      {result.totalHeadMovement}{" "}
                      <span className="text-lg font-normal text-muted-foreground">
                        cylinders
                      </span>
                    </p>
                  </div>
                </div>

                {/* Seek Sequence */}
                <div>
                  <h4 className="mb-3 font-medium">Seek Sequence</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {result.seekSequence.map((pos, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                            index === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {pos}
                        </span>
                        {index < result.seekSequence.length - 1 && (
                          <span className="text-muted-foreground">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Movement Breakdown */}
                <div>
                  <h4 className="mb-3 font-medium">Movement Breakdown</h4>
                  <div className="space-y-2">
                    {result.seekSequence.slice(1).map((pos, index) => {
                      const prev = result.seekSequence[index];
                      const movement = Math.abs(pos - prev);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2"
                        >
                          <span className="text-sm">
                            {prev} → {pos}
                          </span>
                          <span className="font-medium text-primary">
                            {movement} cylinders
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-muted-foreground">
                Run simulation to see results
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualization */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Disk Head Movement Visualization</CardTitle>
            <CardDescription>
              Visual representation of head movement across disk cylinders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Disk track */}
              <div className="relative h-12 rounded-lg bg-muted">
                {/* Track markers */}
                <div className="absolute inset-x-0 top-0 flex justify-between px-2 text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{diskSize - 1}</span>
                </div>

                {/* Request markers */}
                {requestArray.map((req, index) => (
                  <div
                    key={index}
                    className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-secondary-foreground/30"
                    style={{
                      left: `${(req / diskSize) * 100}%`,
                    }}
                    title={`Request: ${req}`}
                  />
                ))}

                {/* Head position (current = end of sequence) */}
                <div
                  className="absolute top-1/2 h-6 w-2 -translate-y-1/2 rounded-full bg-primary shadow-lg transition-all duration-500"
                  style={{
                    left: `${(result.seekSequence[result.seekSequence.length - 1] / diskSize) * 100}%`,
                  }}
                />
              </div>

              {/* Step-by-step visualization */}
              <div className="space-y-1">
                {result.seekSequence.map((pos, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-8 text-right text-xs text-muted-foreground">
                      {index}
                    </span>
                    <div className="relative h-6 flex-1 rounded bg-muted/50">
                      <div
                        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary transition-all"
                        style={{
                          left: `${(pos / diskSize) * 100}%`,
                        }}
                      />
                      {index > 0 && (
                        <div
                          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-primary/40"
                          style={{
                            left: `${Math.min(result.seekSequence[index - 1], pos) / diskSize * 100}%`,
                            width: `${Math.abs(result.seekSequence[index - 1] - pos) / diskSize * 100}%`,
                          }}
                        />
                      )}
                    </div>
                    <span className="w-12 text-xs font-medium">{pos}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
