<?php
// api/auth.php
session_start();
header('Content-Type: application/json');

// Inclui o arquivo de conexão com o banco de dados
require 'db.php';

// Pega o corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);
$action = $_POST['action'] ?? $data['action'] ?? ''; // ✅ CORREÇÃO: Aceita dados de formulário e JSON

switch ($action) {
    case 'register':
        $username = $_POST['username'] ?? $data['username'] ?? '';
        $password = $_POST['password'] ?? $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Usuário e senha são obrigatórios.']);
            exit;
        }

        // Verifica se o usuário já existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Este nome de usuário já está em uso.']);
            exit;
        }

        // Cria o hash da senha
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        // Insere o novo usuário no banco de dados
        $stmt = $pdo->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
        if ($stmt->execute([$username, $password_hash])) {
            echo json_encode(['success' => true, 'message' => 'Usuário registrado com sucesso.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Erro ao registrar usuário.']);
        }
        break;

    case 'login':
        $username = $_POST['username'] ?? $data['username'] ?? '';
        $password = $_POST['password'] ?? $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Usuário e senha são obrigatórios.']);
            exit;
        }

        // Busca o usuário no banco de dados
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // Verifica a senha
        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => true, 'message' => 'Login bem-sucedido.', 'username' => $user['username']]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuário ou senha inválidos.']);
        }
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logout bem-sucedido.']);
        break;

    case 'check_session':
        if (isset($_SESSION['user_id'])) {
            echo json_encode(['loggedIn' => true, 'username' => $_SESSION['username']]);
        } else {
            echo json_encode(['loggedIn' => false]);
        }
        break;

    default:
        http_response_code(400); // Bad Request
        echo json_encode(['success' => false, 'message' => 'Ação inválida ou não fornecida.']);
        break;
}
?>