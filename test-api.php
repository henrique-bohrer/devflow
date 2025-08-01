<?php
// test-api.php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "=== TESTE DA API GEMINI ===<br>";

$apiKey = 'AIzaSyAuO4SCG_oKp3mfUT2zluvBosx3kZYNMm4';
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

$data = json_encode([
    'contents' => [
        ['parts' => [['text' => 'Hello']]]
    ]
]);

echo "URL: " . $apiUrl . "<br>";
echo "Dados: " . $data . "<br><br>";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Desabilita verificação SSL temporariamente

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

echo "HTTP Code: " . $http_code . "<br>";
echo "Erro cURL: " . ($error ? $error : "Nenhum") . "<br>";
echo "Resposta: <pre>" . $response . "</pre>";

curl_close($ch);
?>