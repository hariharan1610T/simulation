# OS Simulator – Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technologies Used](#2-technologies-used)
3. [Project Structure](#3-project-structure)
4. [Simulation Modules](#4-simulation-modules)
   - [4.1 CPU Scheduling](#41-cpu-scheduling)
   - [4.2 Banker's Algorithm](#42-bankers-algorithm)
   - [4.3 Page Replacement](#43-page-replacement)
   - [4.4 Disk Scheduling](#44-disk-scheduling)
   - [4.5 File Allocation](#45-file-allocation)
5. [API Reference](#5-api-reference)
   - [5.1 CPU Scheduling API](#51-cpu-scheduling-api)
   - [5.2 Banker's Algorithm API](#52-bankers-algorithm-api)
   - [5.3 Page Replacement API](#53-page-replacement-api)
   - [5.4 Disk Scheduling API](#54-disk-scheduling-api)
   - [5.5 File Allocation API](#55-file-allocation-api)
6. [Frontend Components](#6-frontend-components)
7. [Data Types](#7-data-types)
8. [Setup & Running the Project](#8-setup--running-the-project)
9. [Usage Guide](#9-usage-guide)
10. [Error Handling](#10-error-handling)

---

## 1. Project Overview

**OS Simulator** is an interactive, browser-based learning tool designed to help students and developers visualize core Operating System algorithms. It covers five major OS topics:

| Module | Topic |
|--------|-------|
| CPU Scheduling | Process scheduling with Gantt chart visualization |
| Banker's Algorithm | Deadlock avoidance via safe-sequence detection |
| Page Replacement | Memory management with frame-by-frame step view |
| Disk Scheduling | Disk head movement calculation and visualization |
| File Allocation | Contiguous file allocation on a simulated disk |

The frontend is built with **Next.js / React (TypeScript)** and the simulation logic runs on a **PHP** backend exposed as JSON API endpoints.

---

## 2. Technologies Used

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 16 (React 19, TypeScript) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Data fetching | Native `fetch` API |
| Theme management | `next-themes` |
| Backend | PHP 8+ (hosted via XAMPP / Apache) |
| API transport | JSON over HTTP POST |

---

## 3. Project Structure

```text
simulation/
├── app/
│   ├── globals.css          # Global Tailwind styles
│   ├── layout.tsx           # Root layout with ThemeProvider
│   └── page.tsx             # Main page with module routing
├── components/
│   ├── modules/
│   │   ├── dashboard.tsx        # Home dashboard with module cards
│   │   ├── cpu-scheduling.tsx   # CPU Scheduling module
│   │   ├── bankers-algorithm.tsx# Banker's Algorithm module
│   │   ├── page-replacement.tsx # Page Replacement module
│   │   ├── disk-scheduling.tsx  # Disk Scheduling module
│   │   └── file-allocation.tsx  # File Allocation module
│   ├── ui/                      # Reusable UI primitives (Card, Button, Input…)
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── theme-provider.tsx       # next-themes provider wrapper
│   └── theme-toggle.tsx         # Dark / light mode toggle button
├── lib/
│   ├── types.ts             # Shared TypeScript interfaces
│   └── utils.ts             # Utility helpers (cn, etc.)
├── api/
│   ├── common.php           # Shared PHP helpers (JSON I/O, validation)
│   ├── cpu-scheduling.php   # CPU Scheduling endpoint
│   ├── bankers.php          # Banker's Algorithm endpoint
│   ├── page-replacement.php # Page Replacement endpoint
│   ├── disk-scheduling.php  # Disk Scheduling endpoint
│   └── file-allocation.php  # File Allocation endpoint
├── backend/
│   └── os_simulator.c       # Legacy C reference implementation
├── index.php                # Legacy standalone PHP interface
├── package.json
├── next.config.ts
├── README.md
├── SETUP.md
├── SYSTEM_DESIGN_DIAGRAMS.md
└── DOCUMENTATION.md         # This file
```

---

## 4. Simulation Modules

### 4.1 CPU Scheduling

**Purpose:** Simulate how an operating system decides the order in which processes are executed on the CPU.

#### Algorithms

| Algorithm | Description |
|-----------|-------------|
| **FCFS** (First-Come, First-Served) | Non-preemptive. Processes are scheduled in the order they arrive. Simple but can suffer from the convoy effect. |
| **SJF** (Shortest Job First) | Non-preemptive. At each scheduling point the process with the smallest burst time is chosen, minimising average waiting time. |
| **RR** (Round Robin) | Preemptive. Each process is allocated a fixed time slice (quantum); processes that do not finish are re-queued, giving fair CPU sharing. |

#### Metrics Calculated

- **Completion Time (CT):** When the process finishes execution.
- **Turnaround Time (TAT):** `CT − Arrival Time` — total time from submission to completion.
- **Waiting Time (WT):** `TAT − Burst Time` — time spent waiting in the ready queue.
- **Average Waiting Time / Average Turnaround Time:** Arithmetic mean across all processes.

#### Visualization

Results are displayed as an animated **Gantt chart** showing each process's execution slice on a timeline, plus a summary metrics table.

---

### 4.2 Banker's Algorithm

**Purpose:** Determine whether a system is in a **safe state** by finding a safe sequence in which all processes can be granted their maximum resource requirements without causing a deadlock.

#### Key Concepts

| Concept | Description |
|---------|-------------|
| **Allocation matrix** | Resources currently allocated to each process. |
| **Max matrix** | Maximum resources each process may ever request. |
| **Need matrix** | `Max − Allocation` — additional resources a process still needs. |
| **Available vector** | Resources not currently allocated to any process. |
| **Safe sequence** | An ordering of processes such that each can eventually obtain its needed resources given the resources released by earlier processes. |

#### Algorithm Steps

1. Compute the **Need** matrix (`Need[i][j] = Max[i][j] − Allocation[i][j]`).
2. Maintain a **Work** vector initialised to **Available**.
3. Iteratively find an unfinished process whose **Need** ≤ **Work**, "finish" it, and add its **Allocation** back to **Work**.
4. If all processes finish → **Safe state** (output the safe sequence). Otherwise → **Unsafe state** (potential deadlock).

---

### 4.3 Page Replacement

**Purpose:** Simulate how an OS manages a fixed number of memory frames when page faults occur.

#### Algorithms

| Algorithm | Description |
|-----------|-------------|
| **FIFO** (First-In, First-Out) | The oldest page in memory (the one that entered earliest) is evicted when a new page must be loaded into a full frame set. |
| **LRU** (Least Recently Used) | The page that has not been used for the longest time is evicted, approximating optimal replacement. |

#### Metrics

- **Page Faults:** Count of references that required loading a page into a frame.
- **Hit Ratio:** `(Total references − Faults) / Total references` — proportion of references served from existing frames.
- **Frame States:** A step-by-step snapshot of frame contents after each page reference.

---

### 4.4 Disk Scheduling

**Purpose:** Simulate how a disk controller services I/O requests by moving the read/write head across cylinder tracks.

#### Algorithms

| Algorithm | Description |
|-----------|-------------|
| **FCFS** | Requests are served in the order they arrive. Simple but may result in excessive head movement. |
| **SSTF** (Shortest Seek Time First) | The request closest to the current head position is served next, reducing average seek time but risking starvation of distant requests. |
| **SCAN** (Elevator) | The head moves in one direction servicing requests until the end, then reverses. Provides more uniform service than SSTF. |
| **C-SCAN** (Circular SCAN) | Like SCAN but after reaching one end the head jumps back to the start without servicing requests on the return trip, providing more uniform wait times. |

#### Metrics

- **Seek Sequence:** The ordered list of cylinder positions visited.
- **Total Head Movement:** Sum of absolute differences between consecutive positions in the seek sequence.

---

### 4.5 File Allocation

**Purpose:** Simulate **contiguous file allocation**, where each file occupies a continuous sequence of disk blocks.

#### Operations

| Action | Description |
|--------|-------------|
| **Initialize** | Create an empty disk of a specified number of blocks. |
| **Create** | Find a run of contiguous free blocks large enough for the file and allocate them. |
| **Delete** | Free all blocks occupied by a named file, making them available for future allocation. |

#### Visualization

A colour-coded block grid shows which blocks are free and which are occupied by each file, updating after every create or delete operation.

---

## 5. API Reference

All endpoints are PHP scripts located under `/api/`. They accept **HTTP POST** requests with a **JSON body** (`Content-Type: application/json`) and return a **JSON response**.

### Common Error Responses

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad Request — invalid or missing input fields. |
| `404` | Not Found — resource does not exist (e.g., file to delete). |
| `405` | Method Not Allowed — only `POST` is accepted. |

Error body format:
```json
{ "error": "Human-readable error message" }
```

---

### 5.1 CPU Scheduling API

**Endpoint:** `POST /api/cpu-scheduling.php`

#### Request Body

```json
{
  "algorithm": "FCFS",
  "processes": [
    { "id": "P1", "arrivalTime": 0, "burstTime": 5 },
    { "id": "P2", "arrivalTime": 1, "burstTime": 3 }
  ],
  "timeQuantum": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `algorithm` | `"FCFS" \| "SJF" \| "RR"` | Yes | Scheduling algorithm to use. |
| `processes` | `Process[]` | Yes | Non-empty array of process objects. |
| `processes[].id` | `string` | Yes | Unique process identifier (e.g., `"P1"`). |
| `processes[].arrivalTime` | `integer ≥ 0` | Yes | Time at which the process arrives. |
| `processes[].burstTime` | `integer ≥ 1` | Yes | CPU time required by the process. |
| `timeQuantum` | `integer ≥ 1` | Only for `RR` | Time slice length for Round Robin. |

#### Response Body

```json
{
  "ganttChart": [
    { "processId": "P1", "startTime": 0, "endTime": 5 },
    { "processId": "P2", "startTime": 5, "endTime": 8 }
  ],
  "processes": [
    {
      "id": "P1",
      "arrivalTime": 0,
      "burstTime": 5,
      "completionTime": 5,
      "waitingTime": 0,
      "turnaroundTime": 5
    }
  ],
  "averageWaitingTime": 1.5,
  "averageTurnaroundTime": 5.0
}
```

---

### 5.2 Banker's Algorithm API

**Endpoint:** `POST /api/bankers.php`

#### Request Body

```json
{
  "processes": 5,
  "resources": 3,
  "allocation": [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ],
  "max": [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ],
  "available": [3, 3, 2]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `processes` | `integer ≥ 1` | Yes | Number of processes. |
| `resources` | `integer ≥ 1` | Yes | Number of resource types. |
| `allocation` | `number[][]` | Yes | `processes × resources` allocation matrix (non-negative). |
| `max` | `number[][]` | Yes | `processes × resources` maximum demand matrix (`max ≥ allocation`). |
| `available` | `number[]` | Yes | Vector of length `resources` with currently available quantities. |

#### Response Body

```json
{
  "safe": true,
  "safeSequence": [1, 3, 4, 0, 2],
  "need": [
    [7, 4, 3],
    [1, 2, 2],
    [6, 0, 0],
    [0, 1, 1],
    [4, 3, 1]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `safe` | `boolean` | `true` if the system is in a safe state. |
| `safeSequence` | `number[]` | Process indices in safe execution order (empty if unsafe). |
| `need` | `number[][]` | Computed Need matrix (`Max − Allocation`). |

---

### 5.3 Page Replacement API

**Endpoint:** `POST /api/page-replacement.php`

#### Request Body

```json
{
  "frames": 3,
  "pageString": [7, 0, 1, 2, 0, 3, 0, 4],
  "algorithm": "FIFO"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `frames` | `integer ≥ 1` | Yes | Number of available memory frames. |
| `pageString` | `number[]` | Yes | Non-empty ordered array of page reference numbers (≥ 0). |
| `algorithm` | `"FIFO" \| "LRU"` | Yes | Replacement algorithm. |

#### Response Body

```json
{
  "frameStates": [
    [7, null, null],
    [7, 0, null],
    [7, 0, 1]
  ],
  "pageFaults": 6,
  "hitRatio": 0.25,
  "faultIndices": [0, 1, 2, 3, 5, 7]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `frameStates` | `(number \| null)[][]` | Frame contents after each page reference (one row per reference). |
| `pageFaults` | `number` | Total count of page faults. |
| `hitRatio` | `number` | Fraction of references that were hits (0–1). |
| `faultIndices` | `number[]` | Zero-based indices into `pageString` where faults occurred. |

---

### 5.4 Disk Scheduling API

**Endpoint:** `POST /api/disk-scheduling.php`

#### Request Body

```json
{
  "requests": [82, 10, 65, 25, 73],
  "headPosition": 50,
  "algorithm": "SCAN",
  "diskSize": 200,
  "direction": "right"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requests` | `number[]` | Yes | Non-empty array of cylinder track numbers to service. |
| `headPosition` | `integer ≥ 0` | Yes | Initial head position (must be within `[0, diskSize − 1]`). |
| `algorithm` | `"FCFS" \| "SSTF" \| "SCAN" \| "CSCAN"` | Yes | Scheduling algorithm. |
| `diskSize` | `integer ≥ 1` | No | Total number of cylinders (default: `200`). |
| `direction` | `"left" \| "right"` | No | Initial head direction for SCAN / C-SCAN (default: `"right"`). |

#### Response Body

```json
{
  "seekSequence": [50, 65, 73, 82, 199, 25, 10],
  "totalHeadMovement": 160
}
```

| Field | Type | Description |
|-------|------|-------------|
| `seekSequence` | `number[]` | Ordered list of cylinder positions visited (starting from `headPosition`). |
| `totalHeadMovement` | `number` | Total cylinders traversed. |

---

### 5.5 File Allocation API

**Endpoint:** `POST /api/file-allocation.php`

This endpoint is stateful-by-convention: the caller passes the full current state with every request and receives the updated state in the response.

#### Action: `initialize`

Create a blank disk.

**Request:**
```json
{
  "action": "initialize",
  "totalBlocks": 20
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"initialize"` | Yes | Must be `"initialize"`. |
| `totalBlocks` | `integer 5–500` | No | Number of disk blocks (default: `20`). |

**Response:**
```json
{
  "message": "Disk initialized",
  "state": {
    "files": [],
    "diskBlocks": [null, null, ...],
    "totalBlocks": 20
  }
}
```

---

#### Action: `create`

Allocate contiguous blocks for a new file.

**Request:**
```json
{
  "action": "create",
  "fileName": "report.txt",
  "fileSize": 4,
  "state": {
    "files": [],
    "diskBlocks": [null, null, ...],
    "totalBlocks": 20
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"create"` | Yes | Must be `"create"`. |
| `fileName` | `string` | Yes | Unique file name. |
| `fileSize` | `integer 1–totalBlocks` | Yes | Number of contiguous blocks needed. |
| `state` | `FileAllocationState` | Yes | Current disk state (from a previous response). |

**Response:**
```json
{
  "message": "File report.txt created",
  "state": {
    "files": [
      {
        "id": "file-a1b2c3d4e5f6",
        "name": "report.txt",
        "startBlock": 0,
        "length": 4,
        "blocks": [0, 1, 2, 3]
      }
    ],
    "diskBlocks": ["file-a1b2c3d4e5f6", "file-a1b2c3d4e5f6", "file-a1b2c3d4e5f6", "file-a1b2c3d4e5f6", null, ...],
    "totalBlocks": 20
  }
}
```

---

#### Action: `delete`

Free the blocks used by an existing file.

**Request:**
```json
{
  "action": "delete",
  "fileId": "file-a1b2c3d4e5f6",
  "state": { ... }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | `"delete"` | Yes | Must be `"delete"`. |
| `fileId` | `string` | Yes | The `id` of the file to delete (from `state.files`). |
| `state` | `FileAllocationState` | Yes | Current disk state. |

**Response:**
```json
{
  "message": "File deleted",
  "state": { ... }
}
```

---

## 6. Frontend Components

### `app/page.tsx` — Root Page

Entry point of the application. Manages the active module using local React state and renders the appropriate module component inside the main layout.

### `components/sidebar.tsx` — Navigation Sidebar

Fixed side navigation listing all five simulation modules plus the dashboard. Highlights the currently active module. On large screens it is always visible; on smaller screens it collapses.

### `components/theme-toggle.tsx` — Theme Toggle

Button placed in the header that switches between light and dark mode using `next-themes`.

### `components/modules/dashboard.tsx` — Dashboard

The default landing view. Shows summary statistics (number of modules, algorithms, etc.) and clickable cards for each simulation module.

### `components/modules/cpu-scheduling.tsx` — CPU Scheduling

- Process input table (add / edit / remove rows).
- Algorithm selector (FCFS / SJF / Round Robin) and time quantum input for RR.
- Calls `POST /api/cpu-scheduling.php`.
- Renders an animated Gantt chart and a metrics table.

### `components/modules/bankers-algorithm.tsx` — Banker's Algorithm

- Inputs for number of processes and resources.
- Editable Allocation and Max matrices.
- Available resources vector.
- Calls `POST /api/bankers.php`.
- Displays whether the system is safe, the safe sequence, and the computed Need matrix.

### `components/modules/page-replacement.tsx` — Page Replacement

- Frame count and page reference string inputs.
- Algorithm selector (FIFO / LRU).
- Calls `POST /api/page-replacement.php`.
- Renders a step-by-step frame state table highlighting page faults.

### `components/modules/disk-scheduling.tsx` — Disk Scheduling

- Cylinder request list, initial head position, disk size, algorithm, and direction inputs.
- Calls `POST /api/disk-scheduling.php`.
- Displays the seek sequence and total head movement.

### `components/modules/file-allocation.tsx` — File Allocation

- Disk initialization with block count selector.
- Create file form (name + size).
- List of current files with delete buttons.
- Visual disk block grid showing free and allocated blocks with per-file colour coding.

---

## 7. Data Types

Defined in `lib/types.ts`:

### CPU Scheduling

```typescript
interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority?: number;
}

interface GanttBlock {
  processId: string;
  startTime: number;
  endTime: number;
}

interface ProcessResult {
  id: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

interface SchedulingResult {
  ganttChart: GanttBlock[];
  processes: ProcessResult[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
}
```

### Banker's Algorithm

```typescript
interface BankerResult {
  safe: boolean;
  safeSequence: number[];
  need: number[][];
}
```

### Page Replacement

```typescript
interface PageReplacementResult {
  frameStates: (number | null)[][];
  pageFaults: number;
  hitRatio: number;
  faultIndices: number[];
}
```

### Disk Scheduling

```typescript
interface DiskSchedulingResult {
  seekSequence: number[];
  totalHeadMovement: number;
}
```

### File Allocation

```typescript
interface FileBlock {
  id: string;
  name: string;
  startBlock: number;
  length: number;
  blocks: number[];
}

interface FileAllocationState {
  files: FileBlock[];
  diskBlocks: (string | null)[];
  totalBlocks: number;
}
```

### Navigation

```typescript
type ModuleType =
  | "dashboard"
  | "cpu-scheduling"
  | "bankers-algorithm"
  | "page-replacement"
  | "disk-scheduling"
  | "file-allocation";
```

---

## 8. Setup & Running the Project

### Prerequisites

| Requirement | Version |
|-------------|---------|
| XAMPP (Apache + PHP) | PHP 8+ |
| Node.js | 18+ |
| pnpm | 8+ (or npm / yarn) |

### Steps

1. **Clone / download** the repository and place it inside your XAMPP `htdocs` folder:
   - Windows: `C:\xampp\htdocs\simulation`
   - Linux/macOS: `/opt/lampp/htdocs/simulation`

2. **Start Apache** from the XAMPP Control Panel (required for PHP API endpoints).

3. **Install frontend dependencies:**
   ```bash
   cd simulation
   pnpm install
   ```

4. **Run the Next.js development server:**
   ```bash
   pnpm dev
   ```

5. **Open the app** at [http://localhost:3000](http://localhost:3000).

   > The frontend sends API requests to `/api/*.php` which are served by Apache at `http://localhost/simulation/api/`. Make sure the Next.js `rewrites` or your environment proxy routes these correctly, or access the full app via `http://localhost/simulation` through Apache directly.

### Production Build

```bash
pnpm build
pnpm start
```

---

## 9. Usage Guide

### CPU Scheduling

1. Navigate to **CPU Scheduling** from the sidebar.
2. Add or edit processes in the table (Process ID, Arrival Time, Burst Time).
3. Select an algorithm: **FCFS**, **SJF**, or **Round Robin**.
4. If Round Robin is selected, set the **Time Quantum**.
5. Click **Run Simulation**.
6. View the animated Gantt chart and per-process metrics table.

### Banker's Algorithm

1. Navigate to **Banker's Algorithm**.
2. Set the number of **Processes** and **Resources**.
3. Fill in the **Allocation** matrix (what each process currently holds).
4. Fill in the **Max** matrix (the maximum each process may ever need).
5. Enter the **Available** resources vector.
6. Click **Run Simulation**.
7. The result shows whether the system is **Safe** or **Unsafe**, along with the safe execution sequence and the computed Need matrix.

### Page Replacement

1. Navigate to **Page Replacement**.
2. Enter the number of **Frames** and the **Page Reference String** (space or comma-separated integers).
3. Select **FIFO** or **LRU**.
4. Click **Run Simulation**.
5. Inspect the step-by-step frame state table; fault steps are highlighted.

### Disk Scheduling

1. Navigate to **Disk Scheduling**.
2. Enter the **Cylinder Requests** (space or comma-separated integers).
3. Set the **Head Position** and optional **Disk Size** and **Direction**.
4. Select an algorithm: **FCFS**, **SSTF**, **SCAN**, or **C-SCAN**.
5. Click **Run Simulation**.
6. View the seek sequence and total head movement.

### File Allocation

1. Navigate to **File Allocation**.
2. Set the total number of disk **Blocks** and click **Initialize Disk**.
3. Enter a **File Name** and **File Size** (in blocks) then click **Create File**.
4. Observe the block grid update to show the newly allocated file.
5. Click the **Delete** button next to a file to free its blocks.

---

## 10. Error Handling

### Frontend

- All API calls are wrapped in `try/catch`.
- A loading spinner is shown while awaiting a response.
- If the API returns a non-`2xx` status, the `error` field from the JSON body is displayed beneath the form.

### Backend (PHP)

The shared helper `api/common.php` provides:

- **`read_json_input()`** — Rejects non-`POST` requests (405) and malformed JSON (400).
- **`require_int($data, $key, $min)`** — Returns a validated integer or sends a 400 error.
- **`send_json($payload, $status)`** — Outputs a JSON response with the given HTTP status and exits.

All validation errors follow the same structure:
```json
{ "error": "Description of what went wrong" }
```

### Common Issues and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `404` on `/api/...` | Apache not running or wrong `htdocs` path. | Start Apache; verify project is inside `htdocs`. |
| `Only POST method is allowed` | Request sent with a method other than `POST`. | Ensure `fetch` uses `method: "POST"`. |
| `Invalid JSON body` | Request body is empty or malformed. | Use `JSON.stringify(data)` and set `Content-Type: application/json`. |
| Validation error from API | Input values violate constraints. | Check field requirements in the API Reference above and correct the inputs. |
| `Not enough contiguous space` | No free run of blocks large enough for the file. | Delete some files to free space, or create a file with a smaller size. |
