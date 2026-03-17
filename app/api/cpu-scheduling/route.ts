import { NextResponse } from "next/server";
import type { Process, SchedulingResult, GanttBlock, ProcessResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { processes, algorithm, timeQuantum } = await request.json();

    let result: SchedulingResult;

    switch (algorithm) {
      case "FCFS":
        result = fcfs(processes);
        break;
      case "SJF":
        result = sjf(processes);
        break;
      case "RR":
        result = roundRobin(processes, timeQuantum);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid algorithm" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Simulation failed" },
      { status: 500 }
    );
  }
}

function fcfs(processes: Process[]): SchedulingResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const ganttChart: GanttBlock[] = [];
  const processResults: ProcessResult[] = [];

  let currentTime = 0;

  for (const process of sorted) {
    if (currentTime < process.arrivalTime) {
      currentTime = process.arrivalTime;
    }

    const startTime = currentTime;
    const endTime = currentTime + process.burstTime;

    ganttChart.push({
      processId: process.id,
      startTime,
      endTime,
    });

    const completionTime = endTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;

    processResults.push({
      id: process.id,
      arrivalTime: process.arrivalTime,
      burstTime: process.burstTime,
      completionTime,
      waitingTime,
      turnaroundTime,
    });

    currentTime = endTime;
  }

  const avgWT = processResults.reduce((sum, p) => sum + p.waitingTime, 0) / processResults.length;
  const avgTAT = processResults.reduce((sum, p) => sum + p.turnaroundTime, 0) / processResults.length;

  return {
    ganttChart,
    processes: processResults,
    averageWaitingTime: avgWT,
    averageTurnaroundTime: avgTAT,
  };
}

function sjf(processes: Process[]): SchedulingResult {
  const remaining = [...processes].map((p) => ({ ...p }));
  const ganttChart: GanttBlock[] = [];
  const completed: ProcessResult[] = [];

  let currentTime = 0;

  while (remaining.length > 0) {
    const available = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (available.length === 0) {
      currentTime = Math.min(...remaining.map((p) => p.arrivalTime));
      continue;
    }

    available.sort((a, b) => a.burstTime - b.burstTime);
    const process = available[0];

    const startTime = currentTime;
    const endTime = currentTime + process.burstTime;

    ganttChart.push({
      processId: process.id,
      startTime,
      endTime,
    });

    const completionTime = endTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;

    completed.push({
      id: process.id,
      arrivalTime: process.arrivalTime,
      burstTime: process.burstTime,
      completionTime,
      waitingTime,
      turnaroundTime,
    });

    currentTime = endTime;
    const idx = remaining.findIndex((p) => p.id === process.id);
    remaining.splice(idx, 1);
  }

  const avgWT = completed.reduce((sum, p) => sum + p.waitingTime, 0) / completed.length;
  const avgTAT = completed.reduce((sum, p) => sum + p.turnaroundTime, 0) / completed.length;

  return {
    ganttChart,
    processes: completed,
    averageWaitingTime: avgWT,
    averageTurnaroundTime: avgTAT,
  };
}

function roundRobin(processes: Process[], quantum: number): SchedulingResult {
  const queue: { process: Process; remainingTime: number }[] = [];
  const remaining = [...processes]
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .map((p) => ({ process: p, remainingTime: p.burstTime }));

  const ganttChart: GanttBlock[] = [];
  const completionTimes: Map<string, number> = new Map();

  let currentTime = 0;
  let idx = 0;

  // Add first process
  while (idx < remaining.length && remaining[idx].process.arrivalTime <= currentTime) {
    queue.push(remaining[idx]);
    idx++;
  }

  if (queue.length === 0 && idx < remaining.length) {
    currentTime = remaining[idx].process.arrivalTime;
    queue.push(remaining[idx]);
    idx++;
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const executeTime = Math.min(quantum, current.remainingTime);
    const startTime = currentTime;
    const endTime = currentTime + executeTime;

    ganttChart.push({
      processId: current.process.id,
      startTime,
      endTime,
    });

    currentTime = endTime;
    current.remainingTime -= executeTime;

    // Add newly arrived processes
    while (idx < remaining.length && remaining[idx].process.arrivalTime <= currentTime) {
      queue.push(remaining[idx]);
      idx++;
    }

    if (current.remainingTime > 0) {
      queue.push(current);
    } else {
      completionTimes.set(current.process.id, currentTime);
    }

    // If queue is empty but processes remain
    if (queue.length === 0 && idx < remaining.length) {
      currentTime = remaining[idx].process.arrivalTime;
      queue.push(remaining[idx]);
      idx++;
    }
  }

  const processResults: ProcessResult[] = processes.map((p) => {
    const ct = completionTimes.get(p.id) || 0;
    const tat = ct - p.arrivalTime;
    const wt = tat - p.burstTime;
    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      completionTime: ct,
      waitingTime: wt,
      turnaroundTime: tat,
    };
  });

  const avgWT = processResults.reduce((sum, p) => sum + p.waitingTime, 0) / processResults.length;
  const avgTAT = processResults.reduce((sum, p) => sum + p.turnaroundTime, 0) / processResults.length;

  return {
    ganttChart,
    processes: processResults,
    averageWaitingTime: avgWT,
    averageTurnaroundTime: avgTAT,
  };
}
