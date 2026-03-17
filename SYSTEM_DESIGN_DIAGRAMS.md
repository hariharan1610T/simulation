# All-in-One Operating System Simulator - System Design Diagrams

## 1. System Architecture Diagram

```mermaid
graph TB
    User["👤 User Browser"]
    
    subgraph Frontend["Frontend Layer (React/Next.js)"]
        UI["User Interface"]
        Components["Module Components"]
        ThemeToggle["Theme Manager"]
    end
    
    subgraph APILayer["API Layer (Next.js Routes)"]
        CPUApi["/api/cpu-scheduling"]
        BankersApi["/api/bankers-algorithm"]
        PageRepApi["/api/page-replacement"]
        DiskApi["/api/disk-scheduling"]
    end
    
    subgraph Logic["Simulation Logic Layer"]
        CPULogic["CPU Scheduling<br/>FCFS, SJF, RR"]
        BankersLogic["Banker's Algorithm<br/>Deadlock Avoidance"]
        MemoryLogic["Page Replacement<br/>FIFO, LRU"]
        DiskLogic["Disk Scheduling<br/>FCFS, SSTF, SCAN"]
    end
    
    Database["State & Results<br/>Management"]
    
    User -->|Request| Frontend
    Frontend -->|API Call| APILayer
    APILayer -->|Execute| Logic
    Logic -->|Store/Retrieve| Database
    Database -->|Result| APILayer
    APILayer -->|JSON Response| Frontend
    Frontend -->|Render| User
    
    style Frontend fill:#e1f5ff
    style APILayer fill:#fff3e0
    style Logic fill:#f3e5f5
    style User fill:#c8e6c9
    style Database fill:#ffe0b2
```

---

## 2. Data Flow Diagram (DFD)

### Level 0 - Context Diagram

```mermaid
graph LR
    User["👤 User"]
    System["🖥️ OS Simulator System"]
    
    User -->|Input Parameters<br/>Select Algorithm| System
    System -->|Simulation Results<br/>Gantt Charts<br/>Analysis| User
    
    style User fill:#c8e6c9
    style System fill:#bbdefb
```

### Level 1 - Process Decomposition

```mermaid
graph TB
    User["👤 User Input"]
    
    subgraph Processes["Simulation Processes"]
        CPU["1.0 CPU Scheduling<br/>FCFS/SJF/RR"]
        Banker["2.0 Deadlock Avoidance<br/>Banker's Algorithm"]
        PageRepl["3.0 Page Replacement<br/>FIFO/LRU"]
        Disk["4.0 Disk Scheduling<br/>FCFS/SSTF/SCAN"]
    end
    
    DataStore["Data Store<br/>Process Queue<br/>Resource Matrix<br/>Page Table<br/>Disk Queue"]
    
    Output["📊 Results & Visualization"]
    
    User -->|Process Request| CPU
    User -->|Process Request| Banker
    User -->|Process Request| PageRepl
    User -->|Process Request| Disk
    
    CPU -->|Read/Write| DataStore
    Banker -->|Read/Write| DataStore
    PageRepl -->|Read/Write| DataStore
    Disk -->|Read/Write| DataStore
    
    CPU -->|Output Data| Output
    Banker -->|Output Data| Output
    PageRepl -->|Output Data| Output
    Disk -->|Output Data| Output
    
    Output -->|Display Results| User
    
    style Processes fill:#f3e5f5
    style DataStore fill:#ffe0b2
    style Output fill:#c8e6c9
    style User fill:#bbdefb
```

---

## 3. Use Case Diagram

```mermaid
graph TB
    Actor["👤 User"]
    
    subgraph UseCases["Use Cases"]
        UC1["Select Module"]
        UC2["Configure Parameters"]
        UC3["Run Simulation"]
        UC4["View Results"]
        UC5["Toggle Dark Mode"]
        UC6["Compare Algorithms"]
        UC7["Export Results"]
    end
    
    Actor -->|initiates| UC1
    UC1 -->|includes| UC2
    UC2 -->|includes| UC3
    UC3 -->|includes| UC4
    UC1 -->|includes| UC5
    UC4 -->|includes| UC6
    UC4 -->|includes| UC7
    
    style Actor fill:#c8e6c9
    style UseCases fill:#bbdefb
```

---

## 4. Process Flowchart

