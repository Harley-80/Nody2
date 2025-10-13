import Commande from '../models/commandeModel.js';
import Panier from '../models/panierModel.js';
import Produit from '../models/produitModel.js';
import Utilisateur from '../models/utilisateurModel.js';
import { logger } from '../utils/logger.js';

// @desc    Créer une nouvelle commande
// @route   POST /api/commandes
// @access  Privé
export const creerCommande = async (req, res, next) => {
    const session = await Commande.startSession();
    session.startTransaction();

    try {
        const {
            adresseLivraison,
            adresseFacturation,
            methodePaiement,
            noteClient,
            estCommandeExpress,
        } = req.body;

        // Récupérer le panier de l'utilisateur
        const panier = await Panier.findOne({ utilisateur: req.utilisateur._id }).populate(
            'articles.produit',
            'nom images variantes estActive'
        );

        // Vérifier que le panier n'est pas vide
        if (!panier || panier.articles.length === 0) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: 'Le panier est vide',
            });
        }

        // Vérifier la disponibilité et préparer les articles de la commande
        const articlesCommande = [];
        const produitsAMettreAJour = [];

        for (const articlePanier of panier.articles) {
            const produit = await Produit.findById(articlePanier.produit._id).session(session);

            // Si le produit n'existe plus ou n'est pas actif
            if (!produit || !produit.estActive) {
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    success: false,
                    message: `Le produit "${articlePanier.produit.nom}" n'est plus disponible`,
                });
            }

            // Vérifier la disponibilité de la variante
            const variante = produit.variantes.find(
                v =>
                    v.taille === articlePanier.variante.taille &&
                    v.couleur === articlePanier.variante.couleur &&
                    v.estActive
            );

            // Si la variante n'existe pas ou n'est pas active
            if (!variante) {
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    success: false,
                    message: `La variante sélectionnée pour "${articlePanier.produit.nom}" n'est plus disponible`,
                });
            }

            // Vérifier le stock
            if (variante.quantite < articlePanier.quantite) {
                await session.abortTransaction();
                session.endSession();

                return res.status(400).json({
                    success: false,
                    message: `Stock insuffisant pour "${articlePanier.produit.nom}". Quantité disponible: ${variante.quantite}`,
                });
            }

            // Mettre à jour le stock
            variante.quantite -= articlePanier.quantite;
            produitsAMettreAJour.push(produit.save({ session }));

            // Préparer l'article pour la commande
            const prix = variante.prixPromo || variante.prix;

            articlesCommande.push({
                produit: articlePanier.produit._id,
                nomProduit: articlePanier.produit.nom,
                image: articlePanier.produit.images[0],
                prix,
                quantite: articlePanier.quantite,
                variante: {
                    taille: articlePanier.variante.taille,
                    couleur: articlePanier.variante.couleur,
                    sku: variante.sku,
                },
                sousTotal: prix * articlePanier.quantite,
            });
        }

        // Calculer les frais de livraison A Revoir Modéliser la Logique de Tarification
        const fraisLivraison = estCommandeExpress ? 2000 : 1500; // En centimes/unité de base

        // Créer la commande
        const commande = new Commande({
            utilisateur: req.utilisateur._id,
            articles: articlesCommande,
            adresseLivraison,
            adresseFacturation: adresseFacturation || adresseLivraison,
            methodePaiement,
            fraisLivraison,
            reduction: panier.reduction,
            codePromo: panier.codePromo,
            noteClient,
            estCommandeExpress,
            delaiLivraison: estCommandeExpress ? 2 : 7,
            devise: panier.devise,
        });

        await commande.save({ session });

        // Vider le panier
        await panier.vider();

        // Mettre à jour les stocks
        await Promise.all(produitsAMettreAJour);

        await session.commitTransaction();
        session.endSession();

        // Peupler les données pour la réponse
        const commandeAvecDetails = await Commande.findById(commande._id)
            .populate('articles.produit', 'nom images slug')
            .populate('utilisateur', 'nom prenom email');

        logger.info(
            `Nouvelle commande créée: ${commande.numeroCommande} par ${req.utilisateur.email}`
        );

        res.status(201).json({
            success: true,
            message: 'Commande créée avec succès',
            commande: commandeAvecDetails,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error('Erreur création commande:', error);
        next(error);
    }
};

// @desc    Récupérer les commandes de l'utilisateur
// @route   GET /api/commandes
// @access  Privé
export const getCommandesUtilisateur = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, statut } = req.query;

        const commandes = await Commande.trouverParUtilisateur(req.utilisateur._id, {
            page: parseInt(page),
            limit: parseInt(limit),
            statut,
        });

        res.status(200).json({
            success: true,
            count: commandes.length,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
            },
            commandes,
        });
    } catch (error) {
        logger.error('Erreur récupération commandes utilisateur:', error);
        next(error);
    }
};

// @desc    Récupérer une commande spécifique
// @route   GET /api/commandes/:id
// @access  Privé
export const getCommande = async (req, res, next) => {
    try {
        const { id } = req.params;

        const commande = await Commande.findOne({
            _id: id,
            utilisateur: req.utilisateur._id,
        })
            .populate('articles.produit', 'nom images slug description')
            .populate('utilisateur', 'nom prenom email telephone');

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée',
            });
        }

        res.status(200).json({
            success: true,
            commande,
        });
    } catch (error) {
        logger.error('Erreur récupération commande:', error);
        next(error);
    }
};

