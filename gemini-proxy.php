<?php
// gemini-proxy.php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', 'php_errors.log');

// Define que a resposta será em formato JSON
header('Content-Type: application/json');
// Permite requisições do seu site (em desenvolvimento, * é aceitável)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Responde a requisições OPTIONS (pre-flight) que os navegadores enviam
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// ✅ VERIFICAÇÃO DE SEGURANÇA: Checa se a extensão cURL está habilitada no servidor
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'A extensão cURL do PHP não está habilitada no servidor.']]);
    exit;
}



// --- COLE SUA CHAVE DE API AQUI ---
$apiKey = 'AIzaSyAuO4SCG_oKp3mfUT2zluvBosx3kZYNMm4';

// Pega o corpo da requisição enviada pelo JavaScript
$requestBody = file_get_contents('php://input');
if (empty($requestBody)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => ['message' => 'Corpo da requisição vazio.']]);
    exit;
}

// A URL da API do Google Gemini
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

// Prepara e executa a requisição cURL para a API do Google
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Verifica por erros no cURL
if (curl_errno($ch)) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => ['message' => 'Erro interno do servidor: ' . curl_error($ch)]]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Retorna a resposta da API do Google diretamente para o seu front-end
http_response_code($http_code);
echo $response;
?>