import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import Utilisateur from '../models/utilisateurModel.js';
import { logger } from '../utils/logger.js';

// Protection des routes - l'utilisateur doit être connecté
export const proteger = async (req, res, next) => {
    try {
        let token;

        // Vérifier le token dans le header d'autorisation
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // S'il n'a pas de token, non autorisé
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé - Token manquant',
            });
        }

        try {
            // Vérifier et décoder le token
            const decoded = jwt.verify(token, config.jwtSecret);

            // Récupérer l'utilisateur depuis la base de données
            const utilisateur = await Utilisateur.findById(decoded.id).select('-motDePasse');

            // Si l'utilisateur n'existe pas ou est désactivé, non autorisé
            if (!utilisateur) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non trouvé - Token invalide',
                });
            }

            // Vérifier si le compte est actif
            if (!utilisateur.estActif) {
                return res.status(401).json({
                    success: false,
                    message: "Compte désactivé - Contactez l'administrateur",
                });
            }

            // Ajouter l'utilisateur à la requête
            req.utilisateur = utilisateur;
            next();
        } catch (error) {
            logger.error('Erreur de vérification du token:', error);
            return res.status(401).json({
                success: false,
                message: 'Non autorisé - Token invalide',
            });
        }
    } catch (error) {
        logger.error('Erreur middleware de protection:', error);
        next(error);
    }
};

// Autorisation basée sur les rôles
export const autoriser = (...roles) => {
    return (req, res, next) => {
        if (!req.utilisateur) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé - Utilisateur non authentifié',
            });
        }

        // Vérifier si le rôle de l'utilisateur est autorisé
        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({
                success: false,
                message: `Rôle ${req.utilisateur.role} non autorisé à accéder à cette ressource`,
            });
        }

        next();
    };
};

// Middleware pour les utilisateurs vérifiés
export const exigerVerification = (req, res, next) => {
    if (!req.utilisateur.estVerifie) {
        return res.status(403).json({
            success: false,
            message: 'Compte non vérifié - Veuillez vérifier votre email',
        });
    }
    next();
};

// Optional auth - ne bloque pas mais ajoute l'utilisateur si connecté
export const authOptionnelle = async (req, res, next) => {
    try {
        let token;

        // Vérifier le token dans le header d'autorisation
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];

            // Vérifie et décode le token
            const decoded = jwt.verify(token, config.jwtSecret);
            const utilisateur = await Utilisateur.findById(decoded.id).select('-motDePasse');

            // Ajouter l'utilisateur à la requête si trouvé et actif
            if (utilisateur && utilisateur.estActif) {
                req.utilisateur = utilisateur;
            }
        }

        next();
    } catch (error) {
        // Ne pas bloquer en cas d'erreur de token pour l'auth optionnelle
        next();
    }
};
