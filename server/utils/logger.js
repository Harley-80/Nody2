import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le répertoire courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assurer que le dossier logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuration des transports de logs
const logToFile = (level, message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;

    // Fichier de log combiné
    const logFile = path.join(logsDir, `${level}.log`);
    fs.appendFileSync(logFile, logMessage);
};

// Logger principal
export const logger = {
    info: message => {
        console.log(`\x1b[32mINFO\x1b[0m: ${message}`);
        logToFile('combined', `INFO: ${message}`);
        logToFile('info', message);
    },

    // Niveau d'alerte
    warn: message => {
        console.log(`\x1b[33mWARN\x1b[0m: ${message}`);
        logToFile('combined', `WARN: ${message}`);
        logToFile('warn', message);
    },

    // Niveau d'erreur
    error: message => {
        console.log(`\x1b[31mERROR\x1b[0m: ${message}`);
        logToFile('combined', `ERROR: ${message}`);
        logToFile('error', message);
    },
    // Niveau de débogage
    debug: message => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`\x1b[36mDEBUG\x1b[0m: ${message}`);
            logToFile('combined', `DEBUG: ${message}`);
        }
    },
};

// Gestion des exceptions non catchées
process.on('uncaughtException', error => {
    logger.error(`Exception non catchée: ${error.message}`);
    logToFile('exceptions', error.stack);
    process.exit(1);
});

// Gestion des promesses rejetées
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Promesse rejetée non gérée: ${reason}`);
    logToFile('rejections', `Reason: ${reason}\nPromise: ${promise}`);
    process.exit(1);
});
