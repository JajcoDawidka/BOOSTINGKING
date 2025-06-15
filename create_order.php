<?php
// Włącz raportowanie błędów PHP (TYLKO W ŚRODOWISKU DEWELOPERSKIM)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Ustawienia CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = ['http://localhost', 'http://127.0.0.1'];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization'); // Authorization dodane na wszelki wypadek
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

// Walidacja formatu tokenu (opcjonalnie, ale dobra praktyka)
if (!preg_match('/^[a-f0-9]{64}$/', $token)) { // Zakładamy SHA256 (64 znaki hex)
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format tokenu autoryzacji.']);
    exit;
}

// Dołączenie pliku z połączeniem do bazy danych
require_once 'db.php'; // Zakładamy, że ten plik prawidłowo inicjuje $pdo

// Weryfikacja tokena i pobranie ID użytkownika
try {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE token = ?');
    $stmt->execute([$token]);
    $userId = $stmt->fetchColumn();

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token nieważny lub użytkownik nie istnieje. Zaloguj się ponownie.']);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Błąd bazy danych podczas weryfikacji tokena: ' . $e->getMessage()]);
    error_log('Błąd weryfikacji tokena w create_order.php: ' . $e->getMessage());
    exit;
}

// Pobranie danych z żądania POST (JSON body)
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format danych JSON: ' . json_last_error_msg()]);
    exit;
}

// --- Walidacja danych zamówienia ---
$requiredFields = ['service', 'basePrice', 'firstName', 'lastName', 'email']; // Minimalne pola
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Brak wymaganego pola: " . $field]);
        exit;
    }
}

// Walidacja emaila
if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format adresu e-mail.']);
    exit;
}

// Walidacja cen
$basePrice = floatval($data['basePrice']);
$discount = floatval($data['discount'] ?? 0.00); // Domyślnie 0
$totalPrice = $basePrice - $discount;

if ($basePrice <= 0 || $totalPrice < 0) { // Suma nie może być ujemna
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowe wartości cen.']);
    exit;
}

// Ustawienie wartości null dla opcjonalnych pól, jeśli są puste
$steamLogin = !empty($data['steamLogin']) ? $data['steamLogin'] : null;
$steamPassword = !empty($data['steamPassword']) ? $data['steamPassword'] : null;
$faceitEmail = !empty($data['faceitEmail']) ? $data['faceitEmail'] : null;
$faceitPassword = !empty($data['faceitPassword']) ? $data['faceitPassword'] : null;

// --- Zapis zamówienia do bazy danych ---
try {
    $stmt = $pdo->prepare("
        INSERT INTO orders (
            user_id, service_type, base_price, discount_amount, total_price,
            first_name, last_name, email,
            steam_login, steam_password, faceit_email, faceit_password,
            order_date, status
        ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            NOW(), ?
        )
    ");

    $stmt->execute([
        $userId,
        $data['service'],
        $basePrice,
        $discount,
        $totalPrice,
        $data['firstName'],
        $data['lastName'],
        $data['email'],
        $steamLogin,
        $steamPassword,
        $faceitEmail,
        $faceitPassword,
        'Pending' // Początkowy status zamówienia
    ]);

    // Opcjonalnie: pobierz ID nowo wstawionego zamówienia
    $orderId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Zamówienie zostało złożone pomyślnie!',
        'orderId' => $orderId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Błąd serwera podczas tworzenia zamówienia: ' . $e->getMessage()]);
    error_log('Błąd tworzenia zamówienia w create_order.php: ' . $e->getMessage());
}
?>