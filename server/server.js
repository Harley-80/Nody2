import App from './app.js';
import { logger } from './utils/logger.js';

const app = new App();

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    logger.info('Signal SIGTERM reçu, arrêt du serveur');
    if (app.server) {
        app.server.close(() => {
            logger.info('Serveur arrêté');
            process.exit(0);
        });
    }
});

// Gestion propre de l'arrêt pour SIGINT (Ctrl+C)
process.on('SIGINT', () => {
    logger.info('Signal SIGINT reçu, arrêt du serveur');
    if (app.server) {
        app.server.close(() => {
            logger.info('Serveur arrêté');
            process.exit(0);
        });
    }
});

// Démarrage de l'application
app.start().catch(error => {
    logger.error('Erreur critique lors du démarrage:', error);
    process.exit(1);
});
