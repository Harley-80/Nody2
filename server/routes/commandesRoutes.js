import express from 'express';
import {
    creerCommande,
    getCommandesUtilisateur,
    getCommande,
    annulerCommande,
    suivreCommande,
    getStatistiquesCommandes,
    getToutesCommandes,
    mettreAJourStatutCommande,
} from '../controllers/commandesController.js';
import { proteger, autoriser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes utilisateur
router.use(proteger);

router.post('/', creerCommande);
router.get('/', getCommandesUtilisateur);
router.get('/:id', getCommande);
router.put('/:id/annuler', annulerCommande);
router.get('/:id/suivi', suivreCommande);

// Routes admin
router.use(autoriser('admin'));

router.get('/admin/statistiques', getStatistiquesCommandes);
router.get('/admin/commandes', getToutesCommandes);
router.put('/admin/:id/statut', mettreAJourStatutCommande);

export default router;
