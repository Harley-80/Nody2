import express from 'express';
import {
    getProduits,
    getProduit,
    getProduitParSlug,
    getNouveauxProduits,
    getProduitsEnPromotion,
    getProduitsPopulaires,
    ajouterAvis,
    creerProduit,
    mettreAJourProduit,
    supprimerProduit,
} from '../controllers/produitsController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.get('/', getProduits);
router.get('/nouveautes', getNouveauxProduits);
router.get('/promotions', getProduitsEnPromotion);
router.get('/populaires', getProduitsPopulaires);
router.get('/slug/:slug', getProduitParSlug);
router.get('/:id', getProduit);

// Routes protégées
router.use(proteger);

// Avis - accessible à tous les utilisateurs connectés
router.post('/:id/avis', ajouterAvis);

// Création/modification de produits - Vendeurs et Admin
router.use(autoriser('vendeur', 'admin'));

router.post('/', creerProduit);
router.put('/:id', mettreAJourProduit);
router.delete('/:id', supprimerProduit);

export default router;
