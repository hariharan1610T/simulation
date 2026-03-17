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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Process,
  SchedulingResult,
  GanttBlock,
  ProcessResult,
} from "@/lib/types";
import { Plus, Trash2, Play } from "lucide-react";

const GANTT_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-[oklch(0.6_0.2_300)]",
  "bg-[oklch(0.6_0.2_180)]",
];

export function CPUScheduling() {
  const [processes, setProcesses] = useState<Process[]>([
    { id: "P1", arrivalTime: 0, burstTime: 5 },
    { id: "P2", arrivalTime: 1, burstTime: 3 },
    { id: "P3", arrivalTime: 2, burstTime: 8 },
  ]);
  const [algorithm, setAlgorithm] = useState<"FCFS" | "SJF" | "RR">("FCFS");
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [result, setResult] = useState<SchedulingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [animatedBlocks, setAnimatedBlocks] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const addProcess = () => {
    const newId = `P${processes.length + 1}`;
    setProcesses([...processes, { id: newId, arrivalTime: 0, burstTime: 1 }]);
  };

  const removeProcess = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  const updateProcess = (
    index: number,
    field: keyof Process,
    value: string
  ) => {
    const updated = [...processes];
    if (field === "id") {
      updated[index].id = value;
    } else {
      updated[index][field] = parseInt(value) || 0;
    }
    setProcesses(updated);
  };

  const runSimulation = async () => {
    setIsLoading(true);
    setResult(null);
    setAnimatedBlocks(0);
    setError(null);

    try {
      const response = await fetch("/api/cpu-scheduling.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processes, algorithm, timeQuantum }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Simulation failed");
      }

      const data: SchedulingResult = await response.json();
      setResult(data);

      // Animate Gantt chart blocks
      for (let i = 0; i <= data.ganttChart.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAnimatedBlocks(i);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getProcessColor = (processId: string) => {
    const index = processes.findIndex((p) => p.id === processId);
    return GANTT_COLORS[index % GANTT_COLORS.length];
  };

  const totalTime = result?.ganttChart.length
    ? Math.max(...result.ganttChart.map((b) => b.endTime))
    : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CPU Scheduling</h1>
        <p className="text-muted-foreground">
          Simulate FCFS, SJF, and Round Robin scheduling algorithms
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle>Process Input</CardTitle>
            <CardDescription>
              Add processes with arrival and burst times
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorithm Selection */}
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[150px] flex-1">
                <label className="mb-2 block text-sm font-medium">
                  Algorithm
                </label>
                <Select
                  value={algorithm}
                  onChange={(e) =>
                    setAlgorithm(e.target.value as "FCFS" | "SJF" | "RR")
                  }
                >
                  <option value="FCFS">FCFS</option>
                  <option value="SJF">SJF (Non-preemptive)</option>
                  <option value="RR">Round Robin</option>
                </Select>
              </div>
              {algorithm === "RR" && (
                <div className="w-32">
                  <label className="mb-2 block text-sm font-medium">
                    Time Quantum
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={timeQuantum}
                    onChange={(e) => setTimeQuantum(parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>

            {/* Process Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process ID</TableHead>
                    <TableHead>Arrival Time</TableHead>
                    <TableHead>Burst Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.map((process, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={process.id}
                          onChange={(e) =>
                            updateProcess(index, "id", e.target.value)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={process.arrivalTime}
                          onChange={(e) =>
                            updateProcess(index, "arrivalTime", e.target.value)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={process.burstTime}
                          onChange={(e) =>
                            updateProcess(index, "burstTime", e.target.value)
                          }
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProcess(index)}
                          disabled={processes.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={addProcess}>
                <Plus className="h-4 w-4" />
                Add Process
              </Button>
              <Button onClick={runSimulation} disabled={isLoading}>
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
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Scheduling results and process statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">
                      Avg Waiting Time
                    </p>
                    <p className="text-2xl font-bold">
                      {result.averageWaitingTime.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-4">
                    <p className="text-sm text-muted-foreground">
                      Avg Turnaround Time
                    </p>
                    <p className="text-2xl font-bold">
                      {result.averageTurnaroundTime.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Process</TableHead>
                        <TableHead>AT</TableHead>
                        <TableHead>BT</TableHead>
                        <TableHead>CT</TableHead>
                        <TableHead>WT</TableHead>
                        <TableHead>TAT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.processes.map((p: ProcessResult) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.id}</TableCell>
                          <TableCell>{p.arrivalTime}</TableCell>
                          <TableCell>{p.burstTime}</TableCell>
                          <TableCell>{p.completionTime}</TableCell>
                          <TableCell>{p.waitingTime}</TableCell>
                          <TableCell>{p.turnaroundTime}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

      {/* Gantt Chart */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Gantt Chart</CardTitle>
            <CardDescription>
              Visual representation of process execution timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {processes.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded ${getProcessColor(p.id)}`}
                    />
                    <span className="text-sm">{p.id}</span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="overflow-x-auto">
                <div className="min-w-fit">
                  <div className="flex h-14 gap-0.5">
                    {result.ganttChart.map((block: GanttBlock, index) => {
                      const width = `${((block.endTime - block.startTime) / totalTime) * 100}%`;
                      const isAnimated = index < animatedBlocks;

                      return (
                        <div
                          key={index}
                          className={`relative flex items-center justify-center rounded-md text-sm font-medium text-white transition-all duration-500 ${getProcessColor(block.processId)} ${
                            isAnimated
                              ? "scale-100 opacity-100"
                              : "scale-75 opacity-0"
                          }`}
                          style={{ width, minWidth: "40px" }}
                        >
                          {block.processId}
                        </div>
                      );
                    })}
                  </div>

                  {/* Time markers */}
                  <div className="mt-2 flex">
                    {result.ganttChart.map((block: GanttBlock, index) => {
                      const width = `${((block.endTime - block.startTime) / totalTime) * 100}%`;
                      return (
                        <div
                          key={index}
                          className="text-center text-xs text-muted-foreground"
                          style={{ width, minWidth: "40px" }}
                        >
                          <span className="block text-left">
                            {block.startTime}
                          </span>
                        </div>
                      );
                    })}
                    <span className="text-xs text-muted-foreground">
                      {totalTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
