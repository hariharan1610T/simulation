// CPU Scheduling Types
export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
}

export interface SchedulingResult {
  ganttChart: GanttBlock[];
  processes: ProcessResult[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
}

export interface GanttBlock {
  processId: string;
  startTime: number;
  endTime: number;
}

export interface ProcessResult {
  id: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

// Banker's Algorithm Types
export interface BankerInput {
  processes: number;
  resources: number;
  allocation: number[][];
  max: number[][];
  available: number[];
}

export interface BankerResult {
  safe: boolean;
  safeSequence: number[];
  need: number[][];
}

// Page Replacement Types
export interface PageReplacementInput {
  frames: number;
  pageString: number[];
  algorithm: "FIFO" | "LRU";
}

export interface PageReplacementResult {
  frameStates: (number | null)[][];
  pageFaults: number;
  hitRatio: number;
  faultIndices: number[];
}

// Disk Scheduling Types
export interface DiskSchedulingInput {
  requests: number[];
  headPosition: number;
  algorithm: "FCFS" | "SSTF" | "SCAN" | "CSCAN";
  diskSize?: number;
  direction?: "left" | "right";
}

export interface DiskSchedulingResult {
  seekSequence: number[];
  totalHeadMovement: number;
}

// File Allocation Types
export interface FileBlock {
  id: string;
  name: string;
  startBlock: number;
  length: number;
  blocks: number[];
}

export interface FileAllocationState {
  files: FileBlock[];
  diskBlocks: (string | null)[];
  totalBlocks: number;
}

// Navigation Types
export type ModuleType =
  | "dashboard"
  | "cpu-scheduling"
  | "bankers-algorithm"
  | "page-replacement"
  | "disk-scheduling"
  | "file-allocation";
