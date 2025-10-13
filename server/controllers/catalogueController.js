import Produit from '../models/produitModel.js';
import Categorie from '../models/categorieModel.js';
import { logger } from '../utils/logger.js';

// @desc    Recherche avancée dans le catalogue
// @route   GET /api/catalogue/recherche
// @access  Public
export const rechercheAvancee = async (req, res, next) => {
    try {
        const {
            q,
            categories,
            marques,
            prixMin,
            prixMax,
            tailles,
            couleurs,
            sort = 'pertinence',
            page = 1,
            limit = 12,
        } = req.query;

        let query = { estActive: true };

        // Recherche texte
        if (q) {
            query.$text = { $search: q };
        }

        // Filtres par catégories
        if (categories) {
            const categoriesArray = categories.split(',');
            const categoriesDocs = await Categorie.find({ slug: { $in: categoriesArray } });
            const categoriesIds = categoriesDocs.flatMap(cat => [cat._id, ...cat.sousCategories]);
            query.categorie = { $in: categoriesIds };
        }

        // Autres filtres
        if (marques) {
            const marquesArray = marques.split(',');
            query.marque = { $in: marquesArray };
        }

        if (prixMin || prixMax) {
            query.prixMin = {};
            if (prixMin) query.prixMin.$gte = Number(prixMin);
            if (prixMax) query.prixMin.$lte = Number(prixMax);
        }

        if (tailles) {
            const taillesArray = tailles.split(',');
            query['variantes.taille'] = { $in: taillesArray };
        }

        if (couleurs) {
            const couleursArray = couleurs.split(',');
            query['variantes.couleur'] = { $in: couleursArray };
        }

        // Options de tri
        const sortOptions = {};
        switch (sort) {
            case 'prix-croissant':
                sortOptions.prixMin = 1;
                break;
            case 'prix-decroissant':
                sortOptions.prixMin = -1;
                break;
            case 'nouveautes':
                sortOptions.createdAt = -1;
                break;
            case 'populaires':
                sortOptions.quantiteVendue = -1;
                break;
            case 'notes':
                sortOptions.noteMoyenne = -1;
                break;
            default: // pertinence
                if (q) {
                    sortOptions.score = { $meta: 'textScore' };
                } else {
                    sortOptions.createdAt = -1;
                }
        }

        // Pagination et sélection des champs
        const produits = await Produit.find(query)
            .populate('categorie', 'nom slug')
            .sort(sortOptions)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select(q ? { score: { $meta: 'textScore' } } : {});

        const total = await Produit.countDocuments(query);

        // Agrégations pour les suggestions
        const suggestions = {
            categories: await Categorie.aggregate([
                { $match: { estActive: true } },
                { $project: { nom: 1, slug: 1, count: 1 } },
            ]),
            marques: await Produit.distinct('marque', query),
            prixRange: {
                min: await Produit.findOne().sort({ prixMin: 1 }).select('prixMin'),
                max: await Produit.findOne().sort({ prixMax: -1 }).select('prixMax'),
            },
        };

        res.status(200).json({
            success: true,
            query: q,
            count: produits.length,
            total,
            pagination: {
                page: Number(page),
                pages: Math.ceil(total / limit),
                limit: Number(limit),
            },
            suggestions,
            produits,
        });
    } catch (error) {
        logger.error('Erreur recherche avancée:', error);
        next(error);
    }
};

// @desc    Obtenir les statistiques du catalogue
// @route   GET /api/catalogue/statistiques
// @access  Public
export const getStatistiquesCatalogue = async (req, res, next) => {
    try {
        const totalProduits = await Produit.countDocuments({ estActive: true });
        const totalCategories = await Categorie.countDocuments({ estActive: true });
        const produitsEnPromotion = await Produit.countDocuments({
            estActive: true,
            estEnPromotion: true,
        });
        const nouveauxProduits = await Produit.countDocuments({
            estActive: true,
            estNouveau: true,
        });

        // Marques les plus populaires
        const marquesPopulaires = await Produit.aggregate([
            { $match: { estActive: true, marque: { $exists: true, $ne: '' } } },
            { $group: { _id: '$marque', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Catégories avec le plus de produits
        const categoriesPopulaires = await Categorie.aggregate([
            { $match: { estActive: true } },
            {
                $lookup: {
                    from: 'produits',
                    localField: '_id',
                    foreignField: 'categorie',
                    as: 'produits',
                },
            },
            {
                $project: {
                    nom: 1,
                    slug: 1,
                    count: { $size: '$produits' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        res.status(200).json({
            success: true,
            statistiques: {
                totalProduits,
                totalCategories,
                produitsEnPromotion,
                nouveauxProduits,
                marquesPopulaires,
                categoriesPopulaires,
            },
        });
    } catch (error) {
        logger.error('Erreur statistiques catalogue:', error);
        next(error);
    }
};

// @desc    Obtenir les produits recommandés
// @route   GET /api/catalogue/recommandations
// @access  Privé
export const getRecommandations = async (req, res, next) => {
    try {
        const { limit = 8 } = req.query;

        // Basé sur l'historique de navigation (à implémenter)
        // Pour l'instant, il retourne les produits populaires et nouveaux
        const produitsPopulaires = await Produit.find({
            estActive: true,
            estPopulaire: true,
        })
            .limit(Math.floor(limit / 2))
            .select('nom prixMin prixMax images slug noteMoyenne');

        const nouveauxProduits = await Produit.find({
            estActive: true,
            estNouveau: true,
        })
            .limit(Math.ceil(limit / 2))
            .select('nom prixMin prixMax images slug noteMoyenne');

        const recommandations = [...produitsPopulaires, ...nouveauxProduits];

        // Mélanger les résultats
        const melanges = recommandations.sort(() => 0.5 - Math.random());

        res.status(200).json({
            success: true,
            count: melanges.length,
            produits: melanges.slice(0, limit),
        });
    } catch (error) {
        logger.error('Erreur recommandations:', error);
        next(error);
    }
};
