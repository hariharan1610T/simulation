/*
 * All-in-One Operating System Simulator
 * ======================================
 * A menu-driven C program that simulates:
 *   1. CPU Scheduling (FCFS, SJF, Round Robin)
 *   2. Banker's Algorithm (Deadlock Avoidance)
 *   3. Page Replacement (FIFO, LRU)
 *   4. Disk Scheduling (FCFS, SSTF)
 *   5. File Allocation (Sequential)
 *
 * Compatible with standard C (gcc / Dev C++)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <limits.h>

/* =====================================================================
 *  CONSTANTS
 * ===================================================================== */
#define MAX_PROCESSES   20
#define MAX_RESOURCES   10
#define MAX_FRAMES      10
#define MAX_PAGES       50
#define MAX_DISK_REQ    20
#define MAX_FILES       20
#define MAX_BLOCKS      100
#define MAX_FILENAME    30

/* =====================================================================
 *  STRUCTURES
 * ===================================================================== */

/* Process structure for CPU scheduling */
typedef struct {
    int pid;           /* Process ID */
    int arrival;       /* Arrival time */
    int burst;         /* Burst time */
    int remaining;     /* Remaining burst (Round Robin) */
    int finish;        /* Finish time */
    int waiting;       /* Waiting time */
    int turnaround;    /* Turnaround time */
    int started;       /* Flag: has process started? */
} Process;

/* File structure for file allocation */
typedef struct {
    char name[MAX_FILENAME];
    int start_block;
    int num_blocks;
    int is_allocated;
} File;

/* =====================================================================
 *  UTILITY FUNCTIONS
 * ===================================================================== */

/* Clear input buffer to avoid scanf issues */
static void clear_input_buffer(void) {
    int c;
    while ((c = getchar()) != '\n' && c != EOF)
        ;
}

/* Print a separator line */
static void print_separator(void) {
    printf("------------------------------------------------------------\n");
}

/* Print the main menu */
static void print_main_menu(void) {
    printf("\n");
    print_separator();
    printf("       ALL-IN-ONE OPERATING SYSTEM SIMULATOR\n");
    print_separator();
    printf("  1. CPU Scheduling\n");
    printf("  2. Banker's Algorithm (Deadlock Avoidance)\n");
    printf("  3. Page Replacement (Memory Management)\n");
    printf("  4. Disk Scheduling\n");
    printf("  5. File Allocation (Sequential)\n");
    printf("  6. Exit\n");
    print_separator();
    printf("  Enter your choice: ");
}

/* Read a positive integer with a prompt; returns -1 on invalid input */
static int read_int(const char *prompt) {
    int val;
    printf("%s", prompt);
    if (scanf("%d", &val) != 1) {
        clear_input_buffer();
        printf("  [Error] Invalid input. Please enter an integer.\n");
        return -1;
    }
    return val;
}


/* =====================================================================
 *  MODULE 1: CPU SCHEDULING
 * ===================================================================== */

/* Sort processes by arrival time (bubble sort) */
static void sort_by_arrival(Process procs[], int n) {
    int i, j;
    for (i = 0; i < n - 1; i++)
        for (j = 0; j < n - i - 1; j++)
            if (procs[j].arrival > procs[j + 1].arrival) {
                Process tmp = procs[j];
                procs[j] = procs[j + 1];
                procs[j + 1] = tmp;
            }
}

/* Print Gantt chart from a sequence of (pid, start, end) entries */
static void print_gantt(int pids[], int starts[], int ends[], int count) {
    int i;
    printf("\n  Gantt Chart:\n  ");
    for (i = 0; i < count; i++)
        printf("| P%-2d ", pids[i]);
    printf("|\n  ");
    for (i = 0; i < count; i++)
        printf("%d    ", starts[i]);
    printf("%d\n", ends[count - 1]);
}

