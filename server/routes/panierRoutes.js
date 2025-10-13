import express from 'express';
import {
    getPanier,
    ajouterArticle,
    mettreAJourQuantite,
    supprimerArticle,
    viderPanier,
    appliquerCodePromo,
    supprimerCodePromo,
} from '../controllers/panierController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(proteger);

router.get('/', getPanier);
router.post('/articles', ajouterArticle);
router.put('/articles/:articleId', mettreAJourQuantite);
router.delete('/articles/:articleId', supprimerArticle);
router.delete('/', viderPanier);
router.post('/code-promo', appliquerCodePromo);
router.delete('/code-promo', supprimerCodePromo);

export default router;
