import Stripe from 'stripe';
import { config } from '../config/env.js';
import { convertirDevise } from '../config/configPaiements.js';
import { logger } from '../utils/logger.js';

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16',
    maxNetworkRetries: 2,
    timeout: 20000,
});

// Mapper nos devises vers les devises Stripe supportées
const mapDeviseStripe = devise => {
    const mapping = {
        EUR: 'eur',
        USD: 'usd',
        CAD: 'cad',
        XOF: 'xof',
        XAF: 'xaf',
        CNY: 'cny',
    };
    return mapping[devise] || 'eur';
};

// Convertir le montant en unités Stripe (centimes pour la plupart des devises)
const convertirMontantStripe = (montant, devise) => {
    const deviseStripe = mapDeviseStripe(devise);

    // Stripe utilise les centimes pour EUR, USD, CAD
    const devisesCentimes = ['eur', 'usd', 'cad'];

    if (devisesCentimes.includes(deviseStripe)) {
        return Math.round(montant * 100); // Conversion en centimes
    }

    // Pour les autres devises comme XOF, on utilise l'unité de base
    return Math.round(montant);
};

// @desc    Créer une  Intention Paiement Stripe
// @param   {Object} donnees - Données du paiement
// @return  {Object} Paiment  Intention
export const creerPaymentIntent = async donnees => {
    try {
        const {
            montant,
            devise,
            commandeId,
            utilisateurId,
            emailUtilisateur,
            methodePaiement = 'carte',
        } = donnees;

        const deviseStripe = mapDeviseStripe(devise);
        const montantStripe = convertirMontantStripe(montant, devise);

        // Vérifier le montant minimum
        if (montantStripe < 50) {
            // 0.50€ minimum
            throw new Error('Le montant minimum pour un paiement est de 0.50€');
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: montantStripe,
            currency: deviseStripe,
            payment_method_types: [methodePaiement],
            metadata: {
                commande_id: commandeId,
                utilisateur_id: utilisateurId.toString(),
                email: emailUtilisateur,
            },
            description: `Paiement commande ${commandeId}`,
            receipt_email: emailUtilisateur,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never',
            },
        });

        logger.info(`Payment Intent créé: ${paymentIntent.id} pour la commande ${commandeId}`);

        return {
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            montant: paymentIntent.amount,
            devise: paymentIntent.currency,
            statut: paymentIntent.status,
        };
    } catch (error) {
        logger.error('Erreur création Payment Intent:', error);

        return {
            success: false,
            error: {
                code: error.type || 'stripe_error',
                message: error.message,
                detail: error.raw?.message || 'Erreur lors de la création du paiement',
            },
        };
    }
};

// @desc    Confirmer un paiement
// @param   {String} paymentIntentId - ID du Payment Intent
// @return  {Object} Paiement confirmé
export const confirmerPaiement = async paymentIntentId => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            logger.info(`Paiement déjà réussi: ${paymentIntentId}`);

            return {
                success: true,
                paymentIntent,
                statut: 'reussi',
            };
        }

        // Si le paiement nécessite une confirmation supplémentaire
        if (paymentIntent.status === 'requires_confirmation') {
            const paymentIntentConfirme = await stripe.paymentIntents.confirm(paymentIntentId);

            logger.info(`Paiement confirmé: ${paymentIntentId} -> ${paymentIntentConfirme.status}`);

            return {
                success: true,
                paymentIntent: paymentIntentConfirme,
                statut: paymentIntentConfirme.status,
            };
        }

        // Si le paiement nécessite une action supplémentaire
        if (paymentIntent.status === 'requires_action') {
            return {
                success: true,
                paymentIntent,
                statut: 'requiert_action',
                clientSecret: paymentIntent.client_secret,
            };
        }

        // Statut non géré
        return {
            success: false,
            error: {
                code: 'statut_inattendu',
                message: `Statut de paiement non géré: ${paymentIntent.status}`,
                statut: paymentIntent.status,
            },
        };
    } catch (error) {
        logger.error('Erreur confirmation paiement:', error);

        return {
            success: false,
            error: {
                code: error.type || 'stripe_error',
                message: error.message,
                detail: error.raw?.message || 'Erreur lors de la confirmation du paiement',
            },
        };
    }
};

// @desc    Rembourser un paiement
// @param   {String} paymentIntentId - ID du Payment Intent
// @param   {Number} montant - Montant à rembourser
// @param   {String} raison - Raison du remboursement
// @return  {Object} Remboursement
export const effectuerRemboursement = async (paymentIntentId, montant, raison) => {
    try {
        const remboursement = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: montant,
            reason: raison === 'demande_client' ? 'requested_by_customer' : 'other',
            metadata: {
                raison: raison,
                date: new Date().toISOString(),
            },
        });

        logger.info(`Remboursement effectué: ${remboursement.id} pour ${paymentIntentId}`);

        return {
            success: true,
            remboursement,
            statut: remboursement.status,
        };
    } catch (error) {
        logger.error('Erreur remboursement:', error);

        return {
            success: false,
            error: {
                code: error.type || 'stripe_error',
                message: error.message,
                detail: error.raw?.message || 'Erreur lors du remboursement',
            },
        };
    }
};

// @desc    Récupérer les détails d'un paiement
// @param   {String} paymentIntentId - ID du Payment Intent
// @return  {Object} Détails du paiement
export const getDetailsPaiement = async paymentIntentId => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges.data.payment_method'],
        });

        // Extraire les détails de la carte si disponibles
        let detailsCarte = null;
        if (paymentIntent.charges.data.length > 0) {
            const charge = paymentIntent.charges.data[0];
            const paymentMethod = charge.payment_method_details;

            if (paymentMethod?.type === 'card') {
                detailsCarte = {
                    marque: paymentMethod.card.brand,
                    pays: paymentMethod.card.country,
                    dernier4: paymentMethod.card.last4,
                    expirationMois: paymentMethod.card.exp_month,
                    expirationAnnee: paymentMethod.card.exp_year,
                };
            }
        }

        return {
            success: true,
            paymentIntent,
            detailsCarte,
            statut: paymentIntent.status,
        };
    } catch (error) {
        logger.error('Erreur récupération détails paiement:', error);

        return {
            success: false,
            error: {
                code: error.type || 'stripe_error',
                message: error.message,
            },
        };
    }
};

// @desc    Annuler un Payment Intent
// @param   {String} paymentIntentId - ID du Payment Intent
// @return  {Object} Résultat de l'annulation
export const annulerPaymentIntent = async paymentIntentId => {
    try {
        const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

        logger.info(`Payment Intent annulé: ${paymentIntentId}`);

        return {
            success: true,
            paymentIntent,
            statut: paymentIntent.status,
        };
    } catch (error) {
        logger.error('Erreur annulation Payment Intent:', error);

        return {
            success: false,
            error: {
                code: error.type || 'stripe_error',
                message: error.message,
            },
        };
    }
};

// @desc    Vérifier le webhook Stripe
// @param   {String} payload - Corps de la requête
// @param   {String} signature - Signature du webhook
// @param   {String} secret - Secret du webhook
// @return  {Object} Événement Stripe
export const verifierWebhook = (payload, signature, secret) => {
    try {
        const event = stripe.webhooks.constructEvent(payload, signature, secret);
        return { success: true, event };
    } catch (error) {
        logger.error('Erreur vérification webhook:', error);
        return { success: false, error: error.message };
    }
};

export default stripe;
