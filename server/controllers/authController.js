import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env.js';
import Utilisateur from '../models/utilisateurModel.js';
import { logger } from '../utils/logger.js';
import { envoyerEmail } from '../utils/emailUtils.js';

// Générer le token JWT
const genererToken = id => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpire,
    });
};

// Envoyer le token dans la réponse
const envoyerTokenReponse = (utilisateur, statusCode, res) => {
    const token = genererToken(utilisateur._id);

    // Ne pas inclure le mot de passe dans la réponse
    const donneesUtilisateur = {
        _id: utilisateur._id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        estVerifie: utilisateur.estVerifie,
        preferences: utilisateur.preferences,
        avatar: utilisateur.avatar,
    };

    res.status(statusCode).json({
        success: true,
        token,
        utilisateur: donneesUtilisateur,
    });
};

// @desc    Inscription utilisateur
// @route   POST /api/auth/inscription
// @access  Public
export const inscription = async (req, res, next) => {
    try {
        const { nom, prenom, email, motDePasse, telephone, genre, preferences } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const utilisateurExistant = await Utilisateur.trouverParEmail(email);

        if (utilisateurExistant) {
            return res.status(400).json({
                success: false,
                message: 'Un compte avec cet email existe déjà',
            });
        }

        // Créer le nouvel utilisateur
        const utilisateur = await Utilisateur.create({
            nom,
            prenom,
            email,
            motDePasse,
            telephone,
            genre,
            preferences: {
                newsletter: preferences?.newsletter !== false,
                notifications: preferences?.notifications !== false,
                devise: preferences?.devise || 'XOF',
                langue: preferences?.langue || 'fr',
            },
        });

        // Générer le token de vérification
        const tokenVerification = crypto.randomBytes(32).toString('hex');
        utilisateur.tokenVerification = tokenVerification;
        utilisateur.expirationTokenVerification = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
        await utilisateur.save({ validateBeforeSave: false });

        try {
            // Envoyer l'email de bienvenue
            await envoyerEmail({
                email: utilisateur.email,
                sujet: 'Bienvenue sur Nody - Vérifiez votre compte',
                template: 'bienvenue',
                donnees: {
                    nom: utilisateur.prenom,
                    token: tokenVerification,
                },
            });

            logger.info(`Nouvel utilisateur inscrit: ${utilisateur.email}`);
        } catch (emailError) {
            logger.error('Erreur envoi email de bienvenue:', emailError);
            // Ne pas bloquer l'inscription en cas d'erreur d'email
        }

        envoyerTokenReponse(utilisateur, 201, res);
    } catch (error) {
        logger.error('Erreur inscription:', error);
        next(error);
    }
};

// @desc    Connexion utilisateur
// @route   POST /api/auth/connexion
// @access  Public
export const connexion = async (req, res, next) => {
    try {
        const { email, motDePasse } = req.body;

        // Vérifier que l'email et le mot de passe sont fournis
        if (!email || !motDePasse) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez fournir un email et un mot de passe',
            });
        }

        // Trouver l'utilisateur et inclure le mot de passe
        const utilisateur = await Utilisateur.findOne({ email }).select('+motDePasse');

        if (!utilisateur) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides',
            });
        }

        // Vérifier si le compte est actif
        if (!utilisateur.estActif) {
            return res.status(401).json({
                success: false,
                message: "Compte désactivé - Contactez l'administrateur",
            });
        }

        // Vérifier le mot de passe
        const estMotDePasseCorrect = await utilisateur.comparerMotDePasse(motDePasse);

        if (!estMotDePasseCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides',
            });
        }

        // Mettre à jour la date de dernière connexion
        await utilisateur.mettreAJourDerniereConnexion();

        logger.info(`Utilisateur connecté: ${utilisateur.email}`);

        envoyerTokenReponse(utilisateur, 200, res);
    } catch (error) {
        logger.error('Erreur connexion:', error);
        next(error);
    }
};

