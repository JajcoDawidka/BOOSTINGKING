<?php

$host = 'localhost';          // 🔁 Zmień na swój host, np. 127.0.0.1
$db   = 'boostingking';        // 🔁 Nazwa twojej bazy danych
$user = 'root';               // 🔁 Nazwa użytkownika MySQL
$pass = '';                   // 🔁 Hasło do MySQL
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // W przypadku błędu połączenia z bazą danych, zawsze zwracaj JSON
    // Upewniamy się, że Content-Type jest ustawiony, nawet jeśli nagłówek jeszcze nie został wysłany przez główny skrypt.
    // To jest kluczowe, aby frontend mógł poprawnie sparsować odpowiedź błędu.
    if (!headers_sent()) { // Sprawdź, czy nagłówki nie zostały już wysłane
        header('Content-Type: application/json', true, 500); // Ustaw kod statusu i typ treści
    } else {
        http_response_code(500); // Jeśli nagłówki już poszły, ustaw tylko kod statusu
    }
    echo json_encode(['success' => false, 'message' => 'Błąd połączenia z bazą danych: ' . $e->getMessage()]);
    // Logowanie błędu do pliku serwera dla debugowania
    error_log('Błąd połączenia z bazą danych w db.php: ' . $e->getMessage());
    exit;
}
?>