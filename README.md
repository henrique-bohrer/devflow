DevFlow Pomodoro
Uma ferramenta de produtividade elegante e minimalista, projetada para ajudar desenvolvedores e estudantes a manter o foco e gerenciar suas tarefas utilizando a técnica Pomodoro. O projeto combina um timer personalizável com uma rádio Lo-Fi integrada e um sistema de gerenciamento de tarefas com salvamento na nuvem.

✨ Funcionalidades Principais
Timer Pomodoro Completo:

Modos de Trabalho: Alterne entre os ciclos de Foco, Pausa Curta e Descanso Longo.

Ciclos Predefinidos: Escolha entre diferentes configurações de tempo (Padrão, Intenso, Longo) através de um seletor animado.

Controles Intuitivos: Inicie, pause e resete os ciclos com facilidade.

Lista de Tarefas Inteligente:

Login de Usuário: Crie uma conta e faça login para que suas tarefas sejam salvas de forma segura no banco de dados.

Modo Convidado: Se preferir não criar uma conta, as tarefas são salvas localmente no seu navegador (localStorage).

Gerenciamento Completo: Adicione, marque como concluída e delete tarefas em um painel lateral elegante.

Experiência Imersiva:

Rádio Lo-Fi Integrada: Uma estação de rádio contínua para ajudar na concentração, com controle de volume inteligente que se ajusta ao modo do timer.

Notificações Sonoras: Alertas sonoros customizados para o fim dos ciclos de foco e pausa, além de um pré-aviso 10 segundos antes do término.

Interface Moderna: Um design escuro, com animações suaves e foco total na experiência do usuário.

🚀 Tecnologias Utilizadas
Frontend:

HTML5

CSS3 (com Tailwind CSS para estilização rápida)

JavaScript (ES6+)

Backend:

PHP 8+

MySQL (utilizado através do XAMPP)

Ferramentas:

Font Awesome (para ícones)

Google Fonts (fonte "Inter")

⚙️ Configuração do Ambiente Local
Para rodar este projeto em sua máquina local, você precisará de um ambiente de servidor que suporte PHP e MySQL. A forma mais fácil de conseguir isso é com o XAMPP.

Pré-requisitos
XAMPP instalado (que inclui Apache, MySQL e PHP).

Um editor de código como o Visual Studio Code.

Passo a Passo da Instalação
Clone o Repositório:

git clone https://github.com/seu-usuario/devflow-pomodoro.git

Ou simplesmente baixe e extraia os arquivos do projeto.

Mova os Arquivos:

Mova a pasta inteira do projeto para dentro do diretório htdocs da sua instalação do XAMPP. (Ex: C:/xampp/htdocs/devflow-pomodoro)

Inicie o XAMPP:

Abra o painel de controle do XAMPP e inicie os módulos Apache e MySQL.

Crie o Banco de Dados:

Clique no botão "Admin" na linha do MySQL para abrir o phpMyAdmin.

Clique na aba "SQL".

Copie e cole o código do arquivo database_setup.sql (disponível no repositório) e clique em "Executar". Isso irá criar o banco de dados devflow_pomodoro e as tabelas users e tasks.

Acesse o Projeto:

Abra seu navegador e acesse: http://localhost/devflow-pomodoro/

O projeto agora deve estar funcionando completamente em sua máquina local!

📁 Estrutura de Arquivos
/
|-- api/
|   |-- db.php             # Configuração da conexão com o banco de dados
|   |-- auth.php           # Lógica de registro, login e sessão
|   |-- tasks.php          # API para gerenciar as tarefas (CRUD)
|-- css/
|   |-- all.min.css        # Biblioteca Font Awesome
|-- webfonts/
|   |-- ...                # Fontes do Font Awesome
|-- index.html             # Estrutura principal da aplicação
|-- script.js              # Toda a lógica do frontend
|-- style.css              # Estilos personalizados e animações
|-- short-alarm-clock.mp3  # Som de alarme para o fim do foco
|-- tic-tac.mp3            # Som de aviso e de fim de pausa
|-- README.md              # Este arquivo

📄 Licença
Este projeto é de código aberto e está disponível para uso e modificação.