/* Print process results table */
static void print_process_table(Process procs[], int n) {
    int i;
    double total_wt = 0, total_tat = 0;
    printf("\n  %-5s %-10s %-10s %-10s %-12s %-12s\n",
           "PID", "Arrival", "Burst", "Finish", "Waiting", "Turnaround");
    print_separator();
    for (i = 0; i < n; i++) {
        printf("  %-5d %-10d %-10d %-10d %-12d %-12d\n",
               procs[i].pid, procs[i].arrival, procs[i].burst,
               procs[i].finish, procs[i].waiting, procs[i].turnaround);
        total_wt  += procs[i].waiting;
        total_tat += procs[i].turnaround;
    }
    print_separator();
    printf("  Average Waiting Time    : %.2f\n", total_wt  / n);
    printf("  Average Turnaround Time : %.2f\n", total_tat / n);
}

/* Read process data (arrival + burst) for n processes */
static int read_processes(Process procs[], int n) {
    int i;
    for (i = 0; i < n; i++) {
        procs[i].pid = i + 1;
        printf("  Process P%d:\n", i + 1);
        procs[i].arrival = read_int("    Arrival Time : ");
        if (procs[i].arrival < 0) return 0;
        procs[i].burst = read_int("    Burst Time   : ");
        if (procs[i].burst <= 0) { printf("  [Error] Burst time must be > 0.\n"); return 0; }
        procs[i].remaining = procs[i].burst;
        procs[i].finish = procs[i].waiting = procs[i].turnaround = 0;
        procs[i].started = 0;
    }
    return 1;
}

/* FCFS scheduling */
static void cpu_fcfs(Process procs[], int n) {
    int i, time = 0;
    int g_pids[MAX_PROCESSES * 2], g_start[MAX_PROCESSES * 2], g_end[MAX_PROCESSES * 2];
    int gc = 0;

    sort_by_arrival(procs, n);

    for (i = 0; i < n; i++) {
        if (time < procs[i].arrival)
            time = procs[i].arrival;
        g_pids[gc]  = procs[i].pid;
        g_start[gc] = time;
        time        += procs[i].burst;
        g_end[gc]   = time;
        gc++;
        procs[i].finish     = time;
        procs[i].turnaround = procs[i].finish - procs[i].arrival;
        procs[i].waiting    = procs[i].turnaround - procs[i].burst;
    }
    print_gantt(g_pids, g_start, g_end, gc);
    print_process_table(procs, n);
}

/* SJF (Non-preemptive) scheduling */
static void cpu_sjf(Process procs[], int n) {
    int done[MAX_PROCESSES] = {0};
    int i, time = 0, completed = 0;
    int g_pids[MAX_PROCESSES * 2], g_start[MAX_PROCESSES * 2], g_end[MAX_PROCESSES * 2];
    int gc = 0;

    while (completed < n) {
        int min_burst = INT_MAX, idx = -1;
        for (i = 0; i < n; i++) {
            if (!done[i] && procs[i].arrival <= time && procs[i].burst < min_burst) {
                min_burst = procs[i].burst;
                idx = i;
            }
        }
        if (idx == -1) {
            /* No process ready; advance time to next arrival */
            int next = INT_MAX;
            for (i = 0; i < n; i++)
                if (!done[i] && procs[i].arrival < next)
                    next = procs[i].arrival;
            time = next;
            continue;
        }
        g_pids[gc]  = procs[idx].pid;
        g_start[gc] = time;
        time        += procs[idx].burst;
        g_end[gc]   = time;
        gc++;
        procs[idx].finish     = time;
        procs[idx].turnaround = procs[idx].finish - procs[idx].arrival;
        procs[idx].waiting    = procs[idx].turnaround - procs[idx].burst;
        done[idx] = 1;
        completed++;
    }
    print_gantt(g_pids, g_start, g_end, gc);
    print_process_table(procs, n);
}

