<?php

declare(strict_types=1);

require __DIR__ . '/common.php';

$input = read_json_input();
$frames = require_int($input, 'frames', 1);
$pages = $input['pageString'] ?? null;
$algorithm = strtoupper((string)($input['algorithm'] ?? ''));

if (!in_array($algorithm, ['FIFO', 'LRU'], true)) {
    send_json(['error' => 'Invalid algorithm. Use FIFO or LRU.'], 400);
}
if (!is_array($pages) || count($pages) === 0) {
    send_json(['error' => 'pageString must be a non-empty array'], 400);
}

$pages = array_map(fn($p) => (int)$p, $pages);
foreach ($pages as $p) {
    if ($p < 0) {
        send_json(['error' => 'Page numbers must be non-negative'], 400);
    }
}

function fifo(int $numFrames, array $pages): array
{
    $frameStates = [];
    $faultIndices = [];
    $queue = [];
    $faults = 0;

    foreach ($pages as $i => $page) {
        $current = array_fill(0, $numFrames, null);
        if (!in_array($page, $queue, true)) {
            $faults++;
            $faultIndices[] = $i;
            if (count($queue) < $numFrames) {
                $queue[] = $page;
            } else {
                array_shift($queue);
                $queue[] = $page;
            }
        }
        foreach ($queue as $idx => $val) {
            $current[$idx] = $val;
        }
        $frameStates[] = $current;
    }

    return [
        'frameStates' => $frameStates,
        'pageFaults' => $faults,
        'hitRatio' => (count($pages) - $faults) / count($pages),
        'faultIndices' => $faultIndices,
    ];
}

function lru(int $numFrames, array $pages): array
{
    $frameStates = [];
    $faultIndices = [];
    $frames = [];
    $recentUse = [];
    $faults = 0;

    foreach ($pages as $i => $page) {
        $current = array_fill(0, $numFrames, null);
        if (!in_array($page, $frames, true)) {
            $faults++;
            $faultIndices[] = $i;
            if (count($frames) < $numFrames) {
                $frames[] = $page;
            } else {
                $lruPage = $frames[0];
                $minUse = $recentUse[$lruPage] ?? -1;
                foreach ($frames as $f) {
                    $lastUse = $recentUse[$f] ?? -1;
                    if ($lastUse < $minUse) {
                        $minUse = $lastUse;
                        $lruPage = $f;
                    }
                }
                $replaceIdx = array_search($lruPage, $frames, true);
                if ($replaceIdx !== false) {
                    $frames[$replaceIdx] = $page;
                }
            }
        }

        $recentUse[$page] = $i;
        foreach ($frames as $idx => $val) {
            $current[$idx] = $val;
        }
        $frameStates[] = $current;
    }

    return [
        'frameStates' => $frameStates,
        'pageFaults' => $faults,
        'hitRatio' => (count($pages) - $faults) / count($pages),
        'faultIndices' => $faultIndices,
    ];
}

$result = $algorithm === 'FIFO' ? fifo($frames, $pages) : lru($frames, $pages);
send_json($result);
