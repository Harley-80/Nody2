import express from 'express';

// Importer les contrôleurs et middlewares
import {
    getProfil,
    mettreAJourProfil,
    ajouterAdresse,
    mettreAJourAdresse,
    supprimerAdresse,
    changerMotDePasse,
} from '../controllers/utilisateursController.js';
import { proteger } from '../middleware/authMiddleware.js';
import { validateProfil } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(proteger);

router.get('/profil', getProfil);
router.put('/profil', validateProfil, mettreAJourProfil);
router.put('/changer-mot-de-passe', changerMotDePasse);

// Routes adresses
router.post('/adresses', ajouterAdresse);
router.put('/adresses/:adresseId', mettreAJourAdresse);
router.delete('/adresses/:adresseId', supprimerAdresse);

export default router;
