import express from 'express';
import {
    creerSessionPaiement,
    confirmerPaiement,
    rembourserPaiement,
    webhookStripe,
    getPaiement,
    getHistoriquePaiements,
} from '../controllers/paiementsController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook Stripe doit être public et sans body parser
router.post('/webhook', express.raw({ type: 'application/json' }), webhookStripe);

// Routes protégées
router.use(proteger);

router.post('/creer-session', creerSessionPaiement);
router.post('/confirmer', confirmerPaiement);
router.get('/', getHistoriquePaiements);
router.get('/:id', getPaiement);

// Routes admin pour les remboursements
router.post('/:id/rembourser', autoriser('admin'), rembourserPaiement);

export default router;
