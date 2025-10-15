import { logger } from './logger.js';
import { config } from '../config/env.js';

// Stub pour l'envoi d'emails - à implémenter avec Nodemailer
export const envoyerEmail = async ({ email, sujet, template, donnees }) => {
    try {
        // TODO: Implémenter avec Nodemailer
        logger.info(`Email simulé envoyé à: ${email} - Sujet: ${sujet}`);
        logger.debug(`Template: ${template}`, donnees);

        // Simulation d'envoi réussi
        return true;
    } catch (error) {
        logger.error('Erreur envoi email:', error);
        throw error;
    }
};

// Générer le contenu HTML des emails
export const genererContenuEmail = (template, donnees) => {
    const templates = {
        bienvenue: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Bienvenue sur Nody, ${donnees.nom} !</h1>
                <p>Merci de vous être inscrit sur notre plateforme de mode.</p>
                <p>Veuillez vérifier votre compte en cliquant sur le lien ci-dessous :</p>
                <a href="${config.clientUrl}/verifier-compte/${donnees.token}" 
                    style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                    Vérifier mon compte
                </a>
            </div>
        `,
        resetPassword: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
                <p>Bonjour ${donnees.nom},</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
                <a href="${config.clientUrl}/reinitialiser-mot-de-passe/${donnees.token}" 
                    style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                    Réinitialiser mon mot de passe
                </a>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                    Ce lien expirera dans 30 minutes.
                </p>
            </div>
        `,
    };

    return templates[template] || '<p>Email template non trouvé</p>';
};