// @desc    Annuler une commande
// @route   PUT /api/commandes/:id/annuler
// @access  Privé
export const annulerCommande = async (req, res, next) => {
    const session = await Commande.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { raison } = req.body;

        const commande = await Commande.findOne({
            _id: id,
            utilisateur: req.utilisateur._id,
        }).session(session);

        if (!commande) {
            await session.abortTransaction();
            session.endSession();

            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée',
            });
        }

        if (!commande.peutEtreAnnulee) {
            await session.abortTransaction();
            session.endSession();

            return res.status(400).json({
                success: false,
                message: 'Cette commande ne peut pas être annulée',
            });
        }

        // Restaurer les stocks
        for (const article of commande.articles) {
            const produit = await Produit.findById(article.produit).session(session);
            if (produit) {
                const variante = produit.variantes.find(
                    v =>
                        v.taille === article.variante.taille &&
                        v.couleur === article.variante.couleur
                );

                if (variante) {
                    variante.quantite += article.quantite;
                    await produit.save({ session });
                }
            }
        }

        // Mettre à jour le statut de la commande
        await commande.mettreAJourStatut('annulee');

        await session.commitTransaction();
        session.endSession();

        logger.info(`Commande annulée: ${commande.numeroCommande} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Commande annulée avec succès',
            commande,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        logger.error('Erreur annulation commande:', error);
        next(error);
    }
};

// @desc    Suivre une commande
// @route   GET /api/commandes/:id/suivi
// @access  Privé
export const suivreCommande = async (req, res, next) => {
    try {
        const { id } = req.params;

        const commande = await Commande.findOne({
            _id: id,
            utilisateur: req.utilisateur._id,
        }).select('numeroCommande statut suiviLivraison datesStatut delaiLivraison');

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée',
            });
        }

        // Générer l'historique des statuts
        const historique = Object.entries(commande.datesStatut)
            .filter(([_, date]) => date)
            .map(([statut, date]) => ({
                statut,
                date,
                description: getDescriptionStatut(statut),
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        res.status(200).json({
            success: true,
            suivi: {
                numeroCommande: commande.numeroCommande,
                statutActuel: commande.statut,
                descriptionStatut: getDescriptionStatut(commande.statut),
                historique,
                suiviLivraison: commande.suiviLivraison,
                delaiLivraison: commande.delaiLivraison,
            },
        });
    } catch (error) {
        logger.error('Erreur suivi commande:', error);
        next(error);
    }
};

// Fonction utilitaire pour les descriptions de statut
const getDescriptionStatut = statut => {
    const descriptions = {
        en_attente: 'Commande en attente de confirmation',
        confirmee: 'Commande confirmée',
        en_preparation: 'En cours de préparation',
        expediee: 'Expédiée',
        livree: 'Livrée',
        annulee: 'Annulée',
        remboursee: 'Remboursée',
    };

    return descriptions[statut] || 'Statut inconnu';
};

// @desc    Obtenir les statistiques des commandes (Admin)
// @route   GET /api/commandes/admin/statistiques
// @access  Privé/Admin
export const getStatistiquesCommandes = async (req, res, next) => {
    try {
        const statistiques = await Commande.getStatistiques();

        res.status(200).json({
            success: true,
            statistiques,
        });
    } catch (error) {
        logger.error('Erreur statistiques commandes:', error);
        next(error);
    }
};

// @desc    Récupérer toutes les commandes (Admin)
// @route   GET /api/commandes/admin/commandes
// @access  Privé/Admin
export const getToutesCommandes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, statut, dateDebut, dateFin } = req.query;

        let query = {};

        if (statut) query.statut = statut;
        if (dateDebut || dateFin) {
            query.createdAt = {};
            if (dateDebut) query.createdAt.$gte = new Date(dateDebut);
            if (dateFin) query.createdAt.$lte = new Date(dateFin);
        }

        const commandes = await Commande.find(query)
            .populate('utilisateur', 'nom prenom email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Commande.countDocuments(query);

        res.status(200).json({
            success: true,
            count: commandes.length,
            total,
            pagination: {
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
            commandes,
        });
    } catch (error) {
        logger.error('Erreur récupération toutes les commandes:', error);
        next(error);
    }
};

// @desc    Mettre à jour le statut d'une commande (Admin)
// @route   PUT /api/commandes/admin/:id/statut
// @access  Privé/Admin
export const mettreAJourStatutCommande = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statut, numeroSuivi, transporteur, urlSuivi } = req.body;

        const commande = await Commande.findById(id);

        if (!commande) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée',
            });
        }

        await commande.mettreAJourStatut(statut, {
            numeroSuivi,
            transporteur,
            urlSuivi,
        });

        logger.info(
            `Statut commande mis à jour: ${commande.numeroCommande} -> ${statut} par ${req.utilisateur.email}`
        );

        res.status(200).json({
            success: true,
            message: 'Statut de commande mis à jour',
            commande,
        });
    } catch (error) {
        logger.error('Erreur mise à jour statut commande:', error);
        next(error);
    }
};
