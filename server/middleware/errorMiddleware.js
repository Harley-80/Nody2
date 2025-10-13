import { logger } from '../utils/logger.js';

// Gestionnaire d'erreurs global
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log de l'erreur
    logger.error(`Erreur: ${err.message}`);
    logger.error(`Stack: ${err.stack}`);

    // Erreur MongoDB mauvais ObjectId
    if (err.name === 'CastError') {
        const message = 'Ressource non trouvée - ID invalide';
        error = { message, statusCode: 404 };
    }

    // Erreur de duplication MongoDB
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        const message = `La valeur '${value}' existe déjà pour le champ ${field}`;
        error = { message, statusCode: 400 };
    }

    // Erreur de validation MongoDB
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = `Données d'entrée invalides: ${messages.join(', ')}`;
        error = { message, statusCode: 400 };
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token JWT invalide';
        error = { message, statusCode: 401 };
    }

    // Token JWT expiré
    if (err.name === 'TokenExpiredError') {
        const message = 'Token JWT expiré';
        error = { message, statusCode: 401 };
    }

    // Réponse d'erreur
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
