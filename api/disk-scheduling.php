<?php

declare(strict_types=1);

require __DIR__ . '/common.php';

$input = read_json_input();
$requests = $input['requests'] ?? null;
$head = require_int($input, 'headPosition', 0);
$algorithm = strtoupper((string)($input['algorithm'] ?? ''));
$diskSize = isset($input['diskSize']) ? max(1, (int)$input['diskSize']) : 200;
$direction = strtolower((string)($input['direction'] ?? 'right'));

if (!in_array($algorithm, ['FCFS', 'SSTF', 'SCAN', 'CSCAN'], true)) {
    send_json(['error' => 'Invalid algorithm. Use FCFS, SSTF, SCAN, or CSCAN.'], 400);
}
if (!is_array($requests) || count($requests) === 0) {
    send_json(['error' => 'requests must be a non-empty array'], 400);
}
if ($head > $diskSize - 1) {
    send_json(['error' => "headPosition must be between 0 and " . ($diskSize - 1)], 400);
}
if (!in_array($direction, ['left', 'right'], true)) {
    send_json(['error' => 'direction must be left or right'], 400);
}

$requests = array_map(fn($r) => (int)$r, $requests);
foreach ($requests as $r) {
    if ($r < 0 || $r > $diskSize - 1) {
        send_json(['error' => "All requests must be between 0 and " . ($diskSize - 1)], 400);
    }
}

function movement(array $seekSequence): int
{
    $total = 0;
    for ($i = 1; $i < count($seekSequence); $i++) {
        $total += abs($seekSequence[$i] - $seekSequence[$i - 1]);
    }
    return $total;
}

function fcfs(array $requests, int $head): array
{
    $seek = array_merge([$head], $requests);
    return ['seekSequence' => $seek, 'totalHeadMovement' => movement($seek)];
}

function sstf(array $requests, int $head): array
{
    $remaining = $requests;
    $seek = [$head];
    $current = $head;

    while (count($remaining) > 0) {
        $nearestIdx = 0;
        $minDistance = PHP_INT_MAX;
        foreach ($remaining as $i => $req) {
            $dist = abs($req - $current);
            if ($dist < $minDistance) {
                $minDistance = $dist;
                $nearestIdx = $i;
            }
        }
        $next = $remaining[$nearestIdx];
        $seek[] = $next;
        $current = $next;
        array_splice($remaining, $nearestIdx, 1);
    }

    return ['seekSequence' => $seek, 'totalHeadMovement' => movement($seek)];
}

function scan(array $requests, int $head, int $diskSize, string $direction): array
{
    sort($requests);
    $left = array_values(array_filter($requests, fn($r) => $r < $head));
    $right = array_values(array_filter($requests, fn($r) => $r >= $head));
    $seek = [$head];
    $current = $head;

    if ($direction === 'right') {
        foreach ($right as $r) {
            $seek[] = $r;
            $current = $r;
        }
        if (count($left) > 0) {
            $seek[] = $diskSize - 1;
            for ($i = count($left) - 1; $i >= 0; $i--) {
                $seek[] = $left[$i];
            }
        }
    } else {
        for ($i = count($left) - 1; $i >= 0; $i--) {
            $seek[] = $left[$i];
            $current = $left[$i];
        }
        if (count($right) > 0) {
            $seek[] = 0;
            foreach ($right as $r) {
                $seek[] = $r;
            }
        }
    }

    return ['seekSequence' => $seek, 'totalHeadMovement' => movement($seek)];
}

function cscan(array $requests, int $head, int $diskSize, string $direction): array
{
    sort($requests);
    $left = array_values(array_filter($requests, fn($r) => $r < $head));
    $right = array_values(array_filter($requests, fn($r) => $r >= $head));
    $seek = [$head];

    if ($direction === 'right') {
        foreach ($right as $r) {
            $seek[] = $r;
        }
        if (count($left) > 0) {
            $seek[] = $diskSize - 1;
            $seek[] = 0;
            foreach ($left as $r) {
                $seek[] = $r;
            }
        }
    } else {
        for ($i = count($left) - 1; $i >= 0; $i--) {
            $seek[] = $left[$i];
        }
        if (count($right) > 0) {
            $seek[] = 0;
            $seek[] = $diskSize - 1;
            for ($i = count($right) - 1; $i >= 0; $i--) {
                $seek[] = $right[$i];
            }
        }
    }

    return ['seekSequence' => $seek, 'totalHeadMovement' => movement($seek)];
}

$result = match ($algorithm) {
    'FCFS' => fcfs($requests, $head),
    'SSTF' => sstf($requests, $head),
    'SCAN' => scan($requests, $head, $diskSize, $direction),
    default => cscan($requests, $head, $diskSize, $direction),
};

send_json($result);