/* Round Robin scheduling */
static void cpu_rr(Process procs[], int n, int quantum) {
    int i, time = 0, completed = 0;
    int queue[MAX_PROCESSES * 50], front = 0, rear = 0;
    int in_queue[MAX_PROCESSES];
    int g_pids[MAX_PROCESSES * 50], g_start[MAX_PROCESSES * 50], g_end[MAX_PROCESSES * 50];
    int gc = 0;

    for (i = 0; i < n; i++) { procs[i].remaining = procs[i].burst; in_queue[i] = 0; }

    sort_by_arrival(procs, n);
    /* Enqueue all processes that arrive at time 0 */
    for (i = 0; i < n; i++) {
        if (procs[i].arrival == 0) { queue[rear++] = i; in_queue[i] = 1; }
    }

    while (completed < n) {
        if (front == rear) {
            /* Idle: advance to next arrival */
            int next = INT_MAX;
            for (i = 0; i < n; i++)
                if (!in_queue[i] && procs[i].remaining > 0 && procs[i].arrival < next)
                    next = procs[i].arrival;
            if (next == INT_MAX) break;
            time = next;
            for (i = 0; i < n; i++)
                if (!in_queue[i] && procs[i].remaining > 0 && procs[i].arrival <= time) {
                    queue[rear++] = i; in_queue[i] = 1;
                }
        }

        int idx = queue[front++];
        int exec = (procs[idx].remaining < quantum) ? procs[idx].remaining : quantum;
        g_pids[gc]  = procs[idx].pid;
        g_start[gc] = time;
        time        += exec;
        g_end[gc]   = time;
        gc++;
        procs[idx].remaining -= exec;

        /* Enqueue newly arrived processes */
        for (i = 0; i < n; i++)
            if (!in_queue[i] && procs[i].remaining > 0 && procs[i].arrival <= time) {
                queue[rear++] = i; in_queue[i] = 1;
            }

        if (procs[idx].remaining == 0) {
            procs[idx].finish     = time;
            procs[idx].turnaround = procs[idx].finish - procs[idx].arrival;
            procs[idx].waiting    = procs[idx].turnaround - procs[idx].burst;
            completed++;
        } else {
            queue[rear++] = idx;
        }
    }
    print_gantt(g_pids, g_start, g_end, gc);
    print_process_table(procs, n);
}

/* CPU scheduling sub-menu */
static void module_cpu_scheduling(void) {
    int choice, n, quantum;
    Process procs[MAX_PROCESSES];

    printf("\n=== CPU Scheduling ===\n");
    printf("  Enter number of processes (1-%d): ", MAX_PROCESSES);
    n = read_int("");
    if (n <= 0 || n > MAX_PROCESSES) { printf("  [Error] Invalid number.\n"); return; }
    if (!read_processes(procs, n)) return;

    printf("\n  Select Algorithm:\n");
    printf("    1. FCFS\n    2. SJF (Non-preemptive)\n    3. Round Robin\n");
    choice = read_int("  Choice: ");

    switch (choice) {
        case 1:
            printf("\n  --- FCFS ---\n");
            cpu_fcfs(procs, n);
            break;
        case 2:
            printf("\n  --- SJF (Non-preemptive) ---\n");
            cpu_sjf(procs, n);
            break;
        case 3:
            quantum = read_int("  Enter Time Quantum: ");
            if (quantum <= 0) { printf("  [Error] Quantum must be > 0.\n"); return; }
            printf("\n  --- Round Robin (Quantum=%d) ---\n", quantum);
            cpu_rr(procs, n, quantum);
            break;
        default:
            printf("  [Error] Invalid choice.\n");
    }
}

/* =====================================================================
 *  MODULE 2: BANKER'S ALGORITHM
 * ===================================================================== */

