<?php
// api/db.php

// --- Configurações do Banco de Dados para XAMPP ---
$host = 'localhost';      // O servidor do banco de dados (geralmente localhost)
$dbname = 'devflow_pomodoro'; // O nome do banco de dados que criamos
$username = 'root';           // O usuário padrão do XAMPP
$password = '';               // A senha padrão do XAMPP é vazia

// String de Conexão (DSN - Data Source Name)
$dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";

try {
    // Cria uma nova instância de PDO para se conectar ao banco de dados MySQL
    $pdo = new PDO($dsn, $username, $password);

    // Define atributos para garantir um comportamento consistente e seguro
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Lança exceções em caso de erro
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Retorna resultados como arrays associativos
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // Usa prepares nativos para mais segurança

} catch (PDOException $e) {
    // Se a conexão falhar, envia uma resposta de erro clara em JSON
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Falha na conexão com o banco de dados: ' . $e->getMessage()]);
    exit();
}
?>