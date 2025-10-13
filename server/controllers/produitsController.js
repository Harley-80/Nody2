import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import { logger } from '../utils/logger.js';

// @desc    Récupérer tous les produits avec filtres
// @route   GET /api/produits
// @access  Public
export const getProduits = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 12,
            sort = 'createdAt',
            order = 'desc',
            search,
            categorie,
            sousCategorie,
            marque,
            prixMin,
            prixMax,
            tailles,
            couleurs,
            enStock,
            enPromotion,
            estNouveau,
            estPopulaire,
        } = req.query;

        // Construction de la requête de base
        let query = { estActive: true };

        // Recherche texte
        if (search) {
            query.$or = [
                { nom: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { marque: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        // Filtre par catégorie
        if (categorie) {
            const categorieDoc = await Categorie.findOne({ slug: categorie });
            if (categorieDoc) {
                const sousCategories = await categorieDoc.getToutesSousCategories();
                const idsCategories = [categorieDoc._id, ...sousCategories.map(sc => sc._id)];
                query.categorie = { $in: idsCategories };
            }
        }

        // Filtres supplémentaires
        if (marque) query.marque = { $regex: marque, $options: 'i' };
        if (prixMin) query.prixMin = { $gte: Number(prixMin) };
        if (prixMax) query.prixMax = { $lte: Number(prixMax) };
        if (enPromotion) query.estEnPromotion = enPromotion === 'true';
        if (estNouveau) query.estNouveau = estNouveau === 'true';
        if (estPopulaire) query.estPopulaire = estPopulaire === 'true';

        // Filtres sur les variantes
        if (tailles) {
            const taillesArray = tailles.split(',');
            query['variantes.taille'] = { $in: taillesArray };
            query['variantes.estActive'] = true;
        }

        if (couleurs) {
            const couleursArray = couleurs.split(',');
            query['variantes.couleur'] = { $in: couleursArray };
            query['variantes.estActive'] = true;
        }

        if (enStock === 'true') {
            query['variantes.quantite'] = { $gt: 0 };
        }

        // Options de tri
        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        // Exécution de la requête
        const produits = await Produit.find(query)
            .populate('categorie', 'nom slug')
            .populate('vendeur', 'nom prenom')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Total pour la pagination
        const total = await Produit.countDocuments(query);

        // Agrégations pour les filtres disponibles
        const marques = await Produit.distinct('marque', query);
        const taillesDisponibles = await Produit.distinct('variantes.taille', {
            ...query,
            'variantes.quantite': { $gt: 0 },
        });
        const couleursDisponibles = await Produit.distinct('variantes.couleur', {
            ...query,
            'variantes.quantite': { $gt: 0 },
        });

        res.status(200).json({
            success: true,
            count: produits.length,
            total,
            pagination: {
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
            filtres: {
                marques: marques.filter(m => m).sort(),
                tailles: taillesDisponibles.filter(t => t).sort(),
                couleurs: couleursDisponibles.filter(c => c).sort(),
                prix: {
                    min: await Produit.findOne(query).sort({ prixMin: 1 }).select('prixMin'),
                    max: await Produit.findOne(query).sort({ prixMax: -1 }).select('prixMax'),
                },
            },
            produits,
        });
    } catch (error) {
        logger.error('Erreur récupération produits:', error);
        next(error);
    }
};

// @desc    Récupérer un produit par son ID
// @route   GET /api/produits/:id
// @access  Public
export const getProduit = async (req, res, next) => {
    try {
        const { id } = req.params;

        const produit = await Produit.findById(id)
            .populate('categorie', 'nom slug parent')
            .populate('vendeur', 'nom prenom')
            .populate('avis.utilisateur', 'nom prenom');

        if (!produit) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé',
            });
        }

        // Produits similaires (même catégorie)
        const produitsSimilaires = await Produit.find({
            categorie: produit.categorie._id,
            _id: { $ne: produit._id },
            estActive: true,
        })
            .limit(4)
            .select('nom prixMin prixMax images slug');

        res.status(200).json({
            success: true,
            produit,
            produitsSimilaires,
        });
    } catch (error) {
        logger.error('Erreur récupération produit:', error);
        next(error);
    }
};

// @desc    Récupérer un produit par son slug
// @route   GET /api/produits/slug/:slug
// @access  Public
export const getProduitParSlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const produit = await Produit.findOne({ slug, estActive: true })
            .populate('categorie', 'nom slug parent')
            .populate('vendeur', 'nom prenom')
            .populate('avis.utilisateur', 'nom prenom');

        if (!produit) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé',
            });
        }

        // Produits similaires
        const produitsSimilaires = await Produit.find({
            categorie: produit.categorie._id,
            _id: { $ne: produit._id },
            estActive: true,
        })
            .limit(4)
            .select('nom prixMin prixMax images slug');

        res.status(200).json({
            success: true,
            produit,
            produitsSimilaires,
        });
    } catch (error) {
        logger.error('Erreur récupération produit par slug:', error);
        next(error);
    }
};

// @desc    Récupérer les nouveaux produits
// @route   GET /api/produits/nouveautes
// @access  Public
export const getNouveauxProduits = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const produits = await Produit.trouverNouveaux(parseInt(limit))
            .populate('categorie', 'nom slug')
            .select(
                'nom descriptionCourte prixMin prixMax images slug noteMoyenne estEnPromotion pourcentagePromo'
            );

        res.status(200).json({
            success: true,
            count: produits.length,
            produits,
        });
    } catch (error) {
        logger.error('Erreur récupération nouveaux produits:', error);
        next(error);
    }
};

