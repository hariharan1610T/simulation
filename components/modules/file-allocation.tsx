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
import type { FileAllocationState } from "@/lib/types";
import { Plus, Trash2, File, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

const FILE_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-[oklch(0.6_0.2_300)]",
  "bg-[oklch(0.6_0.2_180)]",
];

export function FileAllocation() {
  const [totalBlocks, setTotalBlocks] = useState(20);
  const [state, setState] = useState<FileAllocationState>({
    files: [],
    diskBlocks: Array(20).fill(null),
    totalBlocks: 20,
  });
  const [newFileName, setNewFileName] = useState("");
  const [newFileSize, setNewFileSize] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const callApi = async (payload: Record<string, unknown>) => {
    const response = await fetch("/api/file-allocation.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Operation failed");
    }
    return data as { state: FileAllocationState };
  };

  const updateTotalBlocks = async (size: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callApi({ action: "initialize", totalBlocks: size });
      setTotalBlocks(size);
      setState(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const createFile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callApi({
        action: "create",
        state,
        fileName: newFileName.trim(),
        fileSize: newFileSize,
      });
      setState(data.state);
      setNewFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await callApi({ action: "delete", state, fileId });
      setState(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileColor = (fileId: string) => {
    const index = state.files.findIndex((f) => f.id === fileId);
    return FILE_COLORS[index % FILE_COLORS.length];
  };

  const usedBlocks = state.diskBlocks.filter((b) => b !== null).length;
  const freeBlocks = state.diskBlocks.length - usedBlocks;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">File Allocation</h1>
        <p className="text-muted-foreground">
          Simulate contiguous file allocation on disk
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Disk Configuration</CardTitle>
            <CardDescription>
              Configure disk size and create files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Total Disk Blocks
              </label>
              <Input
                type="number"
                min={5}
                max={50}
                  value={totalBlocks}
                  onChange={(e) =>
                    void updateTotalBlocks(parseInt(e.target.value) || 20)
                  }
                />
              </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Create New File</h4>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  File Name
                </label>
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g., document.txt"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  File Size (blocks)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={totalBlocks}
                  value={newFileSize}
                  onChange={(e) => setNewFileSize(parseInt(e.target.value) || 1)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button onClick={createFile} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create File
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Disk Statistics</CardTitle>
            <CardDescription>Overview of disk usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Total Blocks</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{state.diskBlocks.length}</p>
              </div>
              <div className="rounded-lg bg-success/10 p-4">
                <p className="text-sm text-muted-foreground">Free Blocks</p>
                <p className="mt-1 text-2xl font-bold text-success">
                  {freeBlocks}
                </p>
              </div>
              <div className="rounded-lg bg-warning/10 p-4">
                <p className="text-sm text-muted-foreground">Used Blocks</p>
                <p className="mt-1 text-2xl font-bold text-warning">
                  {usedBlocks}
                </p>
              </div>
            </div>

            {/* Usage Bar */}
            <div className="mt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">Disk Usage</span>
                <span className="font-medium">
                  {((usedBlocks / state.diskBlocks.length) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(usedBlocks / state.diskBlocks.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disk Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Disk Block Visualization</CardTitle>
          <CardDescription>
            Visual representation of disk blocks allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1 sm:grid-cols-20">
            {state.diskBlocks.map((block, index) => (
              <div
                key={index}
                className={cn(
                  "flex h-10 w-full items-center justify-center rounded-md text-xs font-medium transition-all duration-200",
                  block
                    ? `${getFileColor(block)} text-white`
                    : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground"
                )}
                title={
                  block
                    ? `Block ${index}: ${state.files.find((f) => f.id === block)?.name}`
                    : `Block ${index}: Free`
                }
              >
                {index}
              </div>
            ))}
          </div>

          {/* Legend */}
          {state.files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4">
              {state.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded ${getFileColor(file.id)}`}
                  />
                  <span className="text-sm">{file.name}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border-2 border-dashed border-muted-foreground/30" />
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Allocation Table */}
      {state.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>File Allocation Table</CardTitle>
            <CardDescription>
              Details of all allocated files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Start Block</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Blocks</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{file.startBlock}</TableCell>
                      <TableCell>{file.length}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {file.blocks.map((block) => (
                            <span
                              key={block}
                              className={`rounded px-2 py-0.5 text-xs text-white ${getFileColor(file.id)}`}
                            >
                              {block}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void deleteFile(file.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
