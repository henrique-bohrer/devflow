<?php
// api/tasks.php
session_start();
header('Content-Type: application/json');

// Se o usuário não estiver logado, interrompe a execução
if (!isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['success' => false, 'message' => 'Acesso não autorizado.']);
    exit;
}

require 'db.php';

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Busca todas as tarefas do usuário logado
        $stmt = $pdo->prepare("SELECT id, text, done FROM tasks WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $tasks = $stmt->fetchAll();
        // Converte 'done' de 0/1 para boolean
        foreach ($tasks as &$task) {
            $task['done'] = (bool)$task['done'];
        }
        echo json_encode($tasks);
        break;

    case 'POST':
        // Adiciona uma nova tarefa
        $data = json_decode(file_get_contents('php://input'), true);
        $text = $data['text'] ?? '';

        if (!empty($text)) {
            $stmt = $pdo->prepare("INSERT INTO tasks (user_id, text, done) VALUES (?, ?, 0)");
            $stmt->execute([$user_id, $text]);
            $new_task_id = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $new_task_id, 'text' => $text, 'done' => false]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'O texto da tarefa não pode ser vazio.']);
        }
        break;

    case 'PUT':
        // Atualiza o status de uma tarefa (marcar como feita/não feita)
        $data = json_decode(file_get_contents('php://input'), true);
        $task_id = $data['id'] ?? 0;
        $done = isset($data['done']) ? (int)$data['done'] : 0;

        $stmt = $pdo->prepare("UPDATE tasks SET done = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$done, $task_id, $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        // Deleta uma tarefa
        $task_id = $_GET['id'] ?? 0;

        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$task_id, $user_id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405); // Method Not Allowed
        echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
        break;
}
?>