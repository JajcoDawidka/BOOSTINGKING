<?php
header('Content-Type: application/json');

// Ustawienia CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}

// Sprawdzenie, czy ciasteczko auth_token istnieje
if (!isset($_COOKIE['auth_token'])) {
    http_response_code(401);
    echo json_encode(['valid' => false, 'message' => 'Brak tokenu']);
    exit;
}

$token = $_COOKIE['auth_token'];

// Walidacja formatu tokenu
// Sprawdza, czy token jest 64-znakowym ciągiem szesnastkowym
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    echo json_encode(['valid' => false, 'message' => 'Nieprawidłowy format tokenu']);
    exit;
}

require_once 'db.php'; // Zakładamy, że ten plik prawidłowo inicjuje $pdo

// --- ZMIANA TUTAJ: Dodano 'email' do zapytania SELECT ---
// Upewnij się, że kolumna 'email' istnieje w Twojej tabeli 'users' w bazie danych.
$stmt = $pdo->prepare('SELECT id, username, email, role FROM users WHERE token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Jeśli użytkownik z danym tokenem został znaleziony
if ($user) {
    echo json_encode([
        'valid' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'], // --- ZMIANA TUTAJ: Dodano pole 'email' do odpowiedzi JSON ---
            'role' => $user['role'],
            // Jeśli masz kolumnę 'avatar' w bazie danych i chcesz ją wysyłać,
            // dodaj ją do SELECT oraz tutaj, np.: 'avatar' => $user['avatar']
        ]
    ]);
} else {
    // Token nie pasuje do żadnego użytkownika w bazie danych
    http_response_code(401);
    echo json_encode(['valid' => false, 'message' => 'Token nieważny lub użytkownik nie istnieje']);
}
?>