// @desc    Déconnexion utilisateur
// @route   POST /api/auth/deconnexion
// @access  Privé
export const deconnexion = async (req, res, next) => {
    try {
        // Avec JWT stateless, la déconnexion se fait côté client
        // On pourrait implémenter une blacklist de tokens si nécessaire

        logger.info(`Utilisateur déconnecté: ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie',
        });
    } catch (error) {
        logger.error('Erreur déconnexion:', error);
        next(error);
    }
};

// @desc    Mot de passe oublié
// @route   POST /api/auth/mot-de-passe-oublie
// @access  Public
export const motDePasseOublie = async (req, res, next) => {
    try {
        const { email } = req.body;

        const utilisateur = await Utilisateur.trouverParEmail(email);

        if (!utilisateur) {
            // Pour des raisons de sécurité, ne pas révéler si l'email existe
            return res.status(200).json({
                success: true,
                message:
                    'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
            });
        }

        // Générer le token de réinitialisation
        const tokenReinitialisation = crypto.randomBytes(32).toString('hex');

        utilisateur.tokenReinitialisation = tokenReinitialisation;
        utilisateur.expirationTokenReinitialisation = Date.now() + 30 * 60 * 1000; // 30 minutes

        await utilisateur.save({ validateBeforeSave: false });

        try {
            // Envoyer l'email de réinitialisation
            await envoyerEmail({
                email: utilisateur.email,
                sujet: 'Réinitialisation de votre mot de passe Nody',
                template: 'resetPassword',
                donnees: {
                    nom: utilisateur.prenom,
                    token: tokenReinitialisation,
                },
            });

            logger.info(`Email réinitialisation envoyé à: ${utilisateur.email}`);
        } catch (emailError) {
            // Réinitialiser les tokens en cas d'erreur d'email
            utilisateur.tokenReinitialisation = undefined;
            utilisateur.expirationTokenReinitialisation = undefined;
            await utilisateur.save({ validateBeforeSave: false });

            logger.error('Erreur envoi email réinitialisation:', emailError);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de l'envoi de l'email",
            });
        }

        res.status(200).json({
            success: true,
            message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé',
        });
    } catch (error) {
        logger.error('Erreur mot de passe oublié:', error);
        next(error);
    }
};

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/reinitialiser-mot-de-passe/:token
// @access  Public
export const reinitialiserMotDePasse = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { motDePasse } = req.body;

        // Hasher le token pour la comparaison
        const tokenReinitialisationHash = crypto.createHash('sha256').update(token).digest('hex');

        const utilisateur = await Utilisateur.findOne({
            tokenReinitialisation: tokenReinitialisationHash,
            expirationTokenReinitialisation: { $gt: Date.now() },
        });

        if (!utilisateur) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide ou expiré',
            });
        }

        // Mettre à jour le mot de passe
        utilisateur.motDePasse = motDePasse;
        utilisateur.tokenReinitialisation = undefined;
        utilisateur.expirationTokenReinitialisation = undefined;

        await utilisateur.save();

        logger.info(`Mot de passe réinitialisé pour: ${utilisateur.email}`);

        envoyerTokenReponse(utilisateur, 200, res);
    } catch (error) {
        logger.error('Erreur réinitialisation mot de passe:', error);
        next(error);
    }
};

// @desc    Vérifier le compte
// @route   GET /api/auth/verifier/:token
// @access  Public
export const verifierCompte = async (req, res, next) => {
    try {
        const { token } = req.params;

        const tokenVerificationHash = crypto.createHash('sha256').update(token).digest('hex');

        const utilisateur = await Utilisateur.findOne({
            tokenVerification: tokenVerificationHash,
            expirationTokenVerification: { $gt: Date.now() },
        });

        if (!utilisateur) {
            return res.status(400).json({
                success: false,
                message: 'Token de vérification invalide ou expiré',
            });
        }

        // Marquer le compte comme vérifié
        utilisateur.estVerifie = true;
        utilisateur.dateVerification = new Date();
        utilisateur.tokenVerification = undefined;
        utilisateur.expirationTokenVerification = undefined;

        await utilisateur.save();

        logger.info(`Compte vérifié: ${utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Compte vérifié avec succès',
        });
    } catch (error) {
        logger.error('Erreur vérification compte:', error);
        next(error);
    }
};

// @desc    Renvoyer l'email de vérification
// @route   POST /api/auth/renvoyer-verification
// @access  Privé
export const renvoyerVerification = async (req, res, next) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        if (utilisateur.estVerifie) {
            return res.status(400).json({
                success: false,
                message: 'Le compte est déjà vérifié',
            });
        }

        // Générer un nouveau token
        const tokenVerification = crypto.randomBytes(32).toString('hex');
        utilisateur.tokenVerification = tokenVerification;
        utilisateur.expirationTokenVerification = Date.now() + 24 * 60 * 60 * 1000;

        await utilisateur.save({ validateBeforeSave: false });

        try {
            // Envoyer l'email de vérification
            await envoyerEmail({
                email: utilisateur.email,
                sujet: 'Vérification de votre compte Nody',
                template: 'bienvenue',
                donnees: {
                    nom: utilisateur.prenom,
                    token: tokenVerification,
                },
            });

            logger.info(`Email vérification renvoyé à: ${utilisateur.email}`);
        } catch (emailError) {
            logger.error('Erreur envoi email vérification:', emailError);

            return res.status(500).json({
                success: false,
                message: "Erreur lors de l'envoi de l'email",
            });
        }

        res.status(200).json({
            success: true,
            message: 'Email de vérification envoyé',
        });
    } catch (error) {
        logger.error('Erreur renvoi vérification:', error);
        next(error);
    }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/moi
// @access  Privé
export const getUtilisateurConnecte = async (req, res, next) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        res.status(200).json({
            success: true,
            utilisateur: {
                _id: utilisateur._id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                genre: utilisateur.genre,
                dateNaissance: utilisateur.dateNaissance,
                role: utilisateur.role,
                estVerifie: utilisateur.estVerifie,
                preferences: utilisateur.preferences,
                adresses: utilisateur.adresses,
                avatar: utilisateur.avatar,
                dateDerniereConnexion: utilisateur.dateDerniereConnexion,
                createdAt: utilisateur.createdAt,
            },
        });
    } catch (error) {
        logger.error('Erreur récupération utilisateur connecté:', error);
        next(error);
    }
};