/* Check if the system is in a safe state and find a safe sequence */
static void module_bankers_algorithm(void) {
    int np, nr, i, j, k;
    int allocation[MAX_PROCESSES][MAX_RESOURCES];
    int max_mat[MAX_PROCESSES][MAX_RESOURCES];
    int need[MAX_PROCESSES][MAX_RESOURCES];
    int available[MAX_RESOURCES];
    int finish[MAX_PROCESSES];
    int safe_seq[MAX_PROCESSES];
    int seq_count = 0, found, changed;

    printf("\n=== Banker's Algorithm (Deadlock Avoidance) ===\n");
    printf("  Number of processes (1-%d): ", MAX_PROCESSES);
    np = read_int("");
    if (np <= 0 || np > MAX_PROCESSES) { printf("  [Error] Invalid.\n"); return; }
    printf("  Number of resource types (1-%d): ", MAX_RESOURCES);
    nr = read_int("");
    if (nr <= 0 || nr > MAX_RESOURCES) { printf("  [Error] Invalid.\n"); return; }

    /* Read Allocation matrix */
    printf("\n  Enter Allocation matrix (%d x %d):\n", np, nr);
    for (i = 0; i < np; i++) {
        printf("  P%d: ", i);
        for (j = 0; j < nr; j++) {
            allocation[i][j] = read_int("");
            if (allocation[i][j] < 0) { printf("  [Error] Values must be >= 0.\n"); return; }
        }
    }

    /* Read Max matrix */
    printf("\n  Enter Max matrix (%d x %d):\n", np, nr);
    for (i = 0; i < np; i++) {
        printf("  P%d: ", i);
        for (j = 0; j < nr; j++) {
            max_mat[i][j] = read_int("");
            if (max_mat[i][j] < 0) { printf("  [Error] Values must be >= 0.\n"); return; }
        }
    }

    /* Read Available vector */
    printf("\n  Enter Available resources (%d values): ", nr);
    for (j = 0; j < nr; j++) {
        available[j] = read_int("");
        if (available[j] < 0) { printf("  [Error] Values must be >= 0.\n"); return; }
    }

    /* Compute Need = Max - Allocation */
    for (i = 0; i < np; i++)
        for (j = 0; j < nr; j++) {
            need[i][j] = max_mat[i][j] - allocation[i][j];
            if (need[i][j] < 0) {
                printf("  [Error] Allocation exceeds Max for P%d R%d.\n", i, j);
                return;
            }
        }

    /* Display Need matrix */
    printf("\n  Need matrix:\n");
    for (i = 0; i < np; i++) {
        printf("  P%d: ", i);
        for (j = 0; j < nr; j++) printf("%3d ", need[i][j]);
        printf("\n");
    }

    /* Safety algorithm */
    for (i = 0; i < np; i++) finish[i] = 0;

    do {
        changed = 0;
        for (i = 0; i < np; i++) {
            if (finish[i]) continue;
            found = 1;
            for (j = 0; j < nr; j++)
                if (need[i][j] > available[j]) { found = 0; break; }
            if (found) {
                for (k = 0; k < nr; k++)
                    available[k] += allocation[i][k];
                finish[i] = 1;
                safe_seq[seq_count++] = i;
                changed = 1;
            }
        }
    } while (changed);

    if (seq_count == np) {
        printf("\n  System is in a SAFE STATE.\n  Safe Sequence: ");
        for (i = 0; i < np; i++)
            printf("P%d%s", safe_seq[i], (i < np - 1) ? " -> " : "\n");
    } else {
        printf("\n  System is in an UNSAFE STATE (DEADLOCK may occur).\n");
    }
}

/* =====================================================================
 *  MODULE 3: PAGE REPLACEMENT
 * ===================================================================== */

/* Check if page is in frames; returns index or -1 */
static int page_in_frames(int frames[], int n, int page) {
    int i;
    for (i = 0; i < n; i++)
        if (frames[i] == page) return i;
    return -1;
}

