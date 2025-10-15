import Paiement from '../models/paiementModel.js';
import Commande from '../models/commandeModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import {
    creerPaymentIntent,
    confirmerPaiement as confirmerPaiementService, // <-- CORRECTION: Alias pour le service
    effectuerRemboursement,
    getDetailsPaiement,
    annulerPaymentIntent,
    verifierWebhook,
} from '../services/paiementService.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

// @desc    Créer une session de paiement
// @route   POST /api/paiements/creer-session
// @access  Privé
export const creerSessionPaiement = async (req, res, next) => {
    try {
        const { commandeId } = req.body;

        // Récupérer la commande
        const commande = await Commande.findOne({
            _id: commandeId,
            utilisateur: req.utilisateur._id,
        }).populate('utilisateur', 'email nom prenom');

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée',
            });
        }

        // Vérifier que la commande est en attente de paiement
        if (commande.statutPaiement !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: 'Cette commande a déjà été traitée',
            });
        }

        // Vérifier que le statut de la commande permet le paiement
        if (commande.statut !== 'en_attente') {
            return res.status(400).json({
                success: false,
                message: 'Cette commande ne peut plus être payée',
            });
        }

        // Créer le Paiment avec Stripe
        const resultat = await creerPaymentIntent({
            montant: commande.total,
            devise: commande.devise,
            commandeId: commande._id.toString(),
            utilisateurId: req.utilisateur._id,
            emailUtilisateur: commande.utilisateur.email,
            methodePaiement: 'carte',
        });

        if (!resultat.success) {
            return res.status(400).json({
                success: false,
                message: 'Erreur lors de la création du paiement',
                error: resultat.error,
            });
        }

        // Créer l'enregistrement de paiement dans la base de données
        const paiement = await Paiement.create({
            commande: commande._id,
            utilisateur: req.utilisateur._id,
            idPaiementStripe: resultat.paymentIntentId,
            montant: commande.total,
            devise: commande.devise,
            clientSecret: resultat.clientSecret,
            statut: 'en_attente',
            methodePaiement: 'carte',
            metadata: new Map([
                ['commande_numero', commande.numeroCommande],
                ['utilisateur_email', commande.utilisateur.email],
            ]),
        });

        logger.info(
            `Session paiement créée: ${resultat.paymentIntentId} pour la commande ${commande.numeroCommande}`
        );

        res.status(200).json({
            success: true,
            session: {
                clientSecret: resultat.clientSecret,
                paymentIntentId: resultat.paymentIntentId,
                montant: commande.total,
                devise: commande.devise,
                paiementId: paiement._id,
            },
            commande: {
                numero: commande.numeroCommande,
                total: commande.total,
                devise: commande.devise,
            },
        });
    } catch (error) {
        logger.error('Erreur création session paiement:', error);
        next(error);
    }
};

// @desc    Confirmer un paiement
// @route   POST /api/paiements/confirmer
// @access  Privé
export const confirmerPaiement = async (req, res, next) => {
    const session = await Commande.startSession();
    session.startTransaction();

    try {
        const { paymentIntentId } = req.body;

        // Récupérer le paiement
        const paiement = await Paiement.findOne({
            idPaiementStripe: paymentIntentId,
            utilisateur: req.utilisateur._id,
        }).populate('commande');

        if (!paiement) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé',
            });
        }

        // Confirmer le paiement avec Stripe
        const resultat = await confirmerPaiementService(paymentIntentId); // <-- CORRECTION: Appel du service renommé

        if (!resultat.success) {
            await session.abortTransaction();
            session.endSession();

            // Enregistrer l'échec
            // NOTE: Supposons que paiement.enregistrerEchec existe sur le modèle Paiement
            await paiement.enregistrerEchec(resultat.error);

            return res.status(400).json({
                success: false,
                message: 'Erreur lors de la confirmation du paiement',
                error: resultat.error,
            });
        }

        // Mettre à jour le paiement selon le statut
        paiement.statut = resultat.statut === 'succeeded' ? 'reussi' : resultat.statut;
        paiement.paymentIntent = resultat.paymentIntent;
        paiement.tentatives += 1;

        // Si le paiement nécessite une action supplémentaire
        if (resultat.statut === 'requires_action') {
            paiement.clientSecret = resultat.clientSecret;
            await paiement.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json({
                success: true,
                statut: 'requiert_action',
                clientSecret: resultat.clientSecret,
                message: 'Action supplémentaire requise pour compléter le paiement',
            });
        }

        // Si le paiement est réussi
        if (resultat.statut === 'succeeded') {
            // Mettre à jour la commande
            paiement.commande.statutPaiement = 'paye';
            paiement.commande.datePaiement = new Date();
            paiement.commande.idPaiement = paymentIntentId;
            paiement.commande.statut = 'confirmee';

            await paiement.commande.save({ session });
            await paiement.save({ session });

            await session.commitTransaction();
            session.endSession();

            logger.info(
                `Paiement confirmé avec succès: ${paymentIntentId} pour la commande ${paiement.commande.numeroCommande}`
            );

            return res.status(200).json({
                success: true,
                statut: 'reussi',
                message: 'Paiement confirmé avec succès',
                commande: {
                    id: paiement.commande._id,
                    numero: paiement.commande.numeroCommande,
                    statut: paiement.commande.statut,
                },
            });
        }

        // Statut non géré
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            success: false,
            message: `Statut de paiement non géré: ${resultat.statut}`,
            statut: resultat.statut,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error('Erreur confirmation paiement:', error);
        next(error);
    }
};

