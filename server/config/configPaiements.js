import { config } from './env.js';

// Configuration des paiements et devises
export const paiementConfig = {
    stripe: {
        publishableKey: config.stripePublishableKey,
        secretKey: config.stripeSecretKey,
        webhookSecret: config.stripeWebhookSecret,
    },
    devises: [
        {
            // Devise par défaut afrique de l'ouest
            code: 'XOF',
            symbole: 'CFA',
            nom: 'Franc CFA (XOF)',
            locale: 'fr-FR',
            tauxConversion: 1,
        },
        {
            // Devise par défaut afrique centrale
            code: 'XAF',
            symbole: 'FCFA',
            nom: 'Franc CFA (XAF)',
            locale: 'fr-FR',
            tauxConversion: 1,
        },
        {
            // Devise France
            code: 'EUR',
            symbole: '€',
            nom: 'Euro (EUR)',
            locale: 'fr-FR',
            tauxConversion: 0.0015,
        },
        {
            // Devise USA
            code: 'USD',
            symbole: '$',
            nom: 'Dollar US (USD)',
            locale: 'en-US',
            tauxConversion: 0.0016,
        },
        {
            // Devise CANADA
            code: 'CAD',
            symbole: 'C$',
            nom: 'Dollar Canadien (CAD)',
            locale: 'en-CA',
            tauxConversion: 0.0022,
        },
        {
            // Devise Chine
            code: 'CNY',
            symbole: '¥',
            nom: 'Yuan Renminbi (CNY)',
            locale: 'zh-CN',
            tauxConversion: 0.011,
        },
    ],
};

// Convertir un montant entre devises
export const convertirDevise = (montant, deviseSource, deviseCible) => {
    const source = paiementConfig.devises.find(d => d.code === deviseSource);
    const cible = paiementConfig.devises.find(d => d.code === deviseCible);

    if (!source || !cible) {
        throw new Error('Devise non supportée');
    }

    // Conversion via EUR comme devise intermédiaire
    const montantEUR = montant * source.tauxConversion;
    return Math.round(montantEUR / cible.tauxConversion);
};
