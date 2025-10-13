import express from 'express';
// Importer les contrôleurs et middlewares
import {
    inscription,
    connexion,
    deconnexion,
    motDePasseOublie,
    reinitialiserMotDePasse,
    verifierCompte,
    renvoyerVerification,
    getUtilisateurConnecte,
} from '../controllers/authController.js';

// Importer les middlewares de validation et d'authentification
import {
    validateInscription,
    validateConnexion,
    validateMotDePasseOublie,
    validateReinitialiserMotDePasse,
} from '../middleware/validationMiddleware.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes publiques
router.post('/inscription', validateInscription, inscription);
router.post('/connexion', validateConnexion, connexion);
router.post('/mot-de-passe-oublie', validateMotDePasseOublie, motDePasseOublie);
router.put(
    '/reinitialiser-mot-de-passe/:token',
    validateReinitialiserMotDePasse,
    reinitialiserMotDePasse
);
router.get('/verifier/:token', verifierCompte);

// Routes protégées
router.use(proteger); // Toutes les routes suivantes nécessitent une authentification

router.post('/deconnexion', deconnexion);
router.post('/renvoyer-verification', renvoyerVerification);
router.get('/moi', getUtilisateurConnecte);

export default router;
