"use client";

import { cn } from "@/lib/utils";
import type { ModuleType } from "@/lib/types";
import {
  LayoutDashboard,
  Cpu,
  Shield,
  Layers,
  HardDrive,
  FolderOpen,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  id: ModuleType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview",
  },
  {
    id: "cpu-scheduling",
    label: "CPU Scheduling",
    icon: Cpu,
    description: "FCFS, SJF, RR",
  },
  {
    id: "bankers-algorithm",
    label: "Banker's Algorithm",
    icon: Shield,
    description: "Deadlock Avoidance",
  },
  {
    id: "page-replacement",
    label: "Page Replacement",
    icon: Layers,
    description: "FIFO, LRU",
  },
  {
    id: "disk-scheduling",
    label: "Disk Scheduling",
    icon: HardDrive,
    description: "FCFS, SSTF",
  },
  {
    id: "file-allocation",
    label: "File Allocation",
    icon: FolderOpen,
    description: "Contiguous",
  },
];

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              OS Simulator
            </h1>
            <p className="text-xs text-muted-foreground">v1.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onModuleChange(item.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.label}</p>
                      <p
                        className={cn(
                          "truncate text-xs",
                          isActive
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border px-6 py-4">
          <p className="text-xs text-muted-foreground">
            All-in-One OS Simulator
          </p>
        </div>
      </aside>
    </>
  );
}
