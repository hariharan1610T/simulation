<?php

declare(strict_types=1);

require __DIR__ . '/common.php';

$input = read_json_input();
$processes = require_int($input, 'processes', 1);
$resources = require_int($input, 'resources', 1);
$allocation = $input['allocation'] ?? null;
$max = $input['max'] ?? null;
$available = $input['available'] ?? null;

if (!is_array($allocation) || !is_array($max) || !is_array($available)) {
    send_json(['error' => 'allocation, max, and available must be arrays'], 400);
}
if (count($available) !== $resources) {
    send_json(['error' => 'available size must match resources'], 400);
}

$need = [];
for ($i = 0; $i < $processes; $i++) {
    if (!isset($allocation[$i], $max[$i]) || !is_array($allocation[$i]) || !is_array($max[$i])) {
        send_json(['error' => "Invalid matrix row for process {$i}"], 400);
    }
    if (count($allocation[$i]) !== $resources || count($max[$i]) !== $resources) {
        send_json(['error' => "Matrix column count mismatch at process {$i}"], 400);
    }
    $need[$i] = [];
    for ($j = 0; $j < $resources; $j++) {
        $alloc = (int)$allocation[$i][$j];
        $mx = (int)$max[$i][$j];
        if ($alloc < 0 || $mx < 0) {
            send_json(['error' => 'Matrix values must be non-negative'], 400);
        }
        if ($mx < $alloc) {
            send_json(['error' => "max must be >= allocation at P{$i}, R{$j}"], 400);
        }
        $need[$i][$j] = $mx - $alloc;
    }
}

$work = array_map(fn($x) => (int)$x, $available);
$finish = array_fill(0, $processes, false);
$safeSequence = [];
$count = 0;

while ($count < $processes) {
    $found = false;
    for ($i = 0; $i < $processes; $i++) {
        if ($finish[$i]) {
            continue;
        }
        $canAllocate = true;
        for ($j = 0; $j < $resources; $j++) {
            if ($need[$i][$j] > $work[$j]) {
                $canAllocate = false;
                break;
            }
        }
        if ($canAllocate) {
            for ($j = 0; $j < $resources; $j++) {
                $work[$j] += (int)$allocation[$i][$j];
            }
            $safeSequence[] = $i;
            $finish[$i] = true;
            $found = true;
            $count++;
        }
    }
    if (!$found) {
        break;
    }
}

$safe = $count === $processes;
send_json([
    'safe' => $safe,
    'safeSequence' => $safe ? $safeSequence : [],
    'need' => $need,
]);
