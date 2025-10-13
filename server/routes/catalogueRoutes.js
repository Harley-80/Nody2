import express from 'express';
import {
    rechercheAvancee,
    getStatistiquesCatalogue,
    getRecommandations,
} from '../controllers/catalogueController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.get('/recherche', rechercheAvancee);
router.get('/statistiques', getStatistiquesCatalogue);

// Routes protégées
router.get('/recommandations', proteger, getRecommandations);

export default router;
