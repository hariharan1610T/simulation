"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dashboard } from "@/components/modules/dashboard";
import { CPUScheduling } from "@/components/modules/cpu-scheduling";
import { BankersAlgorithm } from "@/components/modules/bankers-algorithm";
import { PageReplacement } from "@/components/modules/page-replacement";
import { DiskScheduling } from "@/components/modules/disk-scheduling";
import { FileAllocation } from "@/components/modules/file-allocation";
import type { ModuleType } from "@/lib/types";

export default function Home() {
  const [activeModule, setActiveModule] = useState<ModuleType>("dashboard");

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard onModuleChange={setActiveModule} />;
      case "cpu-scheduling":
        return <CPUScheduling />;
      case "bankers-algorithm":
        return <BankersAlgorithm />;
      case "page-replacement":
        return <PageReplacement />;
      case "disk-scheduling":
        return <DiskScheduling />;
      case "file-allocation":
        return <FileAllocation />;
      default:
        return <Dashboard onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      {/* Main content */}
      <main className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
          <ThemeToggle />
        </header>

        {/* Content */}
        <div className="p-4 pt-6 lg:p-8">{renderModule()}</div>
      </main>
    </div>
  );
}