/* FIFO page replacement */
static void page_fifo(int pages[], int n, int nf) {
    int frame[MAX_FRAMES];
    int i, j, faults = 0, ptr = 0;
    for (i = 0; i < nf; i++) frame[i] = -1;

    printf("\n  FIFO Page Replacement:\n");
    printf("  %-6s", "Page");
    for (i = 0; i < nf; i++) printf("F%-4d", i + 1);
    printf("Fault\n");
    print_separator();

    for (i = 0; i < n; i++) {
        int hit = (page_in_frames(frame, nf, pages[i]) != -1);
        if (!hit) {
            frame[ptr] = pages[i];
            ptr = (ptr + 1) % nf;
            faults++;
        }
        printf("  %-6d", pages[i]);
        for (j = 0; j < nf; j++)
            if (frame[j] == -1) printf("%-5s", "-");
            else printf("%-5d", frame[j]);
        printf("%s\n", hit ? "" : "* FAULT");
    }
    printf("\n  Total Page Faults: %d\n", faults);
}

/* LRU page replacement */
static void page_lru(int pages[], int n, int nf) {
    int frame[MAX_FRAMES];
    int last_used[MAX_FRAMES];
    int i, j, faults = 0;
    for (i = 0; i < nf; i++) { frame[i] = -1; last_used[i] = -1; }

    printf("\n  LRU Page Replacement:\n");
    printf("  %-6s", "Page");
    for (i = 0; i < nf; i++) printf("F%-4d", i + 1);
    printf("Fault\n");
    print_separator();

    for (i = 0; i < n; i++) {
        int pos = page_in_frames(frame, nf, pages[i]);
        int hit = (pos != -1);
        if (!hit) {
            /* Find LRU frame: slot with minimum last_used */
            int lru_idx = 0, empty = -1;
            for (j = 0; j < nf; j++)
                if (frame[j] == -1) { empty = j; break; }
            if (empty != -1) {
                lru_idx = empty;
            } else {
                for (j = 1; j < nf; j++)
                    if (last_used[j] < last_used[lru_idx]) lru_idx = j;
            }
            frame[lru_idx] = pages[i];
            last_used[lru_idx] = i;
            faults++;
        } else {
            last_used[pos] = i;
        }
        printf("  %-6d", pages[i]);
        for (j = 0; j < nf; j++)
            if (frame[j] == -1) printf("%-5s", "-");
            else printf("%-5d", frame[j]);
        printf("%s\n", hit ? "" : "* FAULT");
    }
    printf("\n  Total Page Faults: %d\n", faults);
}

/* Page replacement sub-menu */
static void module_page_replacement(void) {
    int nf, np_ref, i, choice;
    int pages[MAX_PAGES];

    printf("\n=== Page Replacement (Memory Management) ===\n");
    printf("  Number of frames (1-%d): ", MAX_FRAMES);
    nf = read_int("");
    if (nf <= 0 || nf > MAX_FRAMES) { printf("  [Error] Invalid.\n"); return; }
    printf("  Number of pages in reference string (1-%d): ", MAX_PAGES);
    np_ref = read_int("");
    if (np_ref <= 0 || np_ref > MAX_PAGES) { printf("  [Error] Invalid.\n"); return; }

    printf("  Enter page reference string: ");
    for (i = 0; i < np_ref; i++) {
        pages[i] = read_int("");
        if (pages[i] < 0) { printf("  [Error] Page numbers must be >= 0.\n"); return; }
    }

    printf("\n  Select Algorithm:\n    1. FIFO\n    2. LRU\n");
    choice = read_int("  Choice: ");
    switch (choice) {
        case 1: page_fifo(pages, np_ref, nf); break;
        case 2: page_lru(pages, np_ref, nf);  break;
        default: printf("  [Error] Invalid choice.\n");
    }
}

/* =====================================================================
 *  MODULE 4: DISK SCHEDULING
 * ===================================================================== */

