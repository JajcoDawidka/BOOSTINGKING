<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get and sanitize form data
    $name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
    $email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
    $subject = isset($_POST['subject']) ? strip_tags(trim($_POST['subject'])) : '';
    $message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';

    // Basic validation
    if (empty($name) || empty($email) || empty($subject) || empty($message)) {
        echo "Please fill in all required fields.";
        exit;
    }

    // Prepare Discord webhook message
    $webhookurl = "https://discord.com/api/webhooks/1380875425512689685/_kXrHyCEB6UpvNmDHgV2BjX5Wal2swplFaCyIu8qtluDglGuH1kNLLFcEKsxhI3Uqm8_";

    $content = "**New Contact Form Submission**\n\n";
    $content .= "**Name:** $name\n";
    $content .= "**Email:** $email\n";
    $content .= "**Subject:** $subject\n";
    $content .= "**Message:**\n$message\n";

    $json_data = json_encode([
        "content" => $content
    ]);

    // Send POST to Discord webhook
    $ch = curl_init($webhookurl);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json_data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpcode == 204) {
        echo "Thank you for your message, $name! We will get back to you soon.";
    } else {
        echo "Sorry, there was a problem sending your message. Please try again.";
    }
} else {
    echo "Invalid request.";
}
?>