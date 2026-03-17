# OS Simulator

## Description
OS Simulator is a beginner-friendly project for visualizing core Operating System algorithms from the browser.  
The frontend provides interactive forms, tables, and charts, while PHP API endpoints process simulation logic and return JSON responses.

## Features
- CPU Scheduling (FCFS, SJF, Round Robin)
- Banker's Algorithm (safe/unsafe state detection)
- Page Replacement (FIFO, LRU)
- Disk Scheduling (FCFS, SSTF, SCAN, C-SCAN)
- File Allocation (contiguous allocation with create/delete actions)
- Dynamic output: result tables, Gantt chart, sequence views, and status messages

## Technologies Used
- HTML / CSS / JavaScript
- React (Next.js UI)
- PHP (JSON API endpoints)

## Folder Structure
```text
project-root/
├── app/                     # Frontend app pages and existing Next routes
├── components/              # Frontend React components
├── lib/                     # Shared frontend types/utilities
├── backend/
│   └── os_simulator.c       # Original backend logic (legacy C reference)
├── api/
│   ├── common.php
│   ├── cpu-scheduling.php
│   ├── bankers.php
│   ├── page-replacement.php
│   ├── disk-scheduling.php
│   └── file-allocation.php
├── index.php                # Legacy standalone PHP interface
├── README.md
└── SETUP.md
```

## Documentation

Full project documentation — including algorithm explanations, complete API reference, data type definitions, and a step-by-step usage guide — is available in [DOCUMENTATION.md](./DOCUMENTATION.md).

## Setup Instructions (XAMPP)
1. Install XAMPP.
2. Copy this project to your XAMPP `htdocs` folder.
3. Start **Apache** from XAMPP Control Panel.
4. Open `http://localhost/simulation` in your browser.

## How to Run
1. Open the frontend in browser.
2. Select any module from the sidebar.
3. Enter input values and run simulation.
4. Results are loaded dynamically through API calls.

## API Endpoints
- `POST /api/cpu-scheduling.php`
- `POST /api/bankers.php`
- `POST /api/page-replacement.php`
- `POST /api/disk-scheduling.php`
- `POST /api/file-allocation.php`

All endpoints accept JSON input and return JSON output.
