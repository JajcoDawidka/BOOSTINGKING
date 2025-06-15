<?php
header('Content-Type: application/json');

if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}

if (!isset($_COOKIE['auth_token'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Brak tokenu']);
    exit;
}

require_once 'db.php';

$token = $_COOKIE['auth_token'];

// Wyzeruj token w bazie
$stmt = $pdo->prepare("UPDATE users SET token = NULL WHERE token = ?");
$stmt->execute([$token]);

// Usuń cookie
setcookie('auth_token', '', [
    'expires' => time() - 3600,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);

echo json_encode(['success' => true, 'message' => 'Wylogowano']);