```mermaid
graph TD
    Start(["Start"]) --> Display["Display Main Dashboard"]
    Display --> Menu{"Select Module"}
    
    Menu -->|CPU| CPU["Configure Process Queue<br/>- Process IDs<br/>- Burst Times<br/>- Arrival Times"]
    Menu -->|Banker| Banker["Enter Resource Matrix<br/>- Allocation Matrix<br/>- Max Matrix<br/>- Available Resources"]
    Menu -->|PageRepl| PageRepl["Configure Memory<br/>- Frame Count<br/>- Page Reference String"]
    Menu -->|Disk| Disk["Configure Disk<br/>- Head Position<br/>- Cylinder Requests"]
    
    CPU --> SelectAlgo1{"Select Algorithm"}
    SelectAlgo1 -->|FCFS| Process1["Execute FCFS"]
    SelectAlgo1 -->|SJF| Process2["Execute SJF"]
    SelectAlgo1 -->|Round Robin| Process3["Execute RR"]
    
    Banker --> CheckSafe{"Check for Safe<br/>State"}
    PageRepl --> SelectAlgo2{"Select Algorithm"}
    Disk --> SelectAlgo3{"Select Algorithm"}
    
    SelectAlgo2 -->|FIFO| Process4["Execute FIFO"]
    SelectAlgo2 -->|LRU| Process5["Execute LRU"]
    
    SelectAlgo3 -->|FCFS| Process6["Execute FCFS"]
    SelectAlgo3 -->|SSTF| Process7["Execute SSTF"]
    SelectAlgo3 -->|SCAN| Process8["Execute SCAN"]
    
    CheckSafe -->|Safe| ResultSafe["Display Safe Sequence"]
    CheckSafe -->|Unsafe| ResultUnsafe["Display Unsafe State"]
    
    Process1 --> DisplayResult["Display Results<br/>- Gantt Chart<br/>- Metrics Table<br/>- Statistics"]
    Process2 --> DisplayResult
    Process3 --> DisplayResult
    Process4 --> DisplayResult
    Process5 --> DisplayResult
    Process6 --> DisplayResult
    Process7 --> DisplayResult
    Process8 --> DisplayResult
    ResultSafe --> DisplayResult
    ResultUnsafe --> DisplayResult
    
    DisplayResult --> Again{"Run Another<br/>Simulation?"}
    Again -->|Yes| Menu
    Again -->|No| End(["End"])
    
    style Start fill:#c8e6c9
    style End fill:#ffcdd2
    style DisplayResult fill:#fff9c4
    style Menu fill:#bbdefb
```

---

## 5. Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Browser as React Frontend
    participant API as Next.js API Route
    participant Engine as Simulation Engine
    participant Logic as Algorithm Logic
    
    User->>Browser: Select Module & Input Data
    Browser->>Browser: Validate Input
    Browser->>Browser: Show Loading Spinner
    
    Browser->>API: POST /api/cpu-scheduling<br/>{processes, algorithm, quantum}
    
    API->>Engine: Initialize Scheduler
    API->>Logic: Execute Algorithm<br/>(FCFS/SJF/RR)
    
    Logic->>Logic: Process Queue Operations
    Logic->>Logic: Calculate Waiting Times
    Logic->>Logic: Calculate Turnaround Times
    Logic->>Logic: Generate Gantt Chart Data
    
    Logic-->>API: Return Results
    {<br/>ganttChart: Array,<br/>metrics: Object,<br/>timeline: Array<br/>}
    
    API-->>Browser: JSON Response
    Browser->>Browser: Hide Loading Spinner
    Browser->>Browser: Render Gantt Chart
    Browser->>Browser: Render Results Table
    Browser->>User: Display Visualization
    
    User->>User: View Results & Analysis
```

---

## 6. Component Diagram

```mermaid
graph TB
    subgraph UI["UI Layer Components"]
        Sidebar["Sidebar<br/>Navigation"]
        Header["Header<br/>Theme Toggle"]
        Dashboard["Dashboard<br/>Module Cards"]
        CPUComponent["CPU Scheduling<br/>Component"]
        BankersComponent["Banker's Algorithm<br/>Component"]
        PageReplComponent["Page Replacement<br/>Component"]
        DiskComponent["Disk Scheduling<br/>Component"]
    end
    
    subgraph API["API Layer"]
        CPURoute["/api/cpu-scheduling"]
        BankersRoute["/api/bankers-algorithm"]
        PageReplRoute["/api/page-replacement"]
        DiskRoute["/api/disk-scheduling"]
    end
    
    subgraph Core["Core Logic Components"]
        CPUEngine["CPU Engine<br/>FCFS, SJF, RR"]
        BankersEngine["Banker's Engine<br/>Safety Check"]
        MemoryEngine["Memory Engine<br/>FIFO, LRU"]
        DiskEngine["Disk Engine<br/>FCFS, SSTF, SCAN"]
    end
    
    subgraph Utils["Utilities"]
        ThemeProvider["Theme Provider<br/>Dark/Light Mode"]
        Types["Type Definitions"]
        Constants["Constants"]
    end
    
    Sidebar -->|routes to| Dashboard
    Sidebar -->|routes to| CPUComponent
    Sidebar -->|routes to| BankersComponent
    Sidebar -->|routes to| PageReplComponent
    Sidebar -->|routes to| DiskComponent
    
    Header -->|uses| ThemeProvider
    
    CPUComponent -->|calls| CPURoute
    BankersComponent -->|calls| BankersRoute
    PageReplComponent -->|calls| PageReplRoute
    DiskComponent -->|calls| DiskRoute
    
    CPURoute -->|uses| CPUEngine
    BankersRoute -->|uses| BankersEngine
    PageReplRoute -->|uses| MemoryEngine
    DiskRoute -->|uses| DiskEngine
    
    CPUEngine -->|uses| Types
    BankersEngine -->|uses| Types
    MemoryEngine -->|uses| Types
    DiskEngine -->|uses| Types
    
    style UI fill:#e1f5ff
    style API fill:#fff3e0
    style Core fill:#f3e5f5
    style Utils fill:#e8f5e9
