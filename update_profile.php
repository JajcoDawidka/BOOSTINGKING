<?php
header('Content-Type: application/json');

// Ustawienia CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: POST, OPTIONS'); // Ważne dla POST
        header('Access-Control-Allow-Headers: Content-Type'); // Ważne dla application/json
    }
}

// Obsługa preflight request dla CORS (jeśli przeglądarka wysyła OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Sprawdzenie, czy ciasteczko auth_token istnieje
if (!isset($_COOKIE['auth_token'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Brak tokena autoryzacji. Zaloguj się ponownie.']);
    exit;
}

$token = $_COOKIE['auth_token'];

// Walidacja formatu tokenu
if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format tokenu autoryzacji.']);
    exit;
}

require_once 'db.php'; // Zakładamy, że ten plik prawidłowo inicjuje $pdo

// 1. Weryfikacja tokena i pobranie danych aktualnego użytkownika
$stmt = $pdo->prepare('SELECT id, username, email, role, currency FROM users WHERE token = ?');
$stmt->execute([$token]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Token nieważny lub użytkownik nie istnieje. Zaloguj się ponownie.']);
    exit;
}

// 2. Pobranie danych z żądania POST (JSON body)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format danych JSON.']);
    exit;
}

// 3. Walidacja i aktualizacja danych
$newUsername = $data['username'] ?? $user['username'];
$newEmail = $user['email']; // Email ZAWSZE bierzemy z danych użytkownika z bazy
$newCurrency = $data['currency'] ?? $user['currency'];

// Podstawowa walidacja dla username (możesz ją rozbudować)
if (empty($newUsername) || strlen($newUsername) < 3) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nazwa użytkownika musi mieć co najmniej 3 znaki.']);
    exit;
}

// Sprawdź, czy nowa nazwa użytkownika nie jest już używana przez innego użytkownika (jeśli zmieniono username)
if ($newUsername !== $user['username']) {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? AND id != ?');
    $stmt->execute([$newUsername, $user['id']]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'Ta nazwa użytkownika jest już zajęta.']);
        exit;
    }
}

// 4. Aktualizacja bazy danych
try {
    $stmt = $pdo->prepare('UPDATE users SET username = ?, email = ?, currency = ? WHERE id = ?');
    $stmt->execute([$newUsername, $newEmail, $newCurrency, $user['id']]);

    // 5. Zwrócenie zaktualizowanych danych użytkownika
    // WAŻNE: ZAPYTANIE SELECT PONIŻEJ RÓWNIEŻ MUSI BYĆ BEZ KOLUMNY 'AVATAR'!
    $stmt = $pdo->prepare('SELECT id, username, email, role, currency FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'message' => 'Ustawienia profilu zostały zaktualizowane.',
        'user' => $updatedUser // Zwróć zaktualizowany obiekt użytkownika
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Błąd serwera podczas aktualizacji: ' . $e->getMessage()]);
    error_log('Błąd aktualizacji profilu: ' . $e->getMessage());
}
?>