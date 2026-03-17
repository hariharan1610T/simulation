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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BankerResult } from "@/lib/types";
import { Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export function BankersAlgorithm() {
  const [numProcesses, setNumProcesses] = useState(5);
  const [numResources, setNumResources] = useState(3);
  const [allocation, setAllocation] = useState<number[][]>([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ]);
  const [max, setMax] = useState<number[][]>([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ]);
  const [available, setAvailable] = useState<number[]>([3, 3, 2]);
  const [result, setResult] = useState<BankerResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMatrix = (
    matrix: number[][],
    setMatrix: (m: number[][]) => void,
    row: number,
    col: number,
    value: string
  ) => {
    const newMatrix = matrix.map((r) => [...r]);
    newMatrix[row][col] = parseInt(value) || 0;
    setMatrix(newMatrix);
  };

  const resetMatrices = () => {
    const newAllocation = Array(numProcesses)
      .fill(null)
      .map(() => Array(numResources).fill(0));
    const newMax = Array(numProcesses)
      .fill(null)
      .map(() => Array(numResources).fill(0));
    const newAvailable = Array(numResources).fill(0);

    setAllocation(newAllocation);
    setMax(newMax);
    setAvailable(newAvailable);
    setResult(null);
  };

  const runSimulation = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/bankers.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processes: numProcesses,
          resources: numResources,
          allocation,
          max,
          available,
        }),
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Simulation failed");
      }

      const data: BankerResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {"Banker's Algorithm"}
        </h1>
        <p className="text-muted-foreground">
          Deadlock avoidance algorithm to determine safe sequences
        </p>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Set the number of processes and resources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Processes
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numProcesses}
                onChange={(e) => setNumProcesses(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Resources
              </label>
              <Input
                type="number"
                min={1}
                max={10}
                value={numResources}
                onChange={(e) => setNumResources(parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetMatrices}>
                <RefreshCw className="h-4 w-4" />
                Reset Matrices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Allocation Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Allocation Matrix</CardTitle>
            <CardDescription>Currently allocated resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    {Array(numResources)
                      .fill(null)
                      .map((_, i) => (
                        <TableHead key={i}>R{i}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(numProcesses)
                    .fill(null)
                    .map((_, row) => (
                      <TableRow key={row}>
                        <TableCell className="font-medium">P{row}</TableCell>
                        {Array(numResources)
                          .fill(null)
                          .map((_, col) => (
                            <TableCell key={col}>
                              <Input
                                type="number"
                                min={0}
                                value={allocation[row]?.[col] ?? 0}
                                onChange={(e) =>
                                  updateMatrix(
                                    allocation,
                                    setAllocation,
                                    row,
                                    col,
                                    e.target.value
                                  )
                                }
                                className="w-16"
                              />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Max Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Maximum Matrix</CardTitle>
            <CardDescription>Maximum required resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    {Array(numResources)
                      .fill(null)
                      .map((_, i) => (
                        <TableHead key={i}>R{i}</TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(numProcesses)
                    .fill(null)
                    .map((_, row) => (
                      <TableRow key={row}>
                        <TableCell className="font-medium">P{row}</TableCell>
                        {Array(numResources)
                          .fill(null)
                          .map((_, col) => (
                            <TableCell key={col}>
                              <Input
                                type="number"
                                min={0}
                                value={max[row]?.[col] ?? 0}
                                onChange={(e) =>
                                  updateMatrix(
                                    max,
                                    setMax,
                                    row,
                                    col,
                                    e.target.value
                                  )
                                }
                                className="w-16"
                              />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Available Resources</CardTitle>
          <CardDescription>Currently available system resources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Array(numResources)
              .fill(null)
              .map((_, i) => (
                <div key={i}>
                  <label className="mb-2 block text-sm font-medium">R{i}</label>
                  <Input
                    type="number"
                    min={0}
                    value={available[i] ?? 0}
                    onChange={(e) => {
                      const newAvailable = [...available];
                      newAvailable[i] = parseInt(e.target.value) || 0;
                      setAvailable(newAvailable);
                    }}
                    className="w-20"
                  />
                </div>
              ))}
          </div>
          <div className="mt-4">
            <Button onClick={runSimulation} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  Calculating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Check Safe State
                </>
              )}
            </Button>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.safe ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  Safe State
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Unsafe State (Deadlock Possible)
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.safe && (
              <div>
                <h4 className="mb-3 font-medium">Safe Sequence</h4>
                <div className="flex flex-wrap items-center gap-2">
                  {result.safeSequence.map((p, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        P{p}
                      </span>
                      {index < result.safeSequence.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Need Matrix */}
            <div>
              <h4 className="mb-3 font-medium">Need Matrix (Max - Allocation)</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Process</TableHead>
                      {Array(numResources)
                        .fill(null)
                        .map((_, i) => (
                          <TableHead key={i}>R{i}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.need.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">P{i}</TableCell>
                        {row.map((val, j) => (
                          <TableCell key={j}>{val}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