```

---

## 7. Deployment Diagram

```mermaid
graph TB
    subgraph Client["Client Machine"]
        Browser["🌐 Web Browser<br/>React App"]
    end
    
    subgraph Server["Vercel Deployment / Local Dev"]
        NextServer["Next.js Server<br/>- Frontend Routes<br/>- API Routes"]
        FS["File System<br/>- Components<br/>- Modules<br/>- Logic"]
    end
    
    subgraph Runtime["Runtime Environment"]
        Node["Node.js Runtime"]
        V8["V8 Engine"]
    end
    
    Browser -->|HTTPS Requests| NextServer
    NextServer -->|Reads| FS
    FS -->|Executes| Runtime
    Runtime -->|Processes| Node
    Node -->|Optimizes| V8
    V8 -->|Returns| NextServer
    NextServer -->|JSON Response| Browser
    Browser -->|Renders| Display["📊 UI Display"]
    
    style Client fill:#c8e6c9
    style Server fill:#bbdefb
    style Runtime fill:#fff3e0
    style Display fill:#ffe0b2
```

---

## 8. Algorithm Flowchart - CPU Scheduling (FCFS)

```mermaid
graph TD
    Start(["Start: FCFS Scheduler"]) --> Input["Input:<br/>Process Queue"]
    Input --> Init["Initialize:<br/>- Ready Queue<br/>- Current Time = 0<br/>- Gantt Chart = []"]
    
    Init --> Check{"Queue<br/>Empty?"}
    
    Check -->|Yes| Done["All Processes Complete"]
    Check -->|No| Dequeue["Dequeue First Process<br/>from Ready Queue"]
    
    Dequeue --> CalcStart["Start Time =<br/>Max(Current Time,<br/>Arrival Time)"]
    
    CalcStart --> CalcEnd["End Time =<br/>Start Time +<br/>Burst Time"]
    
    CalcEnd --> UpdateGantt["Add to Gantt Chart:<br/>{Process, Start, End}"]
    
    UpdateGantt --> CalcWaiting["Waiting Time =<br/>Start Time -<br/>Arrival Time"]
    
    CalcWaiting --> CalcTurnaround["Turnaround Time =<br/>End Time -<br/>Arrival Time"]
    
    CalcTurnaround --> UpdateTime["Current Time =<br/>End Time"]
    
    UpdateTime --> Update["Store Metrics:<br/>- Waiting Time<br/>- Turnaround Time<br/>- Completion Time"]
    
    Update --> Check
    
    Done --> Calculate["Calculate Averages:<br/>- Avg Waiting Time<br/>- Avg Turnaround Time"]
    
    Calculate --> Output["Output:<br/>- Gantt Chart<br/>- Metrics Table<br/>- Averages"]
    
    Output --> End(["End"])
    
    style Start fill:#c8e6c9
    style End fill:#ffcdd2
    style Done fill:#fff9c4
    style Output fill:#b3e5fc
