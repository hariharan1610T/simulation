"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Shield, Layers, HardDrive, FolderOpen, Zap } from "lucide-react";
import type { ModuleType } from "@/lib/types";

interface DashboardProps {
  onModuleChange: (module: ModuleType) => void;
}

const modules = [
  {
    id: "cpu-scheduling" as ModuleType,
    title: "CPU Scheduling",
    description:
      "Simulate FCFS, SJF, and Round Robin scheduling algorithms with animated Gantt charts.",
    icon: Cpu,
    color: "bg-primary/10 text-primary",
    features: ["FCFS", "SJF", "Round Robin"],
  },
  {
    id: "bankers-algorithm" as ModuleType,
    title: "Banker's Algorithm",
    description:
      "Detect safe sequences and prevent deadlocks in resource allocation.",
    icon: Shield,
    color: "bg-success/10 text-success",
    features: ["Safe Sequence", "Need Matrix", "Deadlock Detection"],
  },
  {
    id: "page-replacement" as ModuleType,
    title: "Page Replacement",
    description:
      "Visualize FIFO and LRU page replacement algorithms with frame tables.",
    icon: Layers,
    color: "bg-warning/10 text-warning",
    features: ["FIFO", "LRU", "Page Faults"],
  },
  {
    id: "disk-scheduling" as ModuleType,
    title: "Disk Scheduling",
    description:
      "Calculate head movements for FCFS and SSTF disk scheduling algorithms.",
    icon: HardDrive,
    color: "bg-destructive/10 text-destructive",
    features: ["FCFS", "SSTF", "Head Movement"],
  },
  {
    id: "file-allocation" as ModuleType,
    title: "File Allocation",
    description:
      "Manage files using contiguous allocation with visual block representation.",
    icon: FolderOpen,
    color: "bg-primary/10 text-primary",
    features: ["Create", "Delete", "Block View"],
  },
];

export function Dashboard({ onModuleChange }: DashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Operating System Simulator
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          An interactive learning tool for understanding core operating system
          concepts. Select a module below to start exploring.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">
                Simulation Modules
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Cpu className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">10+</p>
              <p className="text-sm text-muted-foreground">Algorithms</p>
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Layers className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">Real-time</p>
              <p className="text-sm text-muted-foreground">Visualizations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Available Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.id}
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                onClick={() => onModuleChange(module.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${module.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-lg">{module.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {module.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {module.features.map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
