/*
    Este local é restrito em nível máximo, o uso desta função por meio da exec causará danos.
    Por isso não existem funções exports ou Ambient, não use.
*/

/* Módulo para verificar a existência de comandos */
const commandExists = require('command-exists').sync;

/* Sistema operacional do PC */
const currentPlatform = process.platform;

/* Condições para iniciar */
const programExists = {
    bash: commandExists('bash'),
    zip: commandExists('zip'),
    node: commandExists('node'),
    sqlite: commandExists('sqlite3') || commandExists('sqlite'),
    python: commandExists('python3') || commandExists('python'),
    tesseract: commandExists('tesseract'),
    git: commandExists('git'),
};

/* URLs de download para programas ausentes */
const programDownloads = {
    win32: {
        bash: 'https://gitforwindows.org/',
        git: 'https://gitforwindows.org/',
        zip: 'https://www.7-zip.org/download.html',
        node: 'https://nodejs.org/en/download/',
        sqlite3: 'https://www.sqlite.org/download.html',
        python3: 'https://www.python.org/downloads/windows/',
        tesseract: 'https://tesseract-ocr.github.io/tessdoc/Downloads.html',
    },
    linux: {
        bash: 'sudo apt install bash',
        zip: 'sudo apt install zip unzip',
        git: 'sudo apt install git',
        node: 'sudo apt install nodejs build-essential',
        sqlite3: 'sudo apt install sqlite3',
        python3: 'sudo apt install python3',
        tesseract: 'sudo apt install tesseract-ocr',
    },
    darwin: {
        bash: 'brew install bash',
        zip: 'brew install p7zip',
        git: 'brew install git',
        node: 'brew install node',
        sqlite3: 'brew install sqlite',
        python3: 'brew install python@3',
        tesseract: 'brew install tesseract',
    },
    freebsd: {
        bash: 'pkg install bash',
        zip: 'pkg install p7zip',
        git: 'pkg install git',
        node: 'pkg install node',
        sqlite3: 'pkg install sqlite3',
        python3: 'pkg install python3',
        tesseract: 'pkg install tesseract',
    },
    openbsd: {
        bash: 'pkg_add bash',
        zip: 'pkg_add p7zip',
        git: 'pkg_add git',
        node: 'pkg_add node',
        sqlite3: 'pkg_add sqlite3',
        python3: 'pkg_add python3',
        tesseract: 'pkg_add tesseract',
    },
    sunos: {
        bash: 'pkg install bash',
        zip: 'pkg install unzip',
        git: 'pkg install git',
        node: 'pkg install nodejs',
        sqlite3: 'pkg install sqlite3',
        python3: 'pkg install python37',
        tesseract: 'https://tesseract-ocr.github.io/tessdoc/Compiling.html',
    },
    aix: {
        bash: 'https://www.perzl.org/aix/index.php?n=Main.Bash',
        zip: 'https://www.perzl.org/aix/index.php?n=Main.P7zip',
        git: 'https://www.perzl.org/aix/index.php?n=Main.Git',
        node: 'https://www.perzl.org/aix/index.php?n=Main.NodeJS',
        sqlite3: 'https://www.perzl.org/aix/index.php?n=Main.Sqlite',
        python3: 'https://www.perzl.org/aix/index.php?n=Main.Python',
        tesseract: 'https://tesseract-ocr.github.io/tessdoc/Compiling.html',
    },
};

/* Verifica se algum pré-requisito está ausente */
const missing = Object.keys(programExists).filter((prerequisite) => !programExists[prerequisite]);

/* Se todos os pré-requisitos estiverem disponíveis */
if (missing.length === 0) {
    /* Inicia o programa principal */
    /* eslint-disable-next-line global-require */
    require('./index');

    /* Se tiver algum faltando */
} else {
    /* Printa a plataforma do user caso ele venha pedir ajuda no suporte */
    console.log(`Your System/Platform: ${currentPlatform}`);

    /* Imprime uma mensagem informando sobre os pré-requisitos ausentes */
    console.log('You do not meet the necessary requirements. Please install the following programs:');

    /* Se a plataforma atual tiver informações de download disponíveis */
    if (programDownloads[currentPlatform]) {
        /* Obtém as informações de download para a plataforma atual */
        const downloads = programDownloads[currentPlatform];

        /* Lista os programas ausentes e as URLs de download correspondentes */
        missing.forEach((missingProgram, index) => console.log(`${index + 1}. ${missingProgram.toUpperCase()} -> ${downloads[missingProgram]}`));

        /* Se a plataforma não for existente aqui */
    } else {
        /* Printa ela e os programas que faltam */
        console.log(missing.join(', '));
    }

    /* Sai do programa com um código de erro 1 */
    process.exit(1);
}