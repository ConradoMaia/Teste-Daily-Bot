
# Daily Bot para Microsoft Teams

Este projeto é um bot para o Microsoft Teams desenhado para automatizar o processo de reuniões diárias (Dailies). O bot contacta proativamente os membros da equipa registados, faz um conjunto de perguntas padrão e posta um resumo formatado num canal de equipa designado.

## Tecnologias Utilizadas

  * **Node.js:** O ambiente de execução para o JavaScript do lado do servidor.
  * **Microsoft Bot Framework SDK v4:** O principal framework utilizado para construir a lógica do bot, gerir o estado da conversa e integrar com os canais da Microsoft, como o Teams.
  * **Restify:** Um framework web leve para Node.js, utilizado para criar o servidor HTTP que recebe as mensagens do Bot Framework Connector.
  * **dotenv:** Um módulo que carrega variáveis de ambiente de um ficheiro `.env` para `process.env`, mantendo as suas credenciais seguras e fora do código-fonte.
  * **node-cron:** Uma biblioteca para agendamento de tarefas, utilizada para acionar o início da daily todos os dias úteis num horário específico.

## Como Utilizar

### Pré-requisitos

1.  **Node.js** (versão 14 ou superior)
2.  **Conta no Microsoft Azure:** Necessária para registar o bot e obter as credenciais.
3.  **ngrok:** Para criar um túnel seguro para o seu bot local durante o desenvolvimento e teste.
4.  **Microsoft Teams:** Onde o bot será utilizado.

### Configuração e Instalação

1.  **Clonar o Repositório:**

    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd <NOME_DA_PASTA>
    ```

2.  **Instalar as Dependências:**

    ```bash
    npm install
    ```

3.  **Criar e Configurar o Ficheiro `.env`:**
    Crie um ficheiro chamado `.env` na raiz do projeto e adicione as seguintes variáveis:

    ```env
    # Credenciais obtidas no Portal do Azure
    MicrosoftAppId="SEU_ID_DA_APLICAÇÃO_MICROSOFT"
    MicrosoftAppPassword="SUA_SENHA_DA_APLICAÇÃO_MICROSOFT"

    # ID do canal do Teams para postar os resumos
    TargetConversationId=""
    ```

### Executar o Bot

1.  **Iniciar o Bot Localmente:**

    ```bash
    node bot.js
    ```

    O terminal deverá mostrar uma mensagem a indicar que o bot está a escutar na porta 3978.

2.  **Expor o Bot com ngrok:**
    Abra um novo terminal e execute:

    ```bash
    ngrok http 3978
    ```

    Copie o URL **HTTPS** fornecido pelo ngrok.

3.  **Configurar o Bot no Azure:**

      * Vá ao seu recurso "Bot do Azure" no Portal do Azure.
      * Em "Configuração", cole o URL do ngrok no campo "Ponto de extremidade de mensagens", adicionando `/api/messages` ao final.
      * Exemplo: `https://seu-codigo-aleatorio.ngrok-free.app/api/messages`

4.  **Instalar e Configurar no Teams:**

      * Siga as instruções para empacotar e instalar o bot numa equipa do Teams utilizando o "Developer Portal".
      * Uma vez instalado, vá para o canal onde deseja que os resumos sejam postados.
      * Mencione o bot e digite `id` para obter o ID do canal:
        `@NomeDoSeuBot id`
      * O bot responderá com o ID. Copie esse valor e cole-o na variável `TargetConversationId` no seu ficheiro `.env`.
      * **Reinicie o seu bot** (`Ctrl + C` e depois `node bot.js`) para que ele carregue a nova configuração.

### Comandos Disponíveis

Os comandos devem ser enviados numa conversa privada com o bot.

  * `cadastrar`: Regista-o para receber a chamada da daily todas as manhãs.
  * `descadastrar`: Remove o seu registo da daily.
  * `sim`: Responde afirmativamente à chamada da daily e inicia o questionário.

Para obter o ID de um canal, mencione o bot no canal desejado com o comando `id`.