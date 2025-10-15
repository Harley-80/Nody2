import Utilisateur from '../models/utilisateurModel.js';
import { logger } from '../utils/logger.js';

// @desc    Obtenir le profil de l'utilisateur connecté
// @route   GET /api/utilisateurs/profil
// @access  Privé
export const getProfil = async (req, res, next) => {
    try {
        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        res.status(200).json({
            success: true,
            utilisateur: {
                _id: utilisateur._id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                genre: utilisateur.genre,
                dateNaissance: utilisateur.dateNaissance,
                role: utilisateur.role,
                estVerifie: utilisateur.estVerifie,
                preferences: utilisateur.preferences,
                adresses: utilisateur.adresses,
                avatar: utilisateur.avatar,
                dateDerniereConnexion: utilisateur.dateDerniereConnexion,
                createdAt: utilisateur.createdAt,
            },
        });
    } catch (error) {
        logger.error('Erreur récupération profil:', error);
        next(error);
    }
};

// @desc    Mettre à jour le profil
// @route   PUT /api/utilisateurs/profil
// @access  Privé
export const mettreAJourProfil = async (req, res, next) => {
    try {
        const champsAutorises = {
            nom: req.body.nom,
            prenom: req.body.prenom,
            telephone: req.body.telephone,
            genre: req.body.genre,
            dateNaissance: req.body.dateNaissance,
            'preferences.newsletter': req.body.newsletter,
            'preferences.notifications': req.body.notifications,
            'preferences.devise': req.body.devise,
            'preferences.langue': req.body.langue,
        };

        // Nettoyer les champs undefined
        Object.keys(champsAutorises).forEach(key => {
            if (champsAutorises[key] === undefined) {
                delete champsAutorises[key];
            }
        });

        // Mettre à jour l'utilisateur
        const utilisateur = await Utilisateur.findByIdAndUpdate(
            req.utilisateur._id,
            champsAutorises,
            {
                new: true,
                runValidators: true,
            }
        );

        // Retourner le profil mis à jour
        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            utilisateur: {
                _id: utilisateur._id,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                email: utilisateur.email,
                telephone: utilisateur.telephone,
                genre: utilisateur.genre,
                dateNaissance: utilisateur.dateNaissance,
                role: utilisateur.role,
                estVerifie: utilisateur.estVerifie,
                preferences: utilisateur.preferences,
                adresses: utilisateur.adresses,
                avatar: utilisateur.avatar,
            },
        });
    } catch (error) {
        logger.error('Erreur mise à jour profil:', error);
        next(error);
    }
};

// @desc    Ajouter une adresse
// @route   POST /api/utilisateurs/adresses
// @access  Privé
export const ajouterAdresse = async (req, res, next) => {
    try {
        const { rue, ville, codePostal, pays, estAdressePrincipale } = req.body;

        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        // Si c'est l'adresse principale, désactiver les autres
        if (estAdressePrincipale) {
            utilisateur.adresses.forEach(adresse => {
                adresse.estAdressePrincipale = false;
            });
        }

        // Ajouter la nouvelle adresse
        utilisateur.adresses.push({
            rue,
            ville,
            codePostal,
            pays: pays || 'Sénégal',
            estAdressePrincipale: estAdressePrincipale || utilisateur.adresses.length === 0,
        });

        await utilisateur.save();

        // Retourner la liste mise à jour des adresses
        res.status(201).json({
            success: true,
            message: 'Adresse ajoutée avec succès',
            adresses: utilisateur.adresses,
        });
    } catch (error) {
        logger.error('Erreur ajout adresse:', error);
        next(error);
    }
};

// @desc    Mettre à jour une adresse
// @route   PUT /api/utilisateurs/adresses/:adresseId
// @access  Privé
export const mettreAJourAdresse = async (req, res, next) => {
    try {
        const { adresseId } = req.params;
        const { rue, ville, codePostal, pays, estAdressePrincipale } = req.body;

        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        const adresse = utilisateur.adresses.id(adresseId);

        // Vérifier si l'adresse existe
        if (!adresse) {
            return res.status(404).json({
                success: false,
                message: 'Adresse non trouvée',
            });
        }

        // Si on définit cette adresse comme principale
        if (estAdressePrincipale) {
            utilisateur.adresses.forEach(addr => {
                addr.estAdressePrincipale = addr._id.toString() === adresseId;
            });
        }

        // Mettre à jour les champs
        if (rue) adresse.rue = rue;
        if (ville) adresse.ville = ville;
        if (codePostal) adresse.codePostal = codePostal;
        if (pays) adresse.pays = pays;
        if (estAdressePrincipale !== undefined) {
            adresse.estAdressePrincipale = estAdressePrincipale;
        }

        await utilisateur.save();

        // Retourner la liste mise à jour des adresses
        res.status(200).json({
            success: true,
            message: 'Adresse mise à jour avec succès',
            adresses: utilisateur.adresses,
        });
    } catch (error) {
        logger.error('Erreur mise à jour adresse:', error);
        next(error);
    }
};

// @desc    Supprimer une adresse
// @route   DELETE /api/utilisateurs/adresses/:adresseId
// @access  Privé
export const supprimerAdresse = async (req, res, next) => {
    try {
        const { adresseId } = req.params;

        const utilisateur = await Utilisateur.findById(req.utilisateur._id);

        const adresse = utilisateur.adresses.id(adresseId);

        if (!adresse) {
            return res.status(404).json({
                success: false,
                message: 'Adresse non trouvée',
            });
        }

        // Ne pas permettre de supprimer la dernière adresse
        if (utilisateur.adresses.length <= 1) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer la dernière adresse',
            });
        }

        adresse.deleteOne();

        await utilisateur.save();

        res.status(200).json({
            success: true,
            message: 'Adresse supprimée avec succès',
            adresses: utilisateur.adresses,
        });
    } catch (error) {
        logger.error('Erreur suppression adresse:', error);
        next(error);
    }
};

// @desc    Changer le mot de passe
// @route   PUT /api/utilisateurs/changer-mot-de-passe
// @access  Privé
export const changerMotDePasse = async (req, res, next) => {
    try {
        const { motDePasseActuel, nouveauMotDePasse } = req.body;

        const utilisateur = await Utilisateur.findById(req.utilisateur._id).select('+motDePasse');

        // Vérifier le mot de passe actuel
        const estMotDePasseCorrect = await utilisateur.comparerMotDePasse(motDePasseActuel);

        if (!estMotDePasseCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Mot de passe actuel incorrect',
            });
        }

        // Mettre à jour le mot de passe
        utilisateur.motDePasse = nouveauMotDePasse;
        await utilisateur.save();

        logger.info(`Mot de passe changé pour: ${utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Mot de passe changé avec succès',
        });
    } catch (error) {
        logger.error('Erreur changement mot de passe:', error);
        next(error);
    }
};
