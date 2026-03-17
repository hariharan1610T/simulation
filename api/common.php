<?php

declare(strict_types=1);

function send_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json_input(): array
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        send_json(['error' => 'Only POST method is allowed'], 405);
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        send_json(['error' => 'Request body is required'], 400);
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        send_json(['error' => 'Invalid JSON body'], 400);
    }

    return $data;
}

function require_int(array $data, string $key, int $min = PHP_INT_MIN): int
{
    if (!array_key_exists($key, $data)) {
        send_json(['error' => "Missing required field: {$key}"], 400);
    }
    if (!is_numeric($data[$key])) {
        send_json(['error' => "Field {$key} must be a number"], 400);
    }

    $value = (int)$data[$key];
    if ($value < $min) {
        send_json(['error' => "Field {$key} must be >= {$min}"], 400);
    }

    return $value;
}