// @desc    Récupérer les produits en promotion
// @route   GET /api/produits/promotions
// @access  Public
export const getProduitsEnPromotion = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const produits = await Produit.trouverEnPromotion()
            .populate('categorie', 'nom slug')
            .select(
                'nom descriptionCourte prixMin prixMax images slug noteMoyenne estEnPromotion pourcentagePromo'
            )
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: produits.length,
            produits,
        });
    } catch (error) {
        logger.error('Erreur récupération produits en promotion:', error);
        next(error);
    }
};

// @desc    Récupérer les produits populaires
// @route   GET /api/produits/populaires
// @access  Public
export const getProduitsPopulaires = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const produits = await Produit.find({
            estActive: true,
            estPopulaire: true,
        })
            .populate('categorie', 'nom slug')
            .select(
                'nom descriptionCourte prixMin prixMax images slug noteMoyenne estEnPromotion pourcentagePromo'
            )
            .sort({ quantiteVendue: -1, noteMoyenne: -1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: produits.length,
            produits,
        });
    } catch (error) {
        logger.error('Erreur récupération produits populaires:', error);
        next(error);
    }
};

// @desc    Ajouter un avis à un produit
// @route   POST /api/produits/:id/avis
// @access  Privé
export const ajouterAvis = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { note, commentaire } = req.body;

        const produit = await Produit.findById(id);

        if (!produit) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé',
            });
        }

        // Vérifier si l'utilisateur a déjà donné un avis
        const avisExistant = produit.avis.find(
            avis => avis.utilisateur.toString() === req.utilisateur._id.toString()
        );

        if (avisExistant) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà donné un avis pour ce produit',
            });
        }

        // Ajouter l'avis
        produit.avis.push({
            utilisateur: req.utilisateur._id,
            note,
            commentaire,
        });

        // Mettre à jour la note moyenne
        await produit.mettreAJourNoteMoyenne();

        logger.info(`Avis ajouté au produit ${produit.nom} par ${req.utilisateur.email}`);

        res.status(201).json({
            success: true,
            message: 'Avis ajouté avec succès',
            produit: {
                noteMoyenne: produit.noteMoyenne,
                nombreAvis: produit.nombreAvis,
                avis: produit.avis,
            },
        });
    } catch (error) {
        logger.error('Erreur ajout avis:', error);
        next(error);
    }
};

// @desc    Créer un produit (Vendeur/Admin)
// @route   POST /api/produits
// @access  Privé/Vendeur
export const creerProduit = async (req, res, next) => {
    try {
        const {
            nom,
            description,
            descriptionCourte,
            categorie,
            marque,
            variantes,
            images,
            tags,
            caracteristiques,
            estEnPromotion,
            pourcentagePromo,
            estNouveau,
            estPopulaire,
            seuilAlerteStock,
        } = req.body;

        // Vérifier que la catégorie existe
        const categorieExistante = await Categorie.findById(categorie);
        if (!categorieExistante) {
            return res.status(400).json({
                success: false,
                message: 'Catégorie non trouvée',
            });
        }

        const produit = await Produit.create({
            nom,
            description,
            descriptionCourte,
            categorie,
            marque,
            variantes,
            images,
            tags,
            caracteristiques,
            estEnPromotion: estEnPromotion || false,
            pourcentagePromo: pourcentagePromo || 0,
            estNouveau: estNouveau || false,
            estPopulaire: estPopulaire || false,
            seuilAlerteStock: seuilAlerteStock || 5,
            vendeur: req.utilisateur._id,
        });

        logger.info(`Nouveau produit créé: ${produit.nom} par ${req.utilisateur.email}`);

        res.status(201).json({
            success: true,
            message: 'Produit créé avec succès',
            produit,
        });
    } catch (error) {
        logger.error('Erreur création produit:', error);
        next(error);
    }
};

// @desc    Mettre à jour un produit (Vendeur/Admin)
// @route   PUT /api/produits/:id
// @access  Privé/Vendeur
export const mettreAJourProduit = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let produit = await Produit.findById(id);

        if (!produit) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé',
            });
        }

        // Vérifier les permissions (vendeur ne peut modifier que ses propres produits)
        if (
            req.utilisateur.role === 'vendeur' &&
            produit.vendeur.toString() !== req.utilisateur._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à modifier ce produit',
            });
        }

        produit = await Produit.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

        logger.info(`Produit mis à jour: ${produit.nom} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Produit mis à jour avec succès',
            produit,
        });
    } catch (error) {
        logger.error('Erreur mise à jour produit:', error);
        next(error);
    }
};

// @desc    Supprimer un produit (Vendeur/Admin)
// @route   DELETE /api/produits/:id
// @access  Privé/Vendeur
export const supprimerProduit = async (req, res, next) => {
    try {
        const { id } = req.params;

        const produit = await Produit.findById(id);

        if (!produit) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé',
            });
        }

        // Vérifier les permissions
        if (
            req.utilisateur.role === 'vendeur' &&
            produit.vendeur.toString() !== req.utilisateur._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé à supprimer ce produit',
            });
        }

        // Soft delete - désactiver le produit
        produit.estActive = false;
        await produit.save();

        logger.info(`Produit supprimé (soft): ${produit.nom} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Produit supprimé avec succès',
        });
    } catch (error) {
        logger.error('Erreur suppression produit:', error);
        next(error);
    }
};
