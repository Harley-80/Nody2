import express from 'express';
import {
    getCategories,
    getCategoriesRacines,
    getCategorieParSlug,
    getArbreCategories,
    creerCategorie,
    mettreAJourCategorie,
    supprimerCategorie,
} from '../controllers/categorieController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.get('/', getCategories);
router.get('/racines', getCategoriesRacines);
router.get('/arbre/complet', getArbreCategories);
router.get('/:slug', getCategorieParSlug);

// Routes protégées (Admin uniquement)
router.use(proteger);
router.use(autoriser('admin'));

router.post('/', creerCategorie);
router.put('/:id', mettreAJourCategorie);
router.delete('/:id', supprimerCategorie);

export default router;