/* FCFS disk scheduling */
static void disk_fcfs(int reqs[], int n, int head) {
    int i, total = 0, cur = head;
    printf("\n  FCFS Disk Scheduling:\n");
    printf("  Head: %d -> ", head);
    for (i = 0; i < n; i++) {
        total += abs(reqs[i] - cur);
        cur = reqs[i];
        printf("%d%s", cur, (i < n - 1) ? " -> " : "\n");
    }
    printf("  Total Head Movement: %d cylinders\n", total);
}

/* SSTF disk scheduling */
static void disk_sstf(int reqs[], int n, int head) {
    int served[MAX_DISK_REQ] = {0};
    int j, cur = head, total = 0, count = 0;
    printf("\n  SSTF Disk Scheduling:\n");
    printf("  Head: %d -> ", head);
    while (count < n) {
        int min_dist = INT_MAX, idx = -1;
        for (j = 0; j < n; j++)
            if (!served[j] && abs(reqs[j] - cur) < min_dist) {
                min_dist = abs(reqs[j] - cur); idx = j;
            }
        served[idx] = 1;
        total += min_dist;
        cur = reqs[idx];
        count++;
        printf("%d%s", cur, (count < n) ? " -> " : "\n");
    }
    printf("  Total Head Movement: %d cylinders\n", total);
}

/* Disk scheduling sub-menu */
static void module_disk_scheduling(void) {
    int n, head, i, choice;
    int reqs[MAX_DISK_REQ];

    printf("\n=== Disk Scheduling ===\n");
    printf("  Number of disk requests (1-%d): ", MAX_DISK_REQ);
    n = read_int("");
    if (n <= 0 || n > MAX_DISK_REQ) { printf("  [Error] Invalid.\n"); return; }

    printf("  Enter disk requests: ");
    for (i = 0; i < n; i++) {
        reqs[i] = read_int("");
        if (reqs[i] < 0) { printf("  [Error] Request must be >= 0.\n"); return; }
    }

    head = read_int("  Initial head position: ");
    if (head < 0) { printf("  [Error] Head position must be >= 0.\n"); return; }

    printf("\n  Select Algorithm:\n    1. FCFS\n    2. SSTF\n");
    choice = read_int("  Choice: ");
    switch (choice) {
        case 1: disk_fcfs(reqs, n, head); break;
        case 2: disk_sstf(reqs, n, head); break;
        default: printf("  [Error] Invalid choice.\n");
    }
}

/* =====================================================================
 *  MODULE 5: FILE ALLOCATION (SEQUENTIAL)
 * ===================================================================== */

static File  file_table[MAX_FILES];
static int   disk_blocks[MAX_BLOCKS];  /* 0 = free, 1 = used */
static int   file_count = 0;

/* Initialise file system state */
static void fs_init(void) {
    int i;
    file_count = 0;
    for (i = 0; i < MAX_BLOCKS; i++) disk_blocks[i] = 0;
    for (i = 0; i < MAX_FILES;  i++) file_table[i].is_allocated = 0;
}

/* Find first run of 'size' contiguous free blocks; returns start index or -1 */
static int fs_find_contiguous(int size) {
    int i, j, ok;
    for (i = 0; i <= MAX_BLOCKS - size; i++) {
        ok = 1;
        for (j = i; j < i + size; j++)
            if (disk_blocks[j]) { ok = 0; break; }
        if (ok) return i;
    }
    return -1;
}

/* Create a file */
static void fs_create(void) {
    char fname[MAX_FILENAME];
    int size, start, i;

    if (file_count >= MAX_FILES) { printf("  [Error] File table full.\n"); return; }

    printf("  Enter file name: ");
    if (scanf("%29s", fname) != 1) { clear_input_buffer(); return; }
    clear_input_buffer();

    /* Check duplicate */
    for (i = 0; i < MAX_FILES; i++)
        if (file_table[i].is_allocated && strcmp(file_table[i].name, fname) == 0) {
            printf("  [Error] File '%s' already exists.\n", fname);
            return;
        }

    size = read_int("  Enter number of blocks required: ");
    if (size <= 0 || size > MAX_BLOCKS) { printf("  [Error] Invalid size.\n"); return; }

    start = fs_find_contiguous(size);
    if (start == -1) { printf("  [Error] Not enough contiguous disk space.\n"); return; }

    /* Allocate */
    for (i = start; i < start + size; i++) disk_blocks[i] = 1;
    for (i = 0; i < MAX_FILES; i++)
        if (!file_table[i].is_allocated) {
            strncpy(file_table[i].name, fname, MAX_FILENAME - 1);
            file_table[i].name[MAX_FILENAME - 1] = '\0';
            file_table[i].start_block  = start;
            file_table[i].num_blocks   = size;
            file_table[i].is_allocated = 1;
            file_count++;
            printf("  File '%s' created: blocks %d to %d.\n",
                   fname, start, start + size - 1);
            return;
        }
}

/* Delete a file */
static void fs_delete(void) {
    char fname[MAX_FILENAME];
    int i, j;

    printf("  Enter file name to delete: ");
    if (scanf("%29s", fname) != 1) { clear_input_buffer(); return; }
    clear_input_buffer();

    for (i = 0; i < MAX_FILES; i++)
        if (file_table[i].is_allocated && strcmp(file_table[i].name, fname) == 0) {
            for (j = file_table[i].start_block;
                 j < file_table[i].start_block + file_table[i].num_blocks; j++)
                disk_blocks[j] = 0;
            file_table[i].is_allocated = 0;
            file_count--;
            printf("  File '%s' deleted.\n", fname);
            return;
        }
    printf("  [Error] File '%s' not found.\n", fname);
}

/* Display file allocation table */
static void fs_display(void) {
    int i, any = 0;
    printf("\n  %-20s %-12s %-12s %-12s\n", "File Name", "Start Block", "Num Blocks", "End Block");
    print_separator();
    for (i = 0; i < MAX_FILES; i++)
        if (file_table[i].is_allocated) {
            printf("  %-20s %-12d %-12d %-12d\n",
                   file_table[i].name,
                   file_table[i].start_block,
                   file_table[i].num_blocks,
                   file_table[i].start_block + file_table[i].num_blocks - 1);
            any = 1;
        }
    if (!any) printf("  No files allocated.\n");
    print_separator();
    /* Show disk block map (first 40 blocks) */
    printf("  Disk Block Map (first 40 blocks): ");
    int lim = (MAX_BLOCKS < 40) ? MAX_BLOCKS : 40;
    for (i = 0; i < lim; i++) printf("%d", disk_blocks[i]);
    printf("\n");
}

/* File allocation sub-menu */
static void module_file_allocation(void) {
    int choice;
    static int initialised = 0;
    if (!initialised) { fs_init(); initialised = 1; }

    printf("\n=== File Allocation (Sequential) ===\n");
    printf("  1. Create File\n  2. Delete File\n  3. Display Allocation\n");
    choice = read_int("  Choice: ");
    switch (choice) {
        case 1: fs_create();  break;
        case 2: fs_delete();  break;
        case 3: fs_display(); break;
        default: printf("  [Error] Invalid choice.\n");
    }
}

/* =====================================================================
 *  MAIN
 * ===================================================================== */
int main(void) {
    int choice;
    printf("\n  Welcome to the All-in-One OS Simulator!\n");

    do {
        print_main_menu();
        if (scanf("%d", &choice) != 1) {
            clear_input_buffer();
            choice = 0;
        }
        switch (choice) {
            case 1: module_cpu_scheduling();    break;
            case 2: module_bankers_algorithm(); break;
            case 3: module_page_replacement();  break;
            case 4: module_disk_scheduling();   break;
            case 5: module_file_allocation();   break;
            case 6: printf("\n  Exiting simulator. Goodbye!\n"); break;
            default: printf("  [Error] Invalid choice. Please enter 1-6.\n");
        }
    } while (choice != 6);

    return 0;
}
