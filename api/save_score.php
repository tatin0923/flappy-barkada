<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    $data = $_POST;
}

$name = isset($data['name']) ? trim(strip_tags($data['name'])) : 'Anonymous';
if (empty($name)) {
    $name = 'Anonymous Player';
}
$name = mb_substr($name, 0, 20);

$score = isset($data['score']) ? intval($data['score']) : 0;
$characterId = isset($data['character_id']) ? intval($data['character_id']) : 1;
if ($characterId < 1 || $characterId > 9) {
    $characterId = 1;
}

$dataFile = __DIR__ . '/../data/scores.json';
$scores = [];

if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
        $scores = $decoded;
    }
}

$newEntry = [
    'id' => uniqid('score_', true),
    'name' => $name,
    'character_id' => $characterId,
    'score' => $score,
    'date' => date('Y-m-d H:i:s')
];

$scores[] = $newEntry;

// Sort highest to lowest
usort($scores, function($a, $b) {
    if ($b['score'] == $a['score']) {
        return strtotime($b['date'] ?? 'now') - strtotime($a['date'] ?? 'now');
    }
    return $b['score'] - $a['score'];
});

// Limit to top 100
$scores = array_slice($scores, 0, 100);

file_put_contents($dataFile, json_encode($scores, JSON_PRETTY_PRINT), LOCK_EX);

// Determine rank
$rank = 1;
foreach ($scores as $index => $item) {
    if ($item['id'] === $newEntry['id']) {
        $rank = $index + 1;
        break;
    }
}

echo json_encode([
    'status' => 'success',
    'message' => 'Score saved successfully!',
    'rank' => $rank,
    'entry' => $newEntry
]);
