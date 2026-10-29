<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataFile = __DIR__ . '/../data/scores.json';

if (!file_exists($dataFile)) {
    echo json_encode(['status' => 'success', 'scores' => []]);
    exit;
}

$content = file_get_contents($dataFile);
$scores = json_decode($content, true);

if (!is_array($scores)) {
    $scores = [];
}

// Sort highest to lowest
usort($scores, function($a, $b) {
    if ($b['score'] == $a['score']) {
        return strtotime($b['date'] ?? 'now') - strtotime($a['date'] ?? 'now');
    }
    return $b['score'] - $a['score'];
});

// Return top 50
$topScores = array_slice($scores, 0, 50);

echo json_encode([
    'status' => 'success',
    'scores' => $topScores
]);
