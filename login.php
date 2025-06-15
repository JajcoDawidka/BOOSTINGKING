<?php
header('Content-Type: application/json');

// Ustawienia CORS - pozostawione bez zmian, są poprawne dla localhost
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}

require 'db.php'; // Upewnij się, że ten plik prawidłowo inicjuje $pdo

$data = json_decode(file_get_contents("php://input"));

// Sprawdzenie, czy otrzymano wymagane dane
if (!isset($data->email, $data->password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Brak wymaganych danych']);
    exit;
}

$email = $data->email;
$password = $data->password;

// Zapytanie do bazy danych o użytkownika
$stmt = $pdo->prepare("SELECT id, username, password, role FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Weryfikacja hasła i ustawienie tokena
if ($user && password_verify($password, $user['password'])) {
    $token = bin2hex(random_bytes(32)); // Generowanie bezpiecznego tokena
    $update = $pdo->prepare("UPDATE users SET token = ? WHERE id = ?");
    $update->execute([$token, $user['id']]);

    // Ustawienie ciasteczka 'auth_token'
    // 'httponly' => true sprawia, że JS NIE MA dostępu do tego ciasteczka, zwiększając bezpieczeństwo.
    // Przeglądarka automatycznie wysyła je z każdym zapytaniem do tego samego origin.
    setcookie('auth_token', $token, [
        'expires' => time() + 86400, // Token ważny przez 24 godziny
        'path' => '/',               // Dostępny dla całej domeny
        'secure' => false,           // Ważne: 'false' dla HTTP na localhost
        'httponly' => true,          // KLUCZOWE: JS nie ma dostępu
        'samesite' => 'Lax'          // Zabezpieczenie przed CSRF
    ]);

    // Odpowiedź JSON - NIE ZAWIERA TOKENA
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]
    ]);
} else {
    // Nieudane logowanie
    http_response_code(401);
    echo json_encode(['error' => 'Nieprawidłowy email lub hasło']);
}
?>