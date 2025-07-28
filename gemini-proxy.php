<?php
// gemini-proxy.php

// -------------------------------------------------------------------
// COLE SUA CHAVE DE API DO GOOGLE GEMINI AQUI
// Esta chave NUNCA será exposta ao usuário.
// -------------------------------------------------------------------
$apiKey = "AIzaSyDHwUnsYyBcMy-T06guPHYsW_Yr_ngjubQ";


// --- Lógica do Proxy (não precisa alterar daqui para baixo) ---

// Define que a resposta será em formato JSON
header('Content-Type: application/json');

// Somente permite requisições do tipo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => ['message' => 'Método não permitido. Use POST.']]);
    exit;
}

// Pega o corpo da requisição enviada pelo JavaScript
$requestBody = file_get_contents('php://input');
if (empty($requestBody)) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => ['message' => 'Corpo da requisição vazio.']]);
    exit;
}

// A URL da API do Google Gemini
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" . $apiKey;

// Prepara a requisição cURL para a API do Google
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true); // Importante para segurança em produção

// Executa a requisição
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Verifica por erros no cURL
if (curl_errno($ch)) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['error' => ['message' => 'Erro interno do servidor ao contatar a API: ' . curl_error($ch)]]);
    curl_close($ch);
    exit;
}

curl_close($ch);

// Retorna a resposta da API do Google diretamente para o seu front-end
http_response_code($http_code);
echo $response;
?>