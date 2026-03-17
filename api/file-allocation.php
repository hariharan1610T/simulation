<?php

declare(strict_types=1);

require __DIR__ . '/common.php';

$input = read_json_input();
$action = strtolower((string)($input['action'] ?? 'initialize'));

function make_state(int $totalBlocks): array
{
    return [
        'files' => [],
        'diskBlocks' => array_fill(0, $totalBlocks, null),
        'totalBlocks' => $totalBlocks,
    ];
}

function normalize_state(array $state): array
{
    if (!isset($state['diskBlocks']) || !is_array($state['diskBlocks'])) {
        send_json(['error' => 'state.diskBlocks must be an array'], 400);
    }
    $totalBlocks = isset($state['totalBlocks']) ? (int)$state['totalBlocks'] : count($state['diskBlocks']);
    if ($totalBlocks < 5 || $totalBlocks > 500) {
        send_json(['error' => 'totalBlocks must be between 5 and 500'], 400);
    }
    if (count($state['diskBlocks']) !== $totalBlocks) {
        send_json(['error' => 'state.diskBlocks length must match totalBlocks'], 400);
    }

    return [
        'files' => isset($state['files']) && is_array($state['files']) ? $state['files'] : [],
        'diskBlocks' => $state['diskBlocks'],
        'totalBlocks' => $totalBlocks,
    ];
}

function find_contiguous_space(array $diskBlocks, int $size): ?int
{
    $consecutive = 0;
    $start = -1;
    foreach ($diskBlocks as $i => $block) {
        if ($block === null) {
            if ($consecutive === 0) {
                $start = $i;
            }
            $consecutive++;
            if ($consecutive >= $size) {
                return $start;
            }
        } else {
            $consecutive = 0;
            $start = -1;
        }
    }
    return null;
}

if ($action === 'initialize') {
    $totalBlocks = isset($input['totalBlocks']) ? (int)$input['totalBlocks'] : 20;
    if ($totalBlocks < 5 || $totalBlocks > 500) {
        send_json(['error' => 'totalBlocks must be between 5 and 500'], 400);
    }
    send_json([
        'message' => 'Disk initialized',
        'state' => make_state($totalBlocks),
    ]);
}

$state = normalize_state($input['state'] ?? []);

if ($action === 'create') {
    $fileName = trim((string)($input['fileName'] ?? ''));
    $fileSize = isset($input['fileSize']) ? (int)$input['fileSize'] : 0;
    if ($fileName === '') {
        send_json(['error' => 'fileName is required'], 400);
    }
    if ($fileSize < 1 || $fileSize > $state['totalBlocks']) {
        send_json(['error' => 'fileSize must be between 1 and totalBlocks'], 400);
    }
    foreach ($state['files'] as $file) {
        if (isset($file['name']) && $file['name'] === $fileName) {
            send_json(['error' => 'File name already exists'], 400);
        }
    }

    $startBlock = find_contiguous_space($state['diskBlocks'], $fileSize);
    if ($startBlock === null) {
        send_json(['error' => "Not enough contiguous space for {$fileSize} blocks"], 400);
    }

    $fileId = 'file-' . bin2hex(random_bytes(6));
    $blocks = [];
    for ($i = 0; $i < $fileSize; $i++) {
        $blocks[] = $startBlock + $i;
        $state['diskBlocks'][$startBlock + $i] = $fileId;
    }

    $state['files'][] = [
        'id' => $fileId,
        'name' => $fileName,
        'startBlock' => $startBlock,
        'length' => $fileSize,
        'blocks' => $blocks,
    ];

    send_json([
        'message' => "File {$fileName} created",
        'state' => $state,
    ]);
}

if ($action === 'delete') {
    $fileId = (string)($input['fileId'] ?? '');
    if ($fileId === '') {
        send_json(['error' => 'fileId is required'], 400);
    }
    $found = false;
    foreach ($state['files'] as $file) {
        if (($file['id'] ?? '') === $fileId) {
            $found = true;
            break;
        }
    }
    if (!$found) {
        send_json(['error' => 'File not found'], 404);
    }

    foreach ($state['diskBlocks'] as $i => $block) {
        if ($block === $fileId) {
            $state['diskBlocks'][$i] = null;
        }
    }
    $state['files'] = array_values(array_filter(
        $state['files'],
        fn($file) => ($file['id'] ?? '') !== $fileId
    ));

    send_json([
        'message' => 'File deleted',
        'state' => $state,
    ]);
}

send_json(['error' => 'Invalid action. Use initialize, create, or delete.'], 400);
