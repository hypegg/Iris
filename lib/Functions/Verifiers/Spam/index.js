/* eslint-disable max-len */

/* Requires */
const fs = require('fs');
const Indexer = require('../../../index');

/* JSON's | Utilidades */
const envInfo = JSON.parse(fs.readFileSync(`${__dirname}/utils.json`));
const spamInfo = {
    file: {},
    command: {},
};

/**
 * Retorna todos os detalhes do ambiente (`envInfo`).
 *
 * @returns {Object} O objeto `envInfo`, que contém os detalhes do ambiente da execução.
 */
function ambientDetails() {
    /* Retorna a envData */
    return envInfo;
}

/* Configura o antispam */
async function spamInfomer(
    kill = envInfo.functions.spam.arguments.kill.value,
    env = envInfo.functions.spam.arguments.env.value,
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
                isMedia,
                user,
                userFormated,
                isGroup,
                isCmd,
                isGroupAdmins,
                groupAdmins,
                chatId,
                functions,
            } = env.value;

            /* Define se foi um SPAM */
            let isSpammer = false;

            /* Define o Object padrão */
            const defUserObj = {
                time: 0,
                next: 0,
                amount: 0,
                blocked: false,
            };

            /* Define qual Object usar */
            const kindSpam = isMedia && functions.antispam.enable === true ? 'file' : 'command';

            /* Define o object padrão */
            if (isGroup) {
                /* Se o chatId existir no spamInfo, usa ele, se não, cria uma object */
                spamInfo[kindSpam][chatId] = spamInfo[kindSpam][chatId] || {};

                /* Se for no PV, define o mesmo acima, mas sem id de grupo */
            } else spamInfo[kindSpam] = spamInfo[kindSpam] || {};

            /* Se for grupo */
            const chatObj = isGroup ? spamInfo[kindSpam][chatId] : spamInfo[kindSpam];
            const userObj = chatObj[user] || defUserObj;

            /* Ajusta as Objects para terem dados da pessoa */
            chatObj[user] = userObj;

            /* Ajusta a Object que vai usar */
            let spamData = userObj;

            /* Se as condições forem de resetar o contador */
            if (
                (spamData.blocked === true && Date.now() > spamData.time)
                || (
                    (spamData.blocked === false && Date.now() > spamData.next)
                    && (
                        spamData.amount >= functions.antispam.limit
                        || spamData.amount >= config.maxCommands.value
                        || spamData.amount === 0
                    )
                )
            ) {
                /* Reinicia o contador e permite que a pessoa use de novo */
                spamData = defUserObj;

                /* Se a verificação do próximo comando ou mídia for inferior à data atual */
            } else if (spamData.blocked === true) {
                /* Considere como flood */
                envInfo.results.value = true;
                envInfo.results.success = true;

                /* Retorna flood para a Íris abortar a execução */
                return logging.postResults(envInfo);
            }

            /* Se for comando ou grupo com antispam */
            if (isCmd || (isMedia && functions.antispam.enable === true)) {
                /* Aumenta em 1 o número de spam */
                spamData.amount += 1;
            }

            /* Define as condições */
            const conditions = (
                /* Quantidade de SPAM maior que a configurada */
                (spamData.amount > functions.antispam.limit

                /* Com sistema ativo */
                && functions.antispam.enable === true

                /* E ser media */
                && isMedia

                /* E o tempo limite ainda esta contando */
                && spamData.next > Date.now())

                /* Ou se for comando */
                || (isCmd

                /* Tiver passado do limite */
                && spamData.amount > config.maxCommands.value

                /* E do tempo limite */
                && spamData.next > Date.now())
            );

            /* Se for admin e midia */
            if (functions.antispam.ban === true && isMedia && isGroupAdmins) {
                /* Reseta o contador de spam, pra evitar ser banido em outros grupos */
                spamData = defUserObj;

                /* Define como não SPAM */
                envInfo.results.value = false;

                /* Define se deve contar */
            } else if (conditions) {
                /* Reseta o contador de spam, pra evitar ser banido em outros grupos */
                spamData.amount = 0;

                /* Define a mentions */
                const mentioning = (config.tagAdmins.value === true
                    ? [...groupAdmins, user, ...config.owner.value]
                    : [user]
                );

                /* Se permitido banir */
                if (functions.antispam.ban === true && isMedia) {
                    /* Remove do grupo */
                    await kill.groupParticipantsUpdate(chatId, [user], 'remove');

                    /* Avisa do SPAM e bloqueia os comandos da pessoa por x minutos */
                    await kill.sendMessage(chatId, { text: Indexer('sql').languages(region, 'Security', 'Notice', true, true, { userFormated, notice: 'SPAM' }).value, mentions: mentioning });

                    /* Avisa que foi SPAM e limita por 5 minutos */
                } else {
                    /* Avisa do SPAM e bloqueia os comandos da pessoa por x minutos */
                    await kill.sendMessage(chatId, { text: Indexer('sql').languages(region, 'Security', 'Mute', true, true, { userFormated, timeLimit: (config.spammerTime.value / 1000 / 60) }).value, mentions: mentioning });
                }

                /* Define o blocks para bloquear por x minutos, também funciona caso bana em um grupo e a pessoa use noutro */
                spamData.time = Date.now() + config.spammerTime.value;
                spamData.blocked = true;

                /* Define direto também para comandos */
                if (kindSpam === 'file' && isGroup) {
                    /* Para ignorar caso não use em mídia depois */
                    spamInfo.command[chatId] = spamInfo[kindSpam][chatId] || {};
                    spamInfo.command[user] = spamInfo[kindSpam][chatId][user] || {};

                    /* Mesmo, mas PV */
                } else if (kindSpam === 'file' && !isGroup) {
                    /* Para ignorar caso não use em mídia depois */
                    spamInfo.command[user] = spamInfo[kindSpam][user] || {};
                }

                /* Define o spammer como true */
                isSpammer = true;
                envInfo.results.value = isSpammer;

                /* Se não for SPAM e for comando */
            } else if (isCmd && Date.now() > spamData.next) {
                /* Ajusta o cooldown */
                spamData.next = Date.now() + config.commandsCooldown.value;

                /* Se não for SPAM e não for comando */
            } else if (isMedia && Date.now() > spamData.next) {
                /* Ajusta o cooldown */
                spamData.next = Date.now() + config.mediaCooldown.value;
            }

            /* Salva os valores na Object */
            if (isGroup) {
                /* Se for grupo */
                spamInfo[kindSpam][chatId][user] = spamData;

                /* Se for PV */
            } else spamInfo[kindSpam][user] = spamData;
        }

        /* Define o sucesso, se seu comando der erro isso jamais será chamado */
        envInfo.results.success = true;

        /* Caso de algum erro */
    } catch (error) {
        /* Insere tudo na envInfo */
        logging.echoError(error, envInfo, __dirname);
    }

    /* Retorna os resultados */
    return logging.postResults(envInfo);
}

/* Reset profundo para evitar circular */
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
        [envInfo.exports.poswork]: { value: logging.postResults },
        [envInfo.exports.env]: { value: ambientDetails },
        [envInfo.exports.messedup]: { value: logging.echoError },
        [envInfo.exports.reset]: { value: resetLocal },
        [envInfo.exports.spam]: { value: spamInfomer },
    },
    parameters: {
        location: { value: __filename },
    },
}, envFile, changeKey, dirname);
resetLocal();
