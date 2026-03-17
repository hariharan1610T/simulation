<?php

declare(strict_types=1);

require __DIR__ . '/common.php';

$input = read_json_input();
$algorithm = strtoupper((string)($input['algorithm'] ?? ''));
$processes = $input['processes'] ?? null;
$timeQuantum = isset($input['timeQuantum']) ? (int)$input['timeQuantum'] : 1;

if (!in_array($algorithm, ['FCFS', 'SJF', 'RR'], true)) {
    send_json(['error' => 'Invalid algorithm. Use FCFS, SJF, or RR.'], 400);
}
if (!is_array($processes) || count($processes) === 0) {
    send_json(['error' => 'Processes must be a non-empty array'], 400);
}
if ($algorithm === 'RR' && $timeQuantum < 1) {
    send_json(['error' => 'timeQuantum must be at least 1 for RR'], 400);
}

$normalized = [];
foreach ($processes as $idx => $p) {
    if (!is_array($p)) {
        send_json(['error' => "Process at index {$idx} is invalid"], 400);
    }
    $id = trim((string)($p['id'] ?? ''));
    $arrival = isset($p['arrivalTime']) ? (int)$p['arrivalTime'] : -1;
    $burst = isset($p['burstTime']) ? (int)$p['burstTime'] : 0;

    if ($id === '') {
        send_json(['error' => "Process {$idx} is missing id"], 400);
    }
    if ($arrival < 0 || $burst < 1) {
        send_json(['error' => "Process {$id} must have arrivalTime >= 0 and burstTime >= 1"], 400);
    }

    $normalized[] = ['id' => $id, 'arrivalTime' => $arrival, 'burstTime' => $burst];
}

function averages(array $results): array
{
    $count = count($results);
    $sumWT = 0.0;
    $sumTAT = 0.0;
    foreach ($results as $r) {
        $sumWT += $r['waitingTime'];
        $sumTAT += $r['turnaroundTime'];
    }
    return [
        'averageWaitingTime' => $count > 0 ? $sumWT / $count : 0,
        'averageTurnaroundTime' => $count > 0 ? $sumTAT / $count : 0,
    ];
}

function fcfs(array $processes): array
{
    usort($processes, fn($a, $b) => $a['arrivalTime'] <=> $b['arrivalTime']);
    $time = 0;
    $gantt = [];
    $results = [];

    foreach ($processes as $p) {
        if ($time < $p['arrivalTime']) {
            $time = $p['arrivalTime'];
        }
        $start = $time;
        $end = $time + $p['burstTime'];
        $gantt[] = ['processId' => $p['id'], 'startTime' => $start, 'endTime' => $end];
        $tat = $end - $p['arrivalTime'];
        $wt = $tat - $p['burstTime'];
        $results[] = [
            'id' => $p['id'],
            'arrivalTime' => $p['arrivalTime'],
            'burstTime' => $p['burstTime'],
            'completionTime' => $end,
            'waitingTime' => $wt,
            'turnaroundTime' => $tat,
        ];
        $time = $end;
    }

    return ['ganttChart' => $gantt, 'processes' => $results] + averages($results);
}

function sjf(array $processes): array
{
    $remaining = $processes;
    $time = 0;
    $gantt = [];
    $results = [];

    while (count($remaining) > 0) {
        $available = array_values(array_filter($remaining, fn($p) => $p['arrivalTime'] <= $time));
        if (count($available) === 0) {
            $time = min(array_column($remaining, 'arrivalTime'));
            continue;
        }
        usort($available, fn($a, $b) => $a['burstTime'] <=> $b['burstTime']);
        $p = $available[0];
        $start = $time;
        $end = $time + $p['burstTime'];
        $gantt[] = ['processId' => $p['id'], 'startTime' => $start, 'endTime' => $end];
        $tat = $end - $p['arrivalTime'];
        $wt = $tat - $p['burstTime'];
        $results[] = [
            'id' => $p['id'],
            'arrivalTime' => $p['arrivalTime'],
            'burstTime' => $p['burstTime'],
            'completionTime' => $end,
            'waitingTime' => $wt,
            'turnaroundTime' => $tat,
        ];
        $time = $end;
        $remaining = array_values(array_filter($remaining, fn($x) => $x['id'] !== $p['id']));
    }

    return ['ganttChart' => $gantt, 'processes' => $results] + averages($results);
}

function rr(array $processes, int $quantum): array
{
    usort($processes, fn($a, $b) => $a['arrivalTime'] <=> $b['arrivalTime']);
    $queue = [];
    $idx = 0;
    $time = 0;
    $completion = [];
    $gantt = [];

    while ($idx < count($processes) && $processes[$idx]['arrivalTime'] <= $time) {
        $p = $processes[$idx];
        $queue[] = ['process' => $p, 'remainingTime' => $p['burstTime']];
        $idx++;
    }
    if (count($queue) === 0 && $idx < count($processes)) {
        $time = $processes[$idx]['arrivalTime'];
        $p = $processes[$idx];
        $queue[] = ['process' => $p, 'remainingTime' => $p['burstTime']];
        $idx++;
    }

    while (count($queue) > 0) {
        $current = array_shift($queue);
        $exec = min($quantum, $current['remainingTime']);
        $start = $time;
        $end = $time + $exec;
        $gantt[] = ['processId' => $current['process']['id'], 'startTime' => $start, 'endTime' => $end];
        $time = $end;
        $current['remainingTime'] -= $exec;

        while ($idx < count($processes) && $processes[$idx]['arrivalTime'] <= $time) {
            $p = $processes[$idx];
            $queue[] = ['process' => $p, 'remainingTime' => $p['burstTime']];
            $idx++;
        }

        if ($current['remainingTime'] > 0) {
            $queue[] = $current;
        } else {
            $completion[$current['process']['id']] = $time;
        }

        if (count($queue) === 0 && $idx < count($processes)) {
            $time = $processes[$idx]['arrivalTime'];
            $p = $processes[$idx];
            $queue[] = ['process' => $p, 'remainingTime' => $p['burstTime']];
            $idx++;
        }
    }

    $results = [];
    foreach ($processes as $p) {
        $ct = $completion[$p['id']] ?? 0;
        $tat = $ct - $p['arrivalTime'];
        $wt = $tat - $p['burstTime'];
        $results[] = [
            'id' => $p['id'],
            'arrivalTime' => $p['arrivalTime'],
            'burstTime' => $p['burstTime'],
            'completionTime' => $ct,
            'waitingTime' => $wt,
            'turnaroundTime' => $tat,
        ];
    }

    return ['ganttChart' => $gantt, 'processes' => $results] + averages($results);
}

$result = match ($algorithm) {
    'FCFS' => fcfs($normalized),
    'SJF' => sjf($normalized),
    default => rr($normalized, $timeQuantum),
};

send_json($result);
