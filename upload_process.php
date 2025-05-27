<?php
header('Content-Type: application/json');
// Em produção, restrinja a origem: header('Access-Control-Allow-Origin: SEU_DOMINIO');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = ['success' => false, 'message' => 'Ocorreu um erro desconhecido.'];
$uploadDir = __DIR__ . '/musicas/'; // Assume que 'musicas' está no mesmo diretório que este script
$playlistFile = $uploadDir . 'playlist.json';

// Verifica se uploads estão habilitados no PHP
if (!ini_get('file_uploads')) {
  $response['message'] = 'Erro: Uploads de arquivos não estão habilitados no servidor.';
  echo json_encode($response);
  exit;
}
// Verifica se o diretório de upload tem permissão de escrita
if (!is_writable($uploadDir)) {
    $response['message'] = 'Erro: O diretório de upload de músicas não tem permissão de escrita.';
    echo json_encode($response);
    exit;
}


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['musicFile']) && $_FILES['musicFile']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['musicFile']['tmp_name'];
        $fileName = $_FILES['musicFile']['name'];
        $fileSize = $_FILES['musicFile']['size'];
        $fileType = $_FILES['musicFile']['type'];
        $fileNameCmps = explode(".", $fileName);
        $fileExtension = strtolower(end($fileNameCmps));

        // Sanitiza o nome do ficheiro para remover caracteres indesejados e espaços
        $safeFileName = preg_replace("/[^a-zA-Z0-9._-]/", "_", pathinfo($fileName, PATHINFO_FILENAME));
        $newFileName = $safeFileName . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        $allowedFileExtensions = ['wav', 'mp3', 'ogg'];
        if (in_array($fileExtension, $allowedFileExtensions)) {
            // Verifica o tamanho do ficheiro (ex: máximo de 20MB)
            $maxFileSize = 20 * 1024 * 1024; // 20 MB
            if ($fileSize > $maxFileSize) {
                $response['message'] = 'Erro: O ficheiro é muito grande. Máximo de 20MB permitido.';
            } else {
                if (move_uploaded_file($fileTmpPath, $destPath)) {
                    // Ficheiro movido com sucesso, agora atualiza o playlist.json
                    $playlist = [];
                    if (file_exists($playlistFile)) {
                        $jsonContent = file_get_contents($playlistFile);
                        if ($jsonContent === false) {
                             $response['message'] = 'Erro ao ler o ficheiro da playlist existente.';
                             echo json_encode($response);
                             exit;
                        }
                        $playlist = json_decode($jsonContent, true);
                        if (json_last_error() !== JSON_ERROR_NONE && !empty($jsonContent)) {
                            // Se houver erro no JSON e o ficheiro não estiver vazio, não sobrescreva
                            $response['message'] = 'Erro: O ficheiro playlist.json está corrompido. Verifique o ficheiro e tente novamente.';
                            // Considerar não apagar o ficheiro enviado ou mover para uma área de quarentena
                            unlink($destPath); // Remove o ficheiro enviado se a playlist estiver corrompida
                            echo json_encode($response);
                            exit;
                        }
                         if (!is_array($playlist)) { // Garante que é um array, mesmo que o JSON estivesse vazio ou inválido
                            $playlist = [];
                        }
                    }

                    $trackName = isset($_POST['trackName']) && !empty(trim($_POST['trackName'])) ? trim($_POST['trackName']) : pathinfo($newFileName, PATHINFO_FILENAME);
                    // Remove underscores/hífens e capitaliza para o nome de exibição se não fornecido
                    if ($trackName === pathinfo($newFileName, PATHINFO_FILENAME)) {
                        $trackName = ucwords(str_replace(['_', '-'], ' ', $trackName));
                    }

                    // Verifica se a música (pelo nome do ficheiro) já existe na playlist
                    $trackExists = false;
                    foreach ($playlist as $track) {
                        if (isset($track['fileName']) && $track['fileName'] === $newFileName) {
                            $trackExists = true;
                            break;
                        }
                    }

                    if (!$trackExists) {
                        $playlist[] = [
                            "name" => $trackName,
                            "fileName" => $newFileName
                        ];

                        if (file_put_contents($playlistFile, json_encode($playlist, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
                            $response['success'] = true;
                            $response['message'] = 'Música "' . htmlspecialchars($trackName) . '" enviada e adicionada à playlist com sucesso!';
                        } else {
                            $response['message'] = 'Música enviada, mas falha ao atualizar o ficheiro da playlist.';
                            // Considerar apagar o ficheiro enviado se a atualização da playlist falhar
                            // unlink($destPath);
                        }
                    } else {
                        $response['success'] = true; // Considera sucesso pois o ficheiro já existe
                        $response['message'] = 'Música "' . htmlspecialchars($newFileName) . '" já existe na playlist. Ficheiro reenviado/substituído.';
                    }

                } else {
                    $response['message'] = 'Erro ao mover o ficheiro enviado para o destino.';
                }
            }
        } else {
            $response['message'] = 'Erro: Tipo de ficheiro não permitido. Apenas ' . implode(', ', $allowedFileExtensions) . ' são aceites.';
        }
    } else {
        $response['message'] = 'Erro no upload do ficheiro: ';
        switch ($_FILES['musicFile']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $response['message'] .= 'Ficheiro excede o tamanho máximo permitido.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $response['message'] .= 'O upload do ficheiro foi feito parcialmente.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $response['message'] .= 'Nenhum ficheiro foi enviado.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $response['message'] .= 'Pasta temporária em falta.';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $response['message'] .= 'Falha ao escrever ficheiro no disco.';
                break;
            case UPLOAD_ERR_EXTENSION:
                $response['message'] .= 'Uma extensão PHP parou o upload do ficheiro.';
                break;
            default:
                $response['message'] .= 'Erro desconhecido no upload.';
                break;
        }
    }
} else {
    $response['message'] = 'Método de requisição inválido.';
}

echo json_encode($response);
?>