```

---

## 9. Round Robin Algorithm Flowchart

```mermaid
graph TD
    Start(["Start: Round Robin<br/>Scheduler"]) --> Input["Input:<br/>- Process Queue<br/>- Time Quantum"]
    
    Input --> Init["Initialize:<br/>- Ready Queue<br/>- Current Time = 0<br/>- Quantum = Q"]
    
    Init --> Check1{"Ready Queue<br/>Empty?"}
    
    Check1 -->|Yes| Done["All Processes Complete"]
    Check1 -->|No| Dequeue["Dequeue First Process"]
    
    Dequeue --> Check2{"Remaining<br/>Burst ≤ Q?"}
    
    Check2 -->|Yes| Execute1["Execute for<br/>Remaining Burst"]
    Check2 -->|No| Execute2["Execute for<br/>Time Quantum Q"]
    
    Execute1 --> AddGantt1["Add to Gantt Chart"]
    Execute2 --> AddGantt2["Add to Gantt Chart"]
    
    AddGantt1 --> Complete["Process Complete<br/>Calculate:<br/>- Waiting Time<br/>- Turnaround Time"]
    AddGantt2 --> Requeue["Reduce Burst Time<br/>by Q"]
    
    Complete --> Check1
    Requeue --> UpdateTime["Update Current Time"]
    UpdateTime --> Enqueue["Enqueue Process<br/>to End of Queue"]
    Enqueue --> Check1
    
    Done --> Calculate["Calculate Averages:<br/>- Avg Waiting Time<br/>- Avg Turnaround Time"]
    
    Calculate --> Output["Output:<br/>- Gantt Chart<br/>- Metrics Table"]
    
    Output --> End(["End"])
    
    style Start fill:#c8e6c9
    style End fill:#ffcdd2
    style Done fill:#fff9c4
    style Complete fill:#c8e6c9
```

---

## 10. Gantt Chart Representation (Sample Output)

### Example: CPU Scheduling Results

```
Process Schedule Timeline:

Time:  0    5    10   15   20   25   30   35
       |____|____|____|____|____|____|____|

Gantt Chart:
┌──────┬────────┬──────────┬────┬────────┐
│ P1   │ P2     │ P3       │ P4 │ P1     │
│5ms   │10ms    │15ms      │3ms │7ms     │
└──────┴────────┴──────────┴────┴────────┘
0      5        15         30   33       40


Metrics Table:
┌────────┬──────────┬──────────────┬─────────────────┐
│Process │Wait Time │ Turnaround   │ Completion Time │
├────────┼──────────┼──────────────┼─────────────────┤
│ P1     │    10    │     12       │       12        │
│ P2     │     5    │     15       │       15        │
│ P3     │     0    │     15       │       15        │
│ P4     │    30    │     33       │       33        │
└────────┴──────────┴──────────────┴─────────────────┘

Statistics:
- Average Waiting Time: 11.25 ms
- Average Turnaround Time: 18.75 ms
- Total CPU Utilization: 100%
```

---

## 11. Memory Management - Banker's Algorithm Visualization

```
Initial State:
┌─────────────────────────────────────┐
│ Resource Allocation State           │
├──────────┬──────────┬──────────────┤
│ Process  │ Allocated│ Max Required │
├──────────┼──────────┼──────────────┤
│ P0       │    5     │     10       │
│ P1       │    2     │      5       │
│ P2       │    3     │      7       │
└──────────┴──────────┴──────────────┘

Safety Check:
Available Resources: [3, 3, 2]

Safe Sequence Found:
P1 → P0 → P2

✓ System is in a SAFE STATE
```

---

## 12. Disk Scheduling - Head Movement Visualization

```
Disk Scheduling (SCAN Algorithm):

Cylinder Track:
0   10  20  30  40  50  60  70  80  90  100
|___|___|___|___|___|___|___|___|___|___|

Initial Head Position: 50
Requests: 82, 10, 65, 25, 73

Head Movement Path (SCAN - Left then Right):

    ← Moving Left
    10 ← 25 ← 50 (start)
    |
    Moving Right →
                  65 → 73 → 82 → 100

Seek Sequence: 50 → 25 → 10 → 65 → 73 → 82
Total Head Movements: 160 cylinders
```

---

## Summary Table

| Diagram | Purpose | Format |
|---------|---------|--------|
| 1. System Architecture | Show overall system structure and components | Mermaid Graph |
| 2. Data Flow Diagram | Illustrate data movement through system | Mermaid Graph (L0 & L1) |
| 3. Use Case Diagram | Define user interactions and features | Mermaid Graph |
| 4. Process Flowchart | Detail main simulation workflow | Mermaid Flowchart |
| 5. Sequence Diagram | Show component interactions over time | Mermaid Sequence |
| 6. Component Diagram | Display software architecture layers | Mermaid Graph |
| 7. Deployment Diagram | Show deployment infrastructure | Mermaid Graph |
| 8. FCFS Flowchart | CPU Scheduling algorithm detail | Mermaid Flowchart |
| 9. Round Robin Flowchart | CPU Scheduling algorithm detail | Mermaid Flowchart |
| 10. Gantt Chart Sample | Example output visualization | ASCII Diagram |
| 11. Banker's Algorithm Sample | Memory management visualization | ASCII Diagram |
| 12. Disk Scheduling Sample | I/O scheduling visualization | ASCII Diagram |

---

**Generated for:** All-in-One Operating System Simulator  
**Framework:** Next.js React with TypeScript  
**Backend:** API Routes (Node.js)  
**Suitable for:** Academic Project Submission

