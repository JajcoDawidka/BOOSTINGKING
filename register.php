<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); // Na potrzeby dev
header("Access-Control-Allow-Headers: Content-Type");

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['username'], $input['email'], $input['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

$username = htmlspecialchars(trim($input['username']));
$email = htmlspecialchars(trim($input['email']));
$password = $input['password'];

// Tu połączenie do bazy
$conn = new mysqli('localhost', 'root', '', 'boostingking');
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed']);
    exit;
}

// Sprawdź czy email już istnieje
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['message' => 'Email already registered']);
    exit;
}
$stmt->close();

// Hashuj hasło
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$role = 'user'; // Domyślna rola

// Wstaw nowego użytkownika
$stmt = $conn->prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param('ssss', $username, $email, $hashedPassword, $role);

if ($stmt->execute()) {
    echo json_encode(['message' => 'User registered successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Registration failed']);
}
?>
