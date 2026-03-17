<?php
/**
 * All-in-One Operating System Simulator – PHP Web Backend
 * =========================================================
 * Provides an HTML + PHP menu-driven web interface mirroring the C simulator.
 * Each OS module is implemented as a standalone PHP function.
 *
 * Modules:
 *   1. CPU Scheduling     (FCFS, SJF, Round Robin)
 *   2. Banker's Algorithm (Deadlock Avoidance)
 *   3. Page Replacement   (FIFO, LRU)
 *   4. Disk Scheduling    (FCFS, SSTF)
 *   5. File Allocation    (Sequential – session-based)
 */

session_start();

/* =====================================================================
 * HELPERS
 * ===================================================================== */

/**
 * Sanitise integer input from $_POST; returns null if missing/invalid.
 *
 * @param string $key   POST key
 * @param int    $min   Minimum allowed value (inclusive)
 * @param int    $max   Maximum allowed value (inclusive)
 * @return int|null
 */
function post_int(string $key, int $min = PHP_INT_MIN, int $max = PHP_INT_MAX): ?int
{
    if (!isset($_POST[$key])) {
        return null;
    }
    $raw = trim((string)$_POST[$key]);
    if (!ctype_digit(ltrim($raw, '-')) || $raw === '') {
        return null;
    }
    $val = (int)$raw;
    return ($val >= $min && $val <= $max) ? $val : null;
}

/**
 * Parse a whitespace-separated string of integers into an array.
 * Returns null if any token is not a valid integer.
 *
 * @param  string $str
 * @return int[]|null
 */
function parse_int_array(string $str): ?array
{
    $tokens = preg_split('/\s+/', trim($str), -1, PREG_SPLIT_NO_EMPTY);
    if (empty($tokens)) {
        return null;
    }
    $result = [];
    foreach ($tokens as $t) {
        if (!is_numeric($t) || strpos($t, '.') !== false) {
            return null;
        }
        $result[] = (int)$t;
    }
    return $result;
}

/** HTML-encode a string for safe output. */
function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/* =====================================================================
 * MODULE 1: CPU SCHEDULING
 * ===================================================================== */

/**
 * Build process array from parallel arrival/burst arrays.
 *
 * @param int[] $arrivals
 * @param int[] $bursts
 * @return array[]  Each element: ['pid','arrival','burst','finish','waiting','turnaround']
 */
function cpu_build_processes(array $arrivals, array $bursts): array
{
    $procs = [];
    foreach ($arrivals as $i => $arr) {
        $procs[] = [
            'pid'        => $i + 1,
            'arrival'    => $arr,
            'burst'      => $bursts[$i],
            'remaining'  => $bursts[$i],
            'finish'     => 0,
            'waiting'    => 0,
            'turnaround' => 0,
        ];
    }
    return $procs;
}

/** Sort process array by arrival time (stable). */
function cpu_sort_by_arrival(array &$procs): void
{
    usort($procs, fn($a, $b) => $a['arrival'] <=> $b['arrival']);
}

/**
 * FCFS CPU scheduling.
 *
 * @param  array[] $procs  Process array (modified in-place)
 * @return array           ['gantt' => [...], 'procs' => [...]]
 */
function cpu_fcfs(array $procs): array
{
    cpu_sort_by_arrival($procs);
    $gantt = [];
    $time  = 0;
    foreach ($procs as &$p) {
        if ($time < $p['arrival']) {
            $time = $p['arrival'];
        }
        $gantt[] = ['pid' => $p['pid'], 'start' => $time, 'end' => $time + $p['burst']];
        $time += $p['burst'];
        $p['finish']     = $time;
        $p['turnaround'] = $p['finish'] - $p['arrival'];
        $p['waiting']    = $p['turnaround'] - $p['burst'];
    }
    unset($p);
    return ['gantt' => $gantt, 'procs' => $procs];
}

/**
 * SJF Non-preemptive CPU scheduling.
 *
 * @param  array[] $procs
 * @return array
 */
function cpu_sjf(array $procs): array
{
    $n     = count($procs);
    $done  = array_fill(0, $n, false);
    $time  = 0;
    $gantt = [];

    for ($completed = 0; $completed < $n;) {
        $idx      = -1;
        $minBurst = PHP_INT_MAX;
        foreach ($procs as $i => $p) {
            if (!$done[$i] && $p['arrival'] <= $time && $p['burst'] < $minBurst) {
                $minBurst = $p['burst'];
                $idx      = $i;
            }
        }
        if ($idx === -1) {
            /* Idle – advance to next arrival */
            $next = PHP_INT_MAX;
            foreach ($procs as $i => $p) {
                if (!$done[$i] && $p['arrival'] < $next) {
                    $next = $p['arrival'];
                }
            }
            $time = $next;
            continue;
        }
        $gantt[] = ['pid' => $procs[$idx]['pid'], 'start' => $time, 'end' => $time + $procs[$idx]['burst']];
        $time += $procs[$idx]['burst'];
        $procs[$idx]['finish']     = $time;
        $procs[$idx]['turnaround'] = $procs[$idx]['finish'] - $procs[$idx]['arrival'];
        $procs[$idx]['waiting']    = $procs[$idx]['turnaround'] - $procs[$idx]['burst'];
        $done[$idx] = true;
        $completed++;
    }
    return ['gantt' => $gantt, 'procs' => $procs];
}

/**
 * Round Robin CPU scheduling.
 *
 * @param  array[] $procs
 * @param  int     $quantum
 * @return array
 */
function cpu_rr(array $procs, int $quantum): array
{
    cpu_sort_by_arrival($procs);
    $n       = count($procs);
    $gantt   = [];
    $time    = 0;
    $queue   = [];
    $inQueue = array_fill(0, $n, false);

    /* Enqueue processes arriving at time 0 */
    foreach ($procs as $i => $p) {
        if ($p['arrival'] === 0) {
            $queue[]    = $i;
            $inQueue[$i] = true;
        }
    }

    $completed = 0;
    $safety    = 0;

    while ($completed < $n) {
        /* Guard against infinite loop in malformed input */
        if (++$safety > 200000) {
            break;
        }

        if (empty($queue)) {
            /* Idle */
            $next = PHP_INT_MAX;
            foreach ($procs as $i => $p) {
                if (!$inQueue[$i] && $p['remaining'] > 0 && $p['arrival'] < $next) {
                    $next = $p['arrival'];
                }
            }
            if ($next === PHP_INT_MAX) {
                break;
            }
            $time = $next;
            foreach ($procs as $i => $p) {
                if (!$inQueue[$i] && $p['remaining'] > 0 && $p['arrival'] <= $time) {
                    $queue[]    = $i;
                    $inQueue[$i] = true;
                }
            }
        }

        $idx  = array_shift($queue);
        $exec = min($procs[$idx]['remaining'], $quantum);
        $gantt[] = ['pid' => $procs[$idx]['pid'], 'start' => $time, 'end' => $time + $exec];
        $time += $exec;
        $procs[$idx]['remaining'] -= $exec;

        /* Enqueue newly arrived processes */
        foreach ($procs as $i => $p) {
            if (!$inQueue[$i] && $p['remaining'] > 0 && $p['arrival'] <= $time) {
                $queue[]    = $i;
                $inQueue[$i] = true;
            }
        }

        if ($procs[$idx]['remaining'] === 0) {
            $procs[$idx]['finish']     = $time;
            $procs[$idx]['turnaround'] = $procs[$idx]['finish'] - $procs[$idx]['arrival'];
            $procs[$idx]['waiting']    = $procs[$idx]['turnaround'] - $procs[$idx]['burst'];
            $completed++;
        } else {
            $queue[] = $idx;
        }
    }
    return ['gantt' => $gantt, 'procs' => $procs];
}

/** Render Gantt chart and results table as HTML. */
function render_cpu_result(array $result): string
{
    $gantt = $result['gantt'];
    $procs = $result['procs'];

    $html  = '<h3>Gantt Chart</h3>';
    $html .= '<div class="gantt">';
    foreach ($gantt as $g) {
        $html .= '<div class="gantt-cell"><span class="gantt-pid">P' . e((string)$g['pid']) . '</span>'
               . '<span class="gantt-time">' . e((string)$g['start']) . '</span></div>';
    }
    /* Append final end time */
    $last  = end($gantt);
    $html .= '<div class="gantt-end"><span></span><span class="gantt-time">' . e((string)$last['end']) . '</span></div>';
    $html .= '</div>';

    $html .= '<h3>Results</h3>';
    $html .= '<table><thead><tr>'
           . '<th>PID</th><th>Arrival</th><th>Burst</th>'
           . '<th>Finish</th><th>Waiting</th><th>Turnaround</th>'
           . '</tr></thead><tbody>';
    $totalWT  = 0;
    $totalTAT = 0;
    foreach ($procs as $p) {
        $totalWT  += $p['waiting'];
        $totalTAT += $p['turnaround'];
        $html .= '<tr>'
               . '<td>P' . e((string)$p['pid']) . '</td>'
               . '<td>' . e((string)$p['arrival']) . '</td>'
               . '<td>' . e((string)$p['burst']) . '</td>'
               . '<td>' . e((string)$p['finish']) . '</td>'
               . '<td>' . e((string)$p['waiting']) . '</td>'
               . '<td>' . e((string)$p['turnaround']) . '</td>'
               . '</tr>';
    }
    $n    = count($procs);
    $html .= '</tbody></table>';
    $html .= '<p><strong>Average Waiting Time:</strong> ' . e(number_format($totalWT / $n, 2)) . '</p>';
    $html .= '<p><strong>Average Turnaround Time:</strong> ' . e(number_format($totalTAT / $n, 2)) . '</p>';
    return $html;
}

/* =====================================================================
 * MODULE 2: BANKER'S ALGORITHM
 * ===================================================================== */

/**
 * Run the Banker's safety algorithm.
 *
 * @param  int[][] $allocation  np × nr allocation matrix
 * @param  int[][] $maxMat      np × nr max matrix
 * @param  int[]   $available   nr-element available vector
 * @param  int     $np          Number of processes
 * @param  int     $nr          Number of resource types
 * @return array   ['safe' => bool, 'sequence' => int[], 'need' => int[][]]
 */
function bankers_algorithm(array $allocation, array $maxMat, array $available, int $np, int $nr): array
{
    $need = [];
    for ($i = 0; $i < $np; $i++) {
        $need[$i] = [];
        for ($j = 0; $j < $nr; $j++) {
            $need[$i][$j] = $maxMat[$i][$j] - $allocation[$i][$j];
            if ($need[$i][$j] < 0) {
                return ['safe' => false, 'sequence' => [], 'need' => $need, 'error' => "Allocation exceeds Max for P{$i} R{$j}"];
            }
        }
    }

    $finish   = array_fill(0, $np, false);
    $safeSeq  = [];
    $work     = $available;

    do {
        $changed = false;
        for ($i = 0; $i < $np; $i++) {
            if ($finish[$i]) {
                continue;
            }
            $canRun = true;
            for ($j = 0; $j < $nr; $j++) {
                if ($need[$i][$j] > $work[$j]) {
                    $canRun = false;
                    break;
                }
            }
            if ($canRun) {
                for ($j = 0; $j < $nr; $j++) {
                    $work[$j] += $allocation[$i][$j];
                }
                $finish[$i] = true;
                $safeSeq[]  = $i;
                $changed    = true;
            }
        }
    } while ($changed);

    return [
        'safe'     => (count($safeSeq) === $np),
        'sequence' => $safeSeq,
        'need'     => $need,
    ];
}

/* =====================================================================
 * MODULE 3: PAGE REPLACEMENT
 * ===================================================================== */

/**
 * FIFO page replacement.
 *
 * @param  int[] $pages   Page reference string
 * @param  int   $nf      Number of frames
 * @return array          ['faults' => int, 'trace' => array[]]
 */
function page_fifo(array $pages, int $nf): array
{
    $frames = array_fill(0, $nf, -1);
    $ptr    = 0;
    $faults = 0;
    $trace  = [];

    foreach ($pages as $page) {
        $hit = in_array($page, $frames, true);
        if (!$hit) {
            $frames[$ptr] = $page;
            $ptr = ($ptr + 1) % $nf;
            $faults++;
        }
        $trace[] = ['page' => $page, 'frames' => $frames, 'fault' => !$hit];
    }
    return ['faults' => $faults, 'trace' => $trace];
}

/**
 * LRU page replacement.
 *
 * @param  int[] $pages
 * @param  int   $nf
 * @return array
 */
function page_lru(array $pages, int $nf): array
{
    $frames   = array_fill(0, $nf, -1);
    $lastUsed = array_fill(0, $nf, -1);
    $faults   = 0;
    $trace    = [];

    foreach ($pages as $idx => $page) {
        $pos = array_search($page, $frames, true);
        $hit = ($pos !== false);
        if (!$hit) {
            /* Find empty frame or LRU frame */
            $replIdx = -1;
            for ($j = 0; $j < $nf; $j++) {
                if ($frames[$j] === -1) {
                    $replIdx = $j;
                    break;
                }
            }
            if ($replIdx === -1) {
                $min     = PHP_INT_MAX;
                for ($j = 0; $j < $nf; $j++) {
                    if ($lastUsed[$j] < $min) {
                        $min     = $lastUsed[$j];
                        $replIdx = $j;
                    }
                }
            }
            $frames[$replIdx]   = $page;
            $lastUsed[$replIdx] = $idx;
            $faults++;
        } else {
            $lastUsed[$pos] = $idx;
        }
        $trace[] = ['page' => $page, 'frames' => $frames, 'fault' => !$hit];
    }
    return ['faults' => $faults, 'trace' => $trace];
}

/** Render page replacement trace as an HTML table. */
function render_page_result(array $result, int $nf): string
{
    $html  = '<table><thead><tr><th>Page</th>';
    for ($j = 1; $j <= $nf; $j++) {
        $html .= '<th>F' . $j . '</th>';
    }
    $html .= '<th>Fault</th></tr></thead><tbody>';

    foreach ($result['trace'] as $row) {
        $html .= '<tr><td>' . e((string)$row['page']) . '</td>';
        foreach ($row['frames'] as $f) {
            $html .= '<td>' . ($f === -1 ? '-' : e((string)$f)) . '</td>';
        }
        $html .= '<td>' . ($row['fault'] ? '<span class="fault">✗ FAULT</span>' : '✓') . '</td></tr>';
    }
    $html .= '</tbody></table>';
    $html .= '<p><strong>Total Page Faults: ' . e((string)$result['faults']) . '</strong></p>';
    return $html;
}

/* =====================================================================
 * MODULE 4: DISK SCHEDULING
 * ===================================================================== */

/**
 * FCFS disk scheduling.
 *
 * @param  int[] $requests
 * @param  int   $head
 * @return array  ['total' => int, 'sequence' => int[]]
 */
function disk_fcfs(array $requests, int $head): array
{
    $total = 0;
    $cur   = $head;
    $seq   = [$head];
    foreach ($requests as $req) {
        $total += abs($req - $cur);
        $cur    = $req;
        $seq[]  = $cur;
    }
    return ['total' => $total, 'sequence' => $seq];
}

/**
 * SSTF disk scheduling.
 *
 * @param  int[] $requests
 * @param  int   $head
 * @return array
 */
function disk_sstf(array $requests, int $head): array
{
    $total   = 0;
    $cur     = $head;
    $served  = array_fill(0, count($requests), false);
    $seq     = [$head];
    $n       = count($requests);

    for ($count = 0; $count < $n; $count++) {
        $minDist = PHP_INT_MAX;
        $idx     = -1;
        foreach ($requests as $j => $req) {
            if (!$served[$j] && abs($req - $cur) < $minDist) {
                $minDist = abs($req - $cur);
                $idx     = $j;
            }
        }
        $served[$idx] = true;
        $total       += $minDist;
        $cur          = $requests[$idx];
        $seq[]        = $cur;
    }
    return ['total' => $total, 'sequence' => $seq];
}

/* =====================================================================
 * MODULE 5: FILE ALLOCATION (SEQUENTIAL, SESSION-BACKED)
 * ===================================================================== */

define('FS_MAX_BLOCKS', 100);
define('FS_MAX_FILES',  20);

/** Initialise (or reset) the in-memory file system stored in the session. */
function fs_init(): void
{
    $_SESSION['fs'] = [
        'files'  => [],
        'blocks' => array_fill(0, FS_MAX_BLOCKS, 0),
    ];
}

/** Return reference to the session file system (initialised if absent). */
function &fs(): array
{
    if (!isset($_SESSION['fs'])) {
        fs_init();
    }
    return $_SESSION['fs'];
}

/**
 * Create a file using sequential (contiguous) allocation.
 *
 * @param  string $name   File name (max 29 chars)
 * @param  int    $size   Number of blocks required
 * @return string         Result message
 */
function fs_create(string $name, int $size): string
{
    $name = substr(trim($name), 0, 29);
    if ($name === '') {
        return 'Error: File name cannot be empty.';
    }
    if ($size <= 0 || $size > FS_MAX_BLOCKS) {
        return 'Error: Invalid block count.';
    }

    $fsRef = &fs();

    /* Check duplicate */
    foreach ($fsRef['files'] as $f) {
        if ($f['name'] === $name) {
            return "Error: File '{$name}' already exists.";
        }
    }
    if (count($fsRef['files']) >= FS_MAX_FILES) {
        return 'Error: File table full.';
    }

    /* Find contiguous free blocks */
    $start = -1;
    for ($i = 0; $i <= FS_MAX_BLOCKS - $size; $i++) {
        $ok = true;
        for ($j = $i; $j < $i + $size; $j++) {
            if ($fsRef['blocks'][$j]) {
                $ok = false;
                break;
            }
        }
        if ($ok) {
            $start = $i;
            break;
        }
    }
    if ($start === -1) {
        return 'Error: Not enough contiguous disk space.';
    }

    for ($i = $start; $i < $start + $size; $i++) {
        $fsRef['blocks'][$i] = 1;
    }
    $fsRef['files'][] = ['name' => $name, 'start' => $start, 'size' => $size];
    return "File '{$name}' created: blocks {$start}–" . ($start + $size - 1) . '.';
}

/**
 * Delete a file by name.
 *
 * @param  string $name
 * @return string
 */
function fs_delete(string $name): string
{
    $name  = trim($name);
    $fsRef = &fs();

    foreach ($fsRef['files'] as $k => $f) {
        if ($f['name'] === $name) {
            for ($i = $f['start']; $i < $f['start'] + $f['size']; $i++) {
                $fsRef['blocks'][$i] = 0;
            }
            array_splice($fsRef['files'], $k, 1);
            return "File '{$name}' deleted.";
        }
    }
    return "Error: File '{$name}' not found.";
}

/* =====================================================================
 * REQUEST ROUTING
 * ===================================================================== */

$module = isset($_POST['module']) ? (string)$_POST['module'] : '';
$output = '';
$error  = '';

switch ($module) {
    /* ----------------------------------------------------------------
     * CPU Scheduling
     * -------------------------------------------------------------- */
    case 'cpu':
        $n       = post_int('n', 1, 20);
        $algo    = isset($_POST['algo']) ? (string)$_POST['algo'] : '';
        $quantum = post_int('quantum', 1);

        if ($n === null) {
            $error = 'Invalid number of processes.';
            break;
        }

        $arrStr = isset($_POST['arrivals']) ? (string)$_POST['arrivals'] : '';
        $burStr = isset($_POST['bursts'])   ? (string)$_POST['bursts']   : '';

        $arrivals = parse_int_array($arrStr);
        $bursts   = parse_int_array($burStr);

        if ($arrivals === null || count($arrivals) !== $n) {
            $error = "Please provide exactly {$n} arrival time(s).";
            break;
        }
        if ($bursts === null || count($bursts) !== $n) {
            $error = "Please provide exactly {$n} burst time(s).";
            break;
        }
        foreach ($arrivals as $a) {
            if ($a < 0) { $error = 'Arrival times must be >= 0.'; break 2; }
        }
        foreach ($bursts as $b) {
            if ($b <= 0) { $error = 'Burst times must be > 0.'; break 2; }
        }

        $procs = cpu_build_processes($arrivals, $bursts);

        switch ($algo) {
            case 'fcfs':
                $result  = cpu_fcfs($procs);
                $output  = '<h2>CPU Scheduling – FCFS</h2>' . render_cpu_result($result);
                break;
            case 'sjf':
                $result  = cpu_sjf($procs);
                $output  = '<h2>CPU Scheduling – SJF (Non-preemptive)</h2>' . render_cpu_result($result);
                break;
            case 'rr':
                if ($quantum === null) {
                    $error = 'Invalid time quantum.';
                    break 2;
                }
                $result  = cpu_rr($procs, $quantum);
                $output  = '<h2>CPU Scheduling – Round Robin (Quantum=' . e((string)$quantum) . ')</h2>'
                         . render_cpu_result($result);
                break;
            default:
                $error = 'Unknown algorithm selected.';
        }
        break;

    /* ----------------------------------------------------------------
     * Banker's Algorithm
     * -------------------------------------------------------------- */
    case 'bankers':
        $np = post_int('np', 1, 10);
        $nr = post_int('nr', 1, 10);

        if ($np === null || $nr === null) {
            $error = 'Invalid number of processes or resources.';
            break;
        }

        $allocStr = isset($_POST['allocation']) ? (string)$_POST['allocation'] : '';
        $maxStr   = isset($_POST['max'])        ? (string)$_POST['max']        : '';
        $avStr    = isset($_POST['available'])  ? (string)$_POST['available']  : '';

        $allocFlat = parse_int_array($allocStr);
        $maxFlat   = parse_int_array($maxStr);
        $available = parse_int_array($avStr);

        if ($allocFlat === null || count($allocFlat) !== $np * $nr) {
            $error = "Allocation matrix must have exactly {$np}×{$nr}=" . ($np * $nr) . ' values.';
            break;
        }
        if ($maxFlat === null || count($maxFlat) !== $np * $nr) {
            $error = "Max matrix must have exactly {$np}×{$nr}=" . ($np * $nr) . ' values.';
            break;
        }
        if ($available === null || count($available) !== $nr) {
            $error = "Available vector must have exactly {$nr} values.";
            break;
        }

        /* Reshape flat arrays into 2-D */
        $allocation = [];
        $maxMat     = [];
        for ($i = 0; $i < $np; $i++) {
            $allocation[$i] = array_slice($allocFlat, $i * $nr, $nr);
            $maxMat[$i]     = array_slice($maxFlat,   $i * $nr, $nr);
        }

        $res = bankers_algorithm($allocation, $maxMat, $available, $np, $nr);

        $output = '<h2>Banker\'s Algorithm</h2>';

        /* Display Need matrix */
        $output .= '<h3>Need Matrix</h3><table><thead><tr><th>Process</th>';
        for ($j = 0; $j < $nr; $j++) {
            $output .= '<th>R' . $j . '</th>';
        }
        $output .= '</tr></thead><tbody>';
        for ($i = 0; $i < $np; $i++) {
            $output .= '<tr><td>P' . $i . '</td>';
            for ($j = 0; $j < $nr; $j++) {
                $output .= '<td>' . e((string)$res['need'][$i][$j]) . '</td>';
            }
            $output .= '</tr>';
        }
        $output .= '</tbody></table>';

        if (isset($res['error'])) {
            $output .= '<p class="error">' . e($res['error']) . '</p>';
        } elseif ($res['safe']) {
            $seqStr  = implode(' → ', array_map(fn($p) => 'P' . $p, $res['sequence']));
            $output .= '<p class="safe"><strong>System is in a SAFE STATE.</strong></p>';
            $output .= '<p>Safe Sequence: ' . e($seqStr) . '</p>';
        } else {
            $output .= '<p class="unsafe"><strong>System is in an UNSAFE STATE (Deadlock may occur).</strong></p>';
        }
        break;

    /* ----------------------------------------------------------------
     * Page Replacement
     * -------------------------------------------------------------- */
    case 'page':
        $nf    = post_int('nf', 1, 10);
        $algo  = isset($_POST['algo']) ? (string)$_POST['algo'] : '';
        $pgStr = isset($_POST['pages']) ? (string)$_POST['pages'] : '';

        if ($nf === null) {
            $error = 'Invalid number of frames.';
            break;
        }

        $pages = parse_int_array($pgStr);
        if ($pages === null || count($pages) < 1 || count($pages) > 50) {
            $error = 'Please provide between 1 and 50 page references (non-negative integers).';
            break;
        }
        foreach ($pages as $pg) {
            if ($pg < 0) { $error = 'Page numbers must be >= 0.'; break 2; }
        }

        switch ($algo) {
            case 'fifo':
                $result  = page_fifo($pages, $nf);
                $output  = '<h2>Page Replacement – FIFO</h2>' . render_page_result($result, $nf);
                break;
            case 'lru':
                $result  = page_lru($pages, $nf);
                $output  = '<h2>Page Replacement – LRU</h2>' . render_page_result($result, $nf);
                break;
            default:
                $error = 'Unknown algorithm.';
        }
        break;

    /* ----------------------------------------------------------------
     * Disk Scheduling
     * -------------------------------------------------------------- */
    case 'disk':
        $head  = post_int('head', 0);
        $algo  = isset($_POST['algo']) ? (string)$_POST['algo'] : '';
        $rqStr = isset($_POST['requests']) ? (string)$_POST['requests'] : '';

        if ($head === null) {
            $error = 'Invalid head position.';
            break;
        }

        $requests = parse_int_array($rqStr);
        if ($requests === null || count($requests) < 1 || count($requests) > 20) {
            $error = 'Please provide between 1 and 20 disk requests (non-negative integers).';
            break;
        }
        foreach ($requests as $r) {
            if ($r < 0) { $error = 'Disk requests must be >= 0.'; break 2; }
        }

        switch ($algo) {
            case 'fcfs':
                $result = disk_fcfs($requests, $head);
                $label  = 'FCFS';
                break;
            case 'sstf':
                $result = disk_sstf($requests, $head);
                $label  = 'SSTF';
                break;
            default:
                $error = 'Unknown algorithm.';
                break 2;
        }

        $seqStr  = implode(' → ', array_map('strval', $result['sequence']));
        $output  = '<h2>Disk Scheduling – ' . e($label) . '</h2>';
        $output .= '<p><strong>Head Movement:</strong> ' . e($seqStr) . '</p>';
        $output .= '<p><strong>Total Head Movement:</strong> ' . e((string)$result['total']) . ' cylinders</p>';
        break;

    /* ----------------------------------------------------------------
     * File Allocation
     * -------------------------------------------------------------- */
    case 'fs_create':
        $fname = isset($_POST['fname']) ? (string)$_POST['fname'] : '';
        $fsize = post_int('fsize', 1, FS_MAX_BLOCKS);
        if ($fsize === null) {
            $error = 'Invalid block count.';
            break;
        }
        $msg    = fs_create($fname, $fsize);
        $output = '<p>' . e($msg) . '</p>';
        break;

    case 'fs_delete':
        $fname  = isset($_POST['fname']) ? (string)$_POST['fname'] : '';
        $msg    = fs_delete($fname);
        $output = '<p>' . e($msg) . '</p>';
        break;

    case 'fs_reset':
        fs_init();
        $output = '<p>File system reset.</p>';
        break;
}

/* Build file allocation display */
$fsDisplay = '';
$fsRef     = &fs();
if (!empty($fsRef['files'])) {
    $fsDisplay .= '<table><thead><tr>'
                . '<th>File Name</th><th>Start Block</th><th>Blocks</th><th>End Block</th>'
                . '</tr></thead><tbody>';
    foreach ($fsRef['files'] as $f) {
        $fsDisplay .= '<tr>'
                    . '<td>' . e($f['name']) . '</td>'
                    . '<td>' . e((string)$f['start']) . '</td>'
                    . '<td>' . e((string)$f['size']) . '</td>'
                    . '<td>' . e((string)($f['start'] + $f['size'] - 1)) . '</td>'
                    . '</tr>';
    }
    $fsDisplay .= '</tbody></table>';
} else {
    $fsDisplay = '<p><em>No files allocated.</em></p>';
}

/* Disk block bitmap (first 40 blocks) */
$bitmap = '';
for ($i = 0; $i < 40; $i++) {
    $used    = $fsRef['blocks'][$i] ? 1 : 0;
    $cls     = $used ? 'block-used' : 'block-free';
    $bitmap .= '<span class="' . $cls . '" title="Block ' . $i . '">' . $i . '</span>';
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>All-in-One OS Simulator</title>
<style>
  /* ── Reset & Base ─────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    min-height: 100vh;
  }

  /* ── Layout ────────────────────────────────────────────────────── */
  header {
    background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
    padding: 1.5rem 2rem;
    text-align: center;
  }
  header h1 { font-size: 1.75rem; letter-spacing: 0.05em; }
  header p  { opacity: .75; margin-top: .25rem; font-size: .9rem; }

  .container { display: flex; gap: 1.5rem; padding: 1.5rem; }

  /* ── Sidebar ────────────────────────────────────────────────────── */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
  }
  .sidebar button {
    display: block;
    width: 100%;
    margin-bottom: .5rem;
    padding: .65rem 1rem;
    border: none;
    border-radius: .5rem;
    background: #1e293b;
    color: #e2e8f0;
    text-align: left;
    cursor: pointer;
    font-size: .9rem;
    transition: background .2s;
  }
  .sidebar button:hover, .sidebar button.active { background: #3b82f6; }

  /* ── Main panel ─────────────────────────────────────────────────── */
  .panel {
    flex: 1;
    background: #1e293b;
    border-radius: .75rem;
    padding: 1.5rem;
    min-height: 60vh;
  }
  .module-section { display: none; }
  .module-section.visible { display: block; }

  /* ── Forms ──────────────────────────────────────────────────────── */
  fieldset {
    border: 1px solid #334155;
    border-radius: .5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  legend { padding: 0 .5rem; color: #94a3b8; font-size: .85rem; }
  label  { display: block; margin-bottom: .3rem; font-size: .85rem; color: #94a3b8; }
  input[type=text], input[type=number], select {
    width: 100%;
    padding: .45rem .75rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: .375rem;
    color: #e2e8f0;
    font-size: .9rem;
    margin-bottom: .75rem;
  }
  input[type=number] { width: auto; min-width: 90px; }
  button[type=submit] {
    padding: .5rem 1.5rem;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: .5rem;
    cursor: pointer;
    font-size: .9rem;
    font-weight: 600;
    transition: background .2s;
  }
  button[type=submit]:hover { background: #2563eb; }

  /* ── Output area ────────────────────────────────────────────────── */
  .output {
    margin-top: 1.5rem;
    padding: 1rem;
    background: #0f172a;
    border-radius: .5rem;
    font-size: .9rem;
  }
  .output h2 { font-size: 1.1rem; margin-bottom: .75rem; color: #7dd3fc; }
  .output h3 { font-size: .95rem; margin: .75rem 0 .5rem; color: #94a3b8; }
  .output table {
    border-collapse: collapse;
    width: 100%;
    font-size: .85rem;
    margin-bottom: .75rem;
  }
  .output th, .output td {
    border: 1px solid #334155;
    padding: .4rem .65rem;
    text-align: center;
  }
  .output th { background: #1e293b; color: #7dd3fc; }
  .output p  { margin: .35rem 0; }

  /* ── Gantt chart ─────────────────────────────────────────────────── */
  .gantt { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 0; margin-bottom: .75rem; }
  .gantt-cell, .gantt-end {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 52px;
  }
  .gantt-pid {
    background: #1d4ed8;
    border: 1px solid #3b82f6;
    padding: .3rem .5rem;
    font-weight: 600;
    font-size: .8rem;
    width: 100%;
    text-align: center;
  }
  .gantt-time {
    font-size: .7rem;
    color: #94a3b8;
    align-self: flex-start;
    margin-top: 2px;
  }
  .gantt-end .gantt-time { align-self: flex-end; }

  /* ── Page fault indicator ────────────────────────────────────────── */
  .fault { color: #f87171; font-weight: 600; }

  /* ── Banker status ───────────────────────────────────────────────── */
  .safe   { color: #4ade80; }
  .unsafe { color: #f87171; }

  /* ── Error message ───────────────────────────────────────────────── */
  .error-box {
    background: #450a0a;
    border: 1px solid #dc2626;
    color: #fca5a5;
    border-radius: .5rem;
    padding: .75rem 1rem;
    margin-bottom: 1rem;
  }
  p.error { color: #f87171; }

  /* ── Disk block map ──────────────────────────────────────────────── */
  .block-map { display: flex; flex-wrap: wrap; gap: 4px; margin-top: .5rem; }
  .block-free, .block-used {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    font-size: .65rem;
    font-weight: 700;
  }
  .block-free { background: #1e293b; border: 1px solid #334155; color: #64748b; }
  .block-used { background: #1d4ed8; border: 1px solid #3b82f6; color: #fff; }
</style>
</head>
<body>

<header>
  <h1>⚙ All-in-One Operating System Simulator</h1>
  <p>CPU Scheduling · Banker's Algorithm · Page Replacement · Disk Scheduling · File Allocation</p>
</header>

<div class="container">
  <!-- ── Sidebar navigation ── -->
  <nav class="sidebar">
    <button onclick="showModule('cpu')"     class="active" id="btn-cpu">1. CPU Scheduling</button>
    <button onclick="showModule('bankers')" id="btn-bankers">2. Banker's Algorithm</button>
    <button onclick="showModule('page')"    id="btn-page">3. Page Replacement</button>
    <button onclick="showModule('disk')"    id="btn-disk">4. Disk Scheduling</button>
    <button onclick="showModule('fs')"      id="btn-fs">5. File Allocation</button>
  </nav>

  <!-- ── Main panel ── -->
  <main class="panel">

    <?php if ($error): ?>
    <div class="error-box"><?= e($error) ?></div>
    <?php endif; ?>

    <!-- ============================================================
         MODULE 1: CPU SCHEDULING
         ============================================================ -->
    <section class="module-section visible" id="sec-cpu">
      <h2 style="margin-bottom:1rem;">CPU Scheduling</h2>

      <form method="POST">
        <input type="hidden" name="module" value="cpu">
        <fieldset>
          <legend>Process Input</legend>
          <label>Number of Processes
            <input type="number" name="n" min="1" max="20"
                   value="<?= e((string)(post_int('n', 1, 20) ?? 3)) ?>">
          </label>
          <label>Arrival Times (space-separated)
            <input type="text" name="arrivals"
                   placeholder="e.g. 0 2 4"
                   value="<?= e(isset($_POST['arrivals']) ? (string)$_POST['arrivals'] : '') ?>">
          </label>
          <label>Burst Times (space-separated)
            <input type="text" name="bursts"
                   placeholder="e.g. 5 3 8"
                   value="<?= e(isset($_POST['bursts']) ? (string)$_POST['bursts'] : '') ?>">
          </label>
        </fieldset>
        <fieldset>
          <legend>Algorithm</legend>
          <?php $cpuAlgo = isset($_POST['algo']) && $module === 'cpu' ? (string)$_POST['algo'] : 'fcfs'; ?>
          <label>
            <input type="radio" name="algo" value="fcfs" <?= $cpuAlgo === 'fcfs' ? 'checked' : '' ?>>
            FCFS
          </label>
          <label>
            <input type="radio" name="algo" value="sjf" <?= $cpuAlgo === 'sjf' ? 'checked' : '' ?>>
            SJF (Non-preemptive)
          </label>
          <label>
            <input type="radio" name="algo" value="rr" <?= $cpuAlgo === 'rr' ? 'checked' : '' ?>>
            Round Robin – Time Quantum:
            <input type="number" name="quantum" min="1"
                   value="<?= e((string)(post_int('quantum', 1) ?? 2)) ?>"
                   style="width:70px;display:inline;">
          </label>
        </fieldset>
        <button type="submit">Run</button>
      </form>

      <?php if ($module === 'cpu' && $output): ?>
      <div class="output"><?= $output ?></div>
      <?php endif; ?>
    </section>

    <!-- ============================================================
         MODULE 2: BANKER'S ALGORITHM
         ============================================================ -->
    <section class="module-section" id="sec-bankers">
      <h2 style="margin-bottom:1rem;">Banker's Algorithm (Deadlock Avoidance)</h2>

      <form method="POST">
        <input type="hidden" name="module" value="bankers">
        <fieldset>
          <legend>System Parameters</legend>
          <label>Number of Processes (max 10)
            <input type="number" name="np" min="1" max="10"
                   value="<?= e((string)(($module === 'bankers' ? post_int('np', 1, 10) : null) ?? 3)) ?>">
          </label>
          <label>Number of Resource Types (max 10)
            <input type="number" name="nr" min="1" max="10"
                   value="<?= e((string)(($module === 'bankers' ? post_int('nr', 1, 10) : null) ?? 3)) ?>">
          </label>
        </fieldset>
        <fieldset>
          <legend>Matrices (row-major, space-separated)</legend>
          <label>Allocation Matrix (np × nr values)
            <input type="text" name="allocation"
                   placeholder="e.g. 0 1 0  2 0 0  3 0 2"
                   value="<?= e(isset($_POST['allocation']) && $module === 'bankers' ? (string)$_POST['allocation'] : '') ?>">
          </label>
          <label>Max Matrix (np × nr values)
            <input type="text" name="max"
                   placeholder="e.g. 7 5 3  3 2 2  9 0 2"
                   value="<?= e(isset($_POST['max']) && $module === 'bankers' ? (string)$_POST['max'] : '') ?>">
          </label>
          <label>Available Resources (nr values)
            <input type="text" name="available"
                   placeholder="e.g. 3 3 2"
                   value="<?= e(isset($_POST['available']) && $module === 'bankers' ? (string)$_POST['available'] : '') ?>">
          </label>
        </fieldset>
        <button type="submit">Check Safety</button>
      </form>

      <?php if ($module === 'bankers' && $output): ?>
      <div class="output"><?= $output ?></div>
      <?php endif; ?>
    </section>

    <!-- ============================================================
         MODULE 3: PAGE REPLACEMENT
         ============================================================ -->
    <section class="module-section" id="sec-page">
      <h2 style="margin-bottom:1rem;">Page Replacement (Memory Management)</h2>

      <form method="POST">
        <input type="hidden" name="module" value="page">
        <fieldset>
          <legend>Parameters</legend>
          <label>Number of Frames (1–10)
            <input type="number" name="nf" min="1" max="10"
                   value="<?= e((string)(($module === 'page' ? post_int('nf', 1, 10) : null) ?? 3)) ?>">
          </label>
          <label>Page Reference String (space-separated, max 50 pages)
            <input type="text" name="pages"
                   placeholder="e.g. 7 0 1 2 0 3 0 4 2 3"
                   value="<?= e(isset($_POST['pages']) && $module === 'page' ? (string)$_POST['pages'] : '') ?>">
          </label>
        </fieldset>
        <fieldset>
          <legend>Algorithm</legend>
          <?php $pgAlgo = isset($_POST['algo']) && $module === 'page' ? (string)$_POST['algo'] : 'fifo'; ?>
          <label><input type="radio" name="algo" value="fifo" <?= $pgAlgo === 'fifo' ? 'checked' : '' ?>> FIFO</label>
          <label><input type="radio" name="algo" value="lru"  <?= $pgAlgo === 'lru'  ? 'checked' : '' ?>> LRU</label>
        </fieldset>
        <button type="submit">Simulate</button>
      </form>

      <?php if ($module === 'page' && $output): ?>
      <div class="output"><?= $output ?></div>
      <?php endif; ?>
    </section>

    <!-- ============================================================
         MODULE 4: DISK SCHEDULING
         ============================================================ -->
    <section class="module-section" id="sec-disk">
      <h2 style="margin-bottom:1rem;">Disk Scheduling</h2>

      <form method="POST">
        <input type="hidden" name="module" value="disk">
        <fieldset>
          <legend>Parameters</legend>
          <label>Disk Requests (space-separated, max 20)
            <input type="text" name="requests"
                   placeholder="e.g. 98 183 37 122 14 124 65 67"
                   value="<?= e(isset($_POST['requests']) && $module === 'disk' ? (string)$_POST['requests'] : '') ?>">
          </label>
          <label>Initial Head Position
            <input type="number" name="head" min="0"
                   value="<?= e((string)(($module === 'disk' ? post_int('head', 0) : null) ?? 53)) ?>">
          </label>
        </fieldset>
        <fieldset>
          <legend>Algorithm</legend>
          <?php $dkAlgo = isset($_POST['algo']) && $module === 'disk' ? (string)$_POST['algo'] : 'fcfs'; ?>
          <label><input type="radio" name="algo" value="fcfs" <?= $dkAlgo === 'fcfs' ? 'checked' : '' ?>> FCFS</label>
          <label><input type="radio" name="algo" value="sstf" <?= $dkAlgo === 'sstf' ? 'checked' : '' ?>> SSTF</label>
        </fieldset>
        <button type="submit">Simulate</button>
      </form>

      <?php if ($module === 'disk' && $output): ?>
      <div class="output"><?= $output ?></div>
      <?php endif; ?>
    </section>

    <!-- ============================================================
         MODULE 5: FILE ALLOCATION (SEQUENTIAL)
         ============================================================ -->
    <section class="module-section" id="sec-fs">
      <h2 style="margin-bottom:1rem;">File Allocation (Sequential)</h2>

      <!-- Create file -->
      <form method="POST" style="display:inline-block;margin-right:1rem;vertical-align:top;">
        <input type="hidden" name="module" value="fs_create">
        <fieldset>
          <legend>Create File</legend>
          <label>File Name <input type="text" name="fname" placeholder="report.txt" style="width:160px;display:inline;"></label>
          <label>Blocks Required <input type="number" name="fsize" min="1" max="100" value="4" style="width:70px;display:inline;"></label>
          <button type="submit">Create</button>
        </fieldset>
      </form>

      <!-- Delete file -->
      <form method="POST" style="display:inline-block;margin-right:1rem;vertical-align:top;">
        <input type="hidden" name="module" value="fs_delete">
        <fieldset>
          <legend>Delete File</legend>
          <label>File Name <input type="text" name="fname" placeholder="report.txt" style="width:160px;display:inline;"></label>
          <button type="submit">Delete</button>
        </fieldset>
      </form>

      <!-- Reset -->
      <form method="POST" style="display:inline-block;vertical-align:top;">
        <input type="hidden" name="module" value="fs_reset">
        <fieldset>
          <legend>Actions</legend>
          <button type="submit">Reset File System</button>
        </fieldset>
      </form>

      <?php if (in_array($module, ['fs_create', 'fs_delete', 'fs_reset'], true) && $output): ?>
      <div class="output"><?= $output ?></div>
      <?php endif; ?>

      <!-- File allocation table -->
      <div class="output" style="margin-top:1rem;">
        <h3>Allocated Files</h3>
        <?= $fsDisplay ?>
        <h3>Disk Block Map (blocks 0–39)</h3>
        <div class="block-map"><?= $bitmap ?></div>
        <p style="margin-top:.5rem;font-size:.75rem;color:#64748b;">
          <span style="background:#1d4ed8;padding:1px 6px;border-radius:3px;">■</span> Used &nbsp;
          <span style="background:#1e293b;border:1px solid #334155;padding:1px 6px;border-radius:3px;">□</span> Free
        </p>
      </div>
    </section>

  </main>
</div>

<script>
/* Map module name → section/button IDs */
const modules = ['cpu', 'bankers', 'page', 'disk', 'fs'];

function showModule(name) {
  modules.forEach(m => {
    const sec = document.getElementById('sec-' + m);
    const btn = document.getElementById('btn-' + m);
    if (sec) sec.classList.toggle('visible', m === name);
    if (btn) btn.classList.toggle('active', m === name);
  });
}

/* On page load, show the section that was last submitted (if any) */
(function () {
  const active = <?= json_encode(
      in_array($module, ['cpu', 'bankers', 'page', 'disk'])
          ? $module
          : (in_array($module, ['fs_create', 'fs_delete', 'fs_reset']) ? 'fs' : 'cpu')
  ) ?>;
  showModule(active);
})();
</script>

</body>
</html>
