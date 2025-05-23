/* Requires */
const fs = require('fs');
const path = require('path');
const gtts = require('@killovsky/gtts');
const cleverbot = require('cleverbot-free');
const simsimi = require('chats-simsimi');
const gpt4all = require('../../Scripts/IAs/Chatbots/gpt4all');
const transformers = require('../../Scripts/IAs/Chatbots/gpt4all');

/* Importa módulos, ajuste o local conforme onde usar esse sistema */
const Indexer = require('../../index');

/* JSON's | Utilidades */
const envInfo = JSON.parse(fs.readFileSync(`${__dirname}/utils.json`));

/**
 * Retorna todos os detalhes do ambiente (`envInfo`).
 *
 * @returns {Object} O objeto `envInfo`, que contém os detalhes do ambiente da execução.
 */
function ambientDetails() {
    /* Retorna a envData */
    return envInfo;
}

/* Cria a função de comando */
async function speakIris(
    kill = envInfo.functions.exec.arguments.kill.value,
    env = envInfo.functions.exec.arguments.env.value,
) {
    /* Define um resultado padrão */
    envInfo.results.value = false;

    /* Define o sucesso */
    envInfo.results.success = false;

    /* Try-Catch para casos de erro */
    try {
        /* Se recebeu tudo corretamente, se der ruim, não fará nada */
        if (typeof kill === 'object' && typeof env === 'object') {
            /* Importa os valores */
            const {
                chatId,
                reply,
                arks,
                command,
                body,
                isOwner,
                argl,
            } = env.value;

            /* Define o alias na envInfo */
            envInfo.alias = env.value.alias;

            /* Menu de ajuda DEV */
            if (arks.includes('--help-dev') && isOwner === true) {
                /* Manda a mensagem de ajuda de dev */
                envInfo.results.value = await kill.sendMessage(chatId, { text: Indexer('sql').languages(region, 'Helper', 'Developer', true, true, envInfo).value }, reply);

                /* Menu de ajuda normal */
            } else if (arks.includes('--help') || argl.length === 0) {
                /* Não inclui informações secretas */
                envInfo.results.value = await kill.sendMessage(chatId, { text: Indexer('sql').languages(region, 'Helper', 'User', true, true, envInfo).value }, reply);

                /* Sistema de conversas */
            } else {
                /* Define a resposta final */
                let sendRes = { text: Indexer('sql').languages(region, 'Typings', 'noSpeak', true, true, env.value).value };
                let isFile = false;

                /* Define o idioma da resposta */
                if (arks.includes('-lang')) {
                    /* Faz o parse */
                    const match = arks.match(/-lang ([a-zA-Z]{2,3}(?:-[a-zA-Z]{2,3})?)(?=\s|$)/);

                    /* Seta o idioma global temporariamente para o escolhido */
                    global.region = match ? match[1] : global.region;
                }

                /* Define se deve buscar por palavras chave */
                let customSearch = ((argl.some((ark) => ['-find', '-cleverbot', '-gpt', '-simsimi'].includes(ark)) || ['gpt', 'tts', 'simsimi', 'cleverbot'].includes(command))
                    ? body.replace(/\s*-\s*(find|gpt|tts|cleverbot|simsimi)\s*/g, ' ').trim()
                    : false
                );

                /* Se tiver busca customizada e usar -lang */
                if (customSearch && arks.includes('-lang')) {
                    /* Remove o -lang da string */
                    customSearch = customSearch.replace(/-lang \w{2,3}(-\w{2,3})?/g, '');
                }

                /* Define uma resposta generica */
                const randomRes = Indexer('bash').liner(1, `${`${path.normalize(irisPath)}/lib/Databases/Utilities/chats.txt`}`, customSearch).value;

                /* Faz via try-catch, assim evita que crashe */
                try {
                    /* Define se fará o request pelo cleverbot */
                    if ((arks.includes('-cleverbot') && command !== 'tts') || command === 'cleverbot') {
                        /* Faz o request */
                        const responseClever = await cleverbot(customSearch);

                        /* Insere na object */
                        sendRes = { text: responseClever };

                        /* Se for simsimi */
                    } else if ((arks.includes('-simsimi') && command !== 'tts') || command === 'simsimi') {
                        /* Faz o request */
                        const responseSimi = await simsimi(customSearch, region);

                        /* Se deu sucesso */
                        if (responseSimi.status === true) {
                            /* Insere na object */
                            sendRes = { text: responseSimi.result };
                        }

                        /* Se for um local GPT */
                    } else if (((arks.includes('-gpt') && command !== 'tts') || command === 'gpt') && config.allowGPT.value === true) {
                        /* Avisa para esperar, pois vai realizar muitas tarefas demoradas */
                        if (config.waitMessage.value) await kill.sendMessage(chatId, { text: Indexer('sql').languages(region, 'Extras', 'Wait', true, true, envInfo).value }, reply);

                        /* Define se vai usar GPT4All */
                        const gptCaller = config.chatName.value === 'gpt4all' ? gpt4all : transformers;

                        /* Se o modelo ainda não foi inicializado */
                        if (gptCaller.config().isOnline === false) {
                            /* Inicializa o modelo */
                            await gptCaller.initialize(config.gptModel.value);
                        }

                        /* Se for para limpar */
                        if (arks.includes('-clear')) {
                            /* Limpa o histórico do modelo */
                            await gptCaller.clear();

                            /* Remove isso do prompt */
                            customSearch = customSearch.replace(/-clear/gi, '');
                        }

                        /* Gera a resposta */
                        const gptText = await gptCaller.generate(JSON.stringify(customSearch));

                        /* Insere na object */
                        sendRes = { text: `${arks.includes('-clear') ? 'Cleaned! ✔️\n\n' : ''}${(gptText.content || gptText.generated_text).replace(/^\s*,*\s*/, '').trim().replace(/^\w/, (c) => c.toUpperCase())}` };
                    }

                    /* Se der erro não faz nada */
                } catch (err) { /* Pois o dialogo já será o padrão */ }

                /* Verifica se há resultados e se o comando não é um dos excluídos */
                if (
                    randomRes.length > 0
                    && !arks.includes('-cleverbot')
                    && !arks.includes('-gpt')
                    && !arks.includes('-simsimi')
                    && !['gpt', 'simsimi', 'cleverbot'].includes(command)
                ) {
                    /* Define o primeiro diálogo do 'liner' */
                    sendRes = { text: randomRes[0] };
                }

                /* Se o comando for de TTS */
                if (command === 'tts') {
                    /* Define a mensagem da pessoa como fala */
                    sendRes = { text: customSearch };
                }

                /* Se for modo áudio */
                if (arks.includes('-tts') || command === 'tts') {
                    /* Cria um buffer */
                    const speakdata = await gtts.create(region, sendRes.text, true, `${path.normalize(`${__dirname}/Cache/`)}`);

                    /* Define o arquivo de saida */
                    const exitFile = `${path.normalize(`${__dirname}/Cache/${Indexer('strings').generate(10)}.mp3`)}`;

                    /* Faz o fix para IOS */
                    const fixedAudio = await Indexer('youtube').fixer(speakdata.gtts.local, exitFile);

                    /* Se não for invalido */
                    if (fixedAudio !== 'dontDownload') {
                        /* Define como envio de áudio */
                        sendRes = { audio: { url: fixedAudio }, mimetype: 'audio/mp4', ptt: true };

                        /* Define como arquivo de audio */
                        isFile = true;

                        /* Se for invalido, usa o Buffer que não lê em IOS mesmo */
                    } else sendRes = { audio: speakdata.gtts.buffer, mimetype: 'audio/mp4', ptt: true };
                }

                /* Envia a resposta */
                envInfo.results.value = await kill.sendMessage(chatId, sendRes, reply);

                /* Se foi áudio */
                if (isFile) {
                    /* Remove o arquivo do disco */
                    Indexer('clear').destroy(sendRes.audio.url);
                }
            }
        }

        /*
            Define o sucesso, se seu comando der erro isso jamais será chamado
            Então o success automaticamente será false em falhas
        */
        envInfo.results.success = true;

        /* Caso de algum erro */
    } catch (error) {
        /* Insere tudo na envInfo */
        logging.echoError(error, envInfo, __dirname);

        /* Avisa que deu erro, manda o erro e data ao sistema S.E.R (Send/Special Error Report) */
        await kill.sendMessage(env.value.chatId, {
            text: Indexer('sql').languages(region, 'S.E.R', error, true, true, {
                command: 'CHAT',
                time: (new Date()).toLocaleString(),
            }).value,
        }, env.value.reply);
    }

    /* Retorna os resultados */
    return logging.postResults(envInfo);
}

/**
 * Restaura o ambiente e atualiza as exportações do módulo com a funcionalidade principal
 * @param {Object} [changeKey={}] - Chaves personalizadas para atualizar o envInfo
 * @param {Object} [envFile=envInfo] - Objeto com informações do ambiente
 * @param {string} [dirname=__dirname] - Caminho do diretório atual
 * @returns {Object} Exportações do módulo com todas as funções configuradas
 */
/* eslint-disable-next-line no-return-assign */
const resetLocal = (
    changeKey = {},
    envFile = envInfo,
    dirname = __dirname,
) => module.exports = logging.resetAmbient({
    functions: {
        [envInfo.exports.env]: { value: ambientDetails },
        [envInfo.exports.messedup]: { value: logging.echoError },
        [envInfo.exports.poswork]: { value: logging.postResults },
        [envInfo.exports.reset]: { value: resetLocal },
        [envInfo.exports.exec]: { value: speakIris },
    },
    parameters: {
        location: { value: __filename },
    },
}, envFile, changeKey, dirname);
resetLocal();
