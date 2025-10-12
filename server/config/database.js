import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

// Configuration des options de connexion
export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri);

        logger.info(`MongoDB connecté: ${conn.connection.host}`);
        logger.info(`Base de données: ${conn.connection.name}`);

        // Gestion des erreurs après connexion initiale
        mongoose.connection.on('error', err => {
            logger.error('Erreur de connexion MongoDB:', err);
        });

        // Gestion de la déconnexion
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB déconnecté');
        });

        // Gestion propre de la fermeture
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('Connexion MongoDB fermée');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};