// @desc    Rembourser un paiement
// @route   POST /api/paiements/:id/rembourser
// @access  Privé/Admin
export const rembourserPaiement = async (req, res, next) => {
    const session = await Commande.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { montant, raison } = req.body;

        // Récupérer le paiement
        const paiement = await Paiement.findById(id).populate('commande').session(session);

        if (!paiement) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé',
            });
        }

        // Vérifier que le paiement peut être remboursé
        // NOTE: Supposons que paiement.peutEtreRembourse est une propriété virtuelle ou une méthode
        if (!paiement.peutEtreRembourse) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: 'Ce paiement ne peut pas être remboursé',
            });
        }

        const montantARembourser = montant || paiement.montant - paiement.montantRembourse;
        const montantStripe = Math.round(montantARembourser * 100); // Conversion en centimes

        // Effectuer le remboursement avec Stripe
        const resultat = await effectuerRemboursement(
            paiement.idPaiementStripe,
            montantStripe,
            raison
        );

        if (!resultat.success) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: 'Erreur lors du remboursement',
                error: resultat.error,
            });
        }

        // Mettre à jour le paiement
        // NOTE: Supposons que paiement.traiterRemboursement existe sur le modèle Paiement
        await paiement.traiterRemboursement(montantARembourser, raison);

        // Mettre à jour la commande si remboursement complet
        if (paiement.montantRembourse >= paiement.montant) {
            paiement.commande.statutPaiement = 'rembourse';
            paiement.commande.statut = 'remboursee';
            await paiement.commande.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        logger.info(
            `Remboursement effectué: ${paiement.idPaiementStripe} - ${montantARembourser} ${paiement.devise}`
        );

        res.status(200).json({
            success: true,
            message: 'Remboursement effectué avec succès',
            remboursement: {
                id: resultat.remboursement.id,
                montant: montantARembourser,
                devise: paiement.devise,
                statut: resultat.remboursement.status,
            },
            paiement: {
                montantRembourse: paiement.montantRembourse,
                statut: paiement.statut,
            },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error('Erreur remboursement paiement:', error);
        next(error);
    }
};

// @desc    Webhook Stripe pour les événements de paiement
// @route   POST /api/paiements/webhook
// @access  Public (Stripe)
export const webhookStripe = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Vérifier la signature du webhook
        const resultat = verifierWebhook(req.body, sig, config.stripeWebhookSecret);

        if (!resultat.success) {
            logger.error('Signature webhook invalide:', resultat.error);
            return res.status(400).send(`Webhook Error: ${resultat.error}`);
        }

        event = resultat.event;

        // Gérer les différents types d'événements
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object);
                break;

            default:
                logger.info(`Événement Stripe non géré: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        logger.error('Erreur traitement webhook:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

// Gestionnaire pour les paiements réussis
const handlePaymentIntentSucceeded = async paymentIntent => {
    try {
        const paiement = await Paiement.findOne({ idPaiementStripe: paymentIntent.id })
            .populate('commande')
            .populate('utilisateur');

        if (!paiement) {
            logger.error(`Paiement non trouvé pour Payment Intent: ${paymentIntent.id}`);
            return;
        }

        // Mettre à jour le paiement
        paiement.statut = 'reussi';
        paiement.paymentIntent = paymentIntent;
        await paiement.save();

        // Mettre à jour la commande
        paiement.commande.statutPaiement = 'paye';
        paiement.commande.datePaiement = new Date();
        paiement.commande.idPaiement = paymentIntent.id;
        paiement.commande.statut = 'confirmee';
        await paiement.commande.save();

        logger.info(
            `Webhook: Paiement réussi pour la commande ${paiement.commande.numeroCommande}`
        );

        // TODO: Envoyer un email de confirmation au client
    } catch (error) {
        logger.error('Erreur traitement paiement réussi:', error);
    }
};

// Gestionnaire pour les paiements échoués
const handlePaymentIntentFailed = async paymentIntent => {
    try {
        const paiement = await Paiement.findOne({ idPaiementStripe: paymentIntent.id }).populate(
            'commande'
        );

        if (!paiement) {
            logger.error(`Paiement non trouvé pour Payment Intent échoué: ${paymentIntent.id}`);
            return;
        }

        // Mettre à jour le paiement
        paiement.statut = 'echoue';
        paiement.erreur = {
            code: paymentIntent.last_payment_error?.code || 'unknown',
            message: paymentIntent.last_payment_error?.message || 'Erreur inconnue',
            type: paymentIntent.last_payment_error?.type || 'api_error',
        };
        await paiement.save();

        logger.info(
            `Webhook: Paiement échoué pour la commande ${paiement.commande.numeroCommande}`
        );

        // TODO: Envoyer un email d'échec au client
    } catch (error) {
        logger.error('Erreur traitement paiement échoué:', error);
    }
};

// Gestionnaire pour les remboursements
const handleChargeRefunded = async charge => {
    try {
        const paiement = await Paiement.findOne({
            idPaiementStripe: charge.payment_intent,
        }).populate('commande');

        if (!paiement) {
            logger.error(`Paiement non trouvé pour remboursement: ${charge.payment_intent}`);
            return;
        }

        const montantRembourse = charge.refunded ? charge.amount_refunded / 100 : 0;

        // Mettre à jour le paiement
        await paiement.traiterRemboursement(montantRembourse, 'demande_client');

        // Mettre à jour la commande si remboursement complet
        if (paiement.montantRembourse >= paiement.montant) {
            paiement.commande.statutPaiement = 'rembourse';
            paiement.commande.statut = 'remboursee';
            await paiement.commande.save();
        }

        logger.info(
            `Webhook: Remboursement traité pour la commande ${paiement.commande.numeroCommande}`
        );
    } catch (error) {
        logger.error('Erreur traitement remboursement:', error);
    }
};

// @desc    Récupérer les détails d'un paiement
// @route   GET /api/paiements/:id
// @access  Privé
export const getPaiement = async (req, res, next) => {
    try {
        const { id } = req.params;

        const paiement = await Paiement.findOne({
            _id: id,
            utilisateur: req.utilisateur._id,
        })
            .populate('commande', 'numeroCommande total statut')
            .populate('utilisateur', 'nom prenom email');

        if (!paiement) {
            return res.status(404).json({
                success: false,
                message: 'Paiement non trouvé',
            });
        }

        res.status(200).json({
            success: true,
            paiement,
        });
    } catch (error) {
        logger.error('Erreur récupération paiement:', error);
        next(error);
    }
};

// @desc    Récupérer l'historique des paiements d'un utilisateur
// @route   GET /api/paiements
// @access  Privé
export const getHistoriquePaiements = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, statut } = req.query;

        let query = { utilisateur: req.utilisateur._id };
        if (statut) query.statut = statut;

        const paiements = await Paiement.find(query)
            .populate('commande', 'numeroCommande total')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Paiement.countDocuments(query);

        res.status(200).json({
            success: true,
            count: paiements.length,
            total,
            pagination: {
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
            paiements,
        });
    } catch (error) {
        logger.error('Erreur récupération historique paiements:', error);
        next(error);
    }
};
