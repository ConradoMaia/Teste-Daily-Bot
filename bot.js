require('dotenv').config();
const { BotFrameworkAdapter, TurnContext, MessageFactory } = require('botbuilder');
const restify = require('restify');
const cron = require('node-cron');

const adapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

adapter.onTurnError = async (context, error) => {
    console.error(`\n [onTurnError] erro não tratado: ${error}`);
    await context.sendTraceActivity('OnTurnError Trace', `${error}`, 'https://www.botframework.com/schemas/error', 'TurnError');
    await context.sendActivity('Ocorreu um erro no bot. Tente novamente.');
};

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} a escutar em ${server.url}`);
});

server.post('/api/messages', async (req, res) => {
    await adapter.processActivity(req, res, async (context) => {
        if (context.activity.type === 'message') {
            await handleMessage(context);
        }
    });
});

const conversationStates = {};
const userReferences = {};

async function handleMessage(context) {
    if (context.activity.conversation.conversationType === 'channel') {
        TurnContext.removeRecipientMention(context.activity);
        const text = context.activity.text.trim().toLowerCase();
        if (text === 'id') {
            await context.sendActivity(`O ID deste canal para o seu ficheiro .env é: ${context.activity.conversation.id}`);
            return;
        }
    }

    const userId = context.activity.from.id;
    const text = context.activity.text.trim().toLowerCase();
    const state = conversationStates[userId];

    if (!state) {
        if (text === 'cadastrar') {
            const reference = TurnContext.getConversationReference(context.activity);
            userReferences[userId] = reference;
            await context.sendActivity('Você foi cadastrado para receber a daily! Para remover, digite "descadastrar".');
            console.log(`Utilizador cadastrado: ${context.activity.from.name} (${userId})`);
        } else if (text === 'descadastrar') {
            delete userReferences[userId];
            await context.sendActivity('Você foi removido da daily.');
            console.log(`Utilizador descadastrado: ${userId}`);
        } else if (text === 'sim') {
            await startDailyConversation(context);
        }
        return;
    }

    state.answers.push(context.activity.text);
    state.currentQuestion++;

    if (state.currentQuestion < state.questions.length) {
        await context.sendActivity(state.questions[state.currentQuestion]);
    } else {
        await context.sendActivity('Obrigado pelas suas respostas! A sua daily foi registrada.');
        await postSummary(context, state);
        delete conversationStates[userId];
    }
}

async function startDailyConversation(context) {
    const userId = context.activity.from.id;
    conversationStates[userId] = {
        questions: [
            'O que você fez ontem?',
            'O que você planeia fazer para hoje?',
            'Existe algum impedimento ou bloqueio?'
        ],
        answers: [],
        currentQuestion: 0,
        userName: context.activity.from.name
    };
    await context.sendActivity(conversationStates[userId].questions[0]);
}

async function askUserToStartDaily(userRef) {
    await adapter.continueConversation(userRef, async (turnContext) => {
        await turnContext.sendActivity({
            text: 'Olá! Pronto para a sua daily de hoje?',
            type: 'message',
            suggestedActions: {
                actions: [
                    { type: 'imBack', title: 'Sim', value: 'sim' },
                    { type: 'imBack', title: 'Agora não', value: 'agora não' }
                ],
                to: [userRef.user.id]
            }
        });
    });
}

async function postSummary(context, state) {
    const targetConversationId = process.env.TargetConversationId;
    if (!targetConversationId) {
        console.error("ERRO: A variável 'TargetConversationId' não está definida no .env");
        await context.sendActivity("Não consegui postar o resumo porque o canal de destino não foi configurado.");
        return;
    }

    const summaryText = `
**Atualização da Daily Stand-up para ${state.userName}**

**Progresso do dia anterior:**
* ${state.answers[0].replace(/\n/g, '\n* ')}

**Planos para hoje:**
* ${state.answers[1].replace(/\n/g, '\n* ')}

**🔥 Bloqueios?**
* ${state.answers[2].replace(/\n/g, '\n* ')}
    `;

    const message = MessageFactory.text(summaryText);
    const conversationReference = TurnContext.getConversationReference(context.activity);
    conversationReference.conversation.id = targetConversationId;

    await adapter.continueConversation(conversationReference, async (turnContext) => {
        await turnContext.sendActivity(message);
    });
    console.log(`Resumo de ${state.userName} postado no canal.`);
}

cron.schedule('0 8 * * 1-5', () => {
    console.log('Iniciando rodada de dailies...');
    if (Object.keys(userReferences).length === 0) {
        console.log("Nenhum utilizador cadastrado para a daily.");
        return;
    }
    Object.values(userReferences).forEach(ref => {
        askUserToStartDaily(ref).catch(err => console.error(`Falha ao iniciar daily para ${ref.user.name}: ${err}`));
    });
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
});

console.log('Daily Bot iniciado e a aguardar interações.');
console.log('O agendador da daily está configurado para 8h00 de Seg-Sex (Fuso: America/Sao_Paulo).');
