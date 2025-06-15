<?php
// send_jobs.php - WERSJA DIAGNOSTYCZNA
header('Content-Type: text/plain');

echo "TEST: Rozpoczęcie skryptu\n";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    echo "TEST: Odebrano POST\n";
    print_r($_POST); // Pokazuje wszystkie otrzymane dane
    
    // Przygotuj dane
    $data = [
        'name' => $_POST['name'] ?? 'Brak',
        'email' => $_POST['email'] ?? 'Brak',
        'discord' => $_POST['discord'] ?? 'Brak',
        'age' => $_POST['age'] ?? 0,
        'faceit_elo' => $_POST['faceit_elo'] ?? 0,
        'region' => $_POST['region'] ?? 'Brak',
        'availability' => $_POST['availability'] ?? 'Brak',
        'profile' => $_POST['profile'] ?? 'Brak',
        'experience' => $_POST['experience'] ?? 'Brak',
        'why' => $_POST['why'] ?? 'Brak'
    ];

    // Przygotuj wiadomość
    $message = "**Nowa aplikacja**\n";
    foreach ($data as $key => $value) {
        $message .= "**".ucfirst($key).":** ".$value."\n";
    }

    // Webhook Discord
    $webhook = "https://discord.com/api/webhooks/1380708387725250670/1aKLKdicYihtLfAr4shJJIovkA7szLeZCCIQFiCAWv3YEJsOoo1u8--IbbmVn8GxW3ia";
    
    echo "\nTEST: Wysyłanie do Discord:\n".$message."\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $webhook);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['content' => $message]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    echo "\nTEST: Odpowiedź Discord:\n";
    echo "HTTP Code: ".$http_code."\n";
    echo "Response: ".$response."\n";
    
    if(curl_error($ch)) {
        echo "CURL Error: ".curl_error($ch)."\n";
    }
    curl_close($ch);
    
    if ($http_code == 204) {
        echo "\nSUKCES: Wiadomość wysłana!";
    } else {
        echo "\nBŁĄD: Nie udało się wysłać";
    }
} else {
    echo "BŁĄD: To nie jest żądanie POST";
}
?>