# DevFlow Pomodoro IA  Productivity App

![DevFlow Pomodoro IA](https://placehold.co/600x300/7c3aed/ffffff?text=DevFlow+Pomodoro+IA)
*Substitua o link acima por um screenshot real do seu aplicativo, se desejar.*

DevFlow Pomodoro IA é uma aplicação web front-end projetada para aumentar a produtividade de desenvolvedores e qualquer pessoa que busque foco em suas tarefas. Combinando a técnica Pomodoro com um assistente de IA integrado e um reprodutor de música local, este aplicativo visa criar um ambiente de trabalho otimizado e agradável.

## ✨ Funcionalidades Principais

* **🍅 Temporizador Pomodoro:**
    * Modos configuráveis de Foco, Pausa Curta e Pausa Longa.
    * Contador de ciclos de foco completados.
    * Notificações sonoras ao final de cada ciclo.
    * Configurações de duração personalizáveis e salvas no `localStorage`.
* **🧠 Assistente de IA (Google Gemini):**
    * Chat interativo para ajudar com dúvidas de código, explicar conceitos, dar dicas, etc.
    * Interface de chat simples e intuitiva.
    * *Requer configuração de uma chave de API do Google Gemini.*
* **🎵 Reprodutor de Música Local:**
    * Barra lateral com controles de reprodução (play/pause, próxima, anterior).
    * Controle de volume e barra de progresso da música.
    * Lista de músicas estática definida diretamente no código HTML (fácil de personalizar).
* **🎨 Tema Dinâmico:**
    * Alternância entre modo Claro (Light) e Escuro (Dark).
    * Preferência de tema salva no `localStorage`.
* **📱 Design Responsivo:**
    * Interface adaptável para visualização em desktops, tablets e dispositivos móveis.
* **🛠️ Construído com Tecnologias Modernas:**
    * HTML5 semântico.
    * Tailwind CSS para estilização rápida e moderna.
    * JavaScript puro (Vanilla JS) para toda a lógica interativa.

## 🚀 Tecnologias Utilizadas

* **HTML5**
* **CSS3**
    * **Tailwind CSS v3**
* **JavaScript (ES6+)**
* **Google Gemini API** (para o Assistente de IA)

## 🔧 Como Usar e Configurar

Este é um projeto puramente front-end (HTML, CSS, JavaScript) e não requer um backend complexo para suas funcionalidades principais (exceto para a API do Gemini).

1.  **Clonar ou Baixar o Projeto:**
    ```bash
    # Se estiver usando Git
    git clone https://github.com/henrique-bohrer/devflow.git
    cd devflow
    ```
    Ou simplesmente baixe os arquivos HTML.

2.  **Abrir o Arquivo Principal:**
    * Abra o arquivo `devflow.html` (ou o nome que você deu ao arquivo principal) em qualquer navegador web moderno.
    * **Importante:** Para que o assistente de IA funcione, você precisará de uma conexão com a internet.

3.  **Configurar o Reprodutor de Música:**
    * Crie uma pasta chamada `musicas` no mesmo diretório que o seu arquivo `devflow.html`.
    * Coloque seus arquivos de música (MP3, WAV, OGG) dentro desta pasta `musicas`.
    * Abra o arquivo `devflow.html` em um editor de texto/código e localize o array `userMusicTracks` dentro da tag `<script>`:
        ```javascript
        const userMusicTracks = [
          { name: "Lofi Chill (Exemplo)", src: "musicas/lofi_chill.mp3" },
          // ... outras músicas de exemplo
        ];
        ```
    * Edite este array para refletir suas músicas. Por exemplo:
        ```javascript
        const userMusicTracks = [
          { name: "Minha Música de Foco", src: "musicas/minha_musica_foco.mp3" },
          { name: "Trilha Sonora para Codar", src: "musicas/trilha_codar.wav" }
        ];
        ```
    * Salve o arquivo HTML. O reprodutor de música agora usará sua lista.

4.  **Configurar o Assistente de IA (Google Gemini):**
    * Você precisará de uma chave de API do Google Gemini.
        * Obtenha sua chave em [Google AI Studio](https://aistudio.google.com/).
    * No arquivo `devflow.html`, localize a função `handleAISubmit` dentro da tag `<script>`.
    * Encontre a linha:
        ```javascript
        const apiKey = ""; // DEIXE EM BRANCO PARA O SISTEMA INJETAR A CHAVE
        ```
    * **Para uso local e testes, se o sistema de injeção de chave não estiver disponível no seu ambiente:**
        Substitua a string vazia pela sua chave de API real:
        ```javascript
        const apiKey = "SUA_CHAVE_DE_API_DO_GEMINI_AQUI";
        ```
    * **Importante:** Nunca envie sua chave de API para repositórios públicos se estiver usando Git. Para projetos em produção, a chave de API deve ser gerenciada por um backend.

## 🎶 Usando o Reprodutor de Música

* O reprodutor de música está localizado na barra lateral esquerda (em telas maiores) ou abaixo do conteúdo principal (em telas menores).
* Use os botões para tocar/pausar, ir para a música anterior ou próxima.
* Ajuste o volume usando o controle deslizante de volume.
* A barra de progresso mostra o tempo atual e total da música e permite avançar ou retroceder.

## 🤖 Usando o Assistente de IA

* O painel do Assistente de IA está localizado à direita da seção Pomodoro (em telas maiores) ou abaixo dela (em telas menores).
* Digite sua pergunta ou comando na caixa de texto (ex: "explique o que é uma Promise em JavaScript", "me dê um exemplo de loop for em Python", "como centralizar uma div com CSS?").
* Pressione Enter ou clique no botão de enviar.
* Aguarde a resposta da IA. Uma mensagem "Pensando..." será exibida durante o processamento.

## 🛠️ Estrutura do Projeto (Simplificada)


seu-projeto/
├── devflow.html       # Arquivo principal da aplicação
└── musicas/           # Pasta para seus arquivos de áudio
├── musica1.mp3
└── outra_musica.wav


## 💡 Possíveis Melhorias Futuras

* [ ] Integração com APIs de música (Spotify, YouTube Music) para streaming.
* [ ] Sistema de login para salvar preferências e histórico de Pomodoro na nuvem.
* [ ] Lista de tarefas (To-Do List) integrada.
* [ ] Opção para os usuários fazerem upload de suas próprias músicas diretamente pela interface (requer backend).
* [ ] Temas visuais adicionais.
* [ ] Internacionalização (suporte a múltiplos idiomas).

## 📄 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes (se você adicionar um).
Recomendado: Crie um arquivo `LICENSE` na raiz do seu projeto com o texto da licença MIT: [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)

---

Desenvolvido com ❤️ e ☕ por [Henrique/henrique-bohrer]
