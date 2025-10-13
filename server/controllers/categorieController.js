import Categorie from '../models/categorieModel.js';
import Produit from '../models/produitModel.js';
import { logger } from '../utils/logger.js';

// @desc    Récupérer toutes les catégories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
    try {
        const { includeProducts, limit, page } = req.query;

        // Construire la requête
        let query = { estActive: true };
        let options = {
            sort: { ordreAffichage: 1, nom: 1 },
        };

        // Pagination
        if (limit) {
            options.limit = parseInt(limit);
        }

        // Page
        const categories = await Categorie.find(query, null, options)
            .populate('parent', 'nom slug')
            .populate(includeProducts === 'true' ? 'sousCategories' : '');

        // Compter le nombre de produits par catégorie
        if (includeProducts === 'true') {
            for (let categorie of categories) {
                const count = await Produit.countDocuments({
                    categorie: categorie._id,
                    estActive: true,
                });
                categorie._doc.nombreProduits = count;
            }
        }

        res.status(200).json({
            success: true,
            count: categories.length,
            categories,
        });
    } catch (error) {
        logger.error('Erreur récupération catégories:', error);
        next(error);
    }
};

// @desc    Récupérer les catégories racines
// @route   GET /api/categories/racines
// @access  Public
export const getCategoriesRacines = async (req, res, next) => {
    try {
        const categories = await Categorie.trouverRacines()
            .populate('sousCategories')
            .select('nom slug image icone ordreAffichage');

        // Ajouter le nombre de produits pour chaque catégorie
        const categoriesAvecProduits = await Promise.all(
            categories.map(async categorie => {
                const sousCategories = await categorie.getToutesSousCategories();
                const idsCategories = [categorie._id, ...sousCategories.map(sc => sc._id)];

                const nombreProduits = await Produit.countDocuments({
                    categorie: { $in: idsCategories },
                    estActive: true,
                });

                return {
                    _id: categorie._id,
                    nom: categorie.nom,
                    slug: categorie.slug,
                    image: categorie.image,
                    icone: categorie.icone,
                    ordreAffichage: categorie.ordreAffichage,
                    nombreProduits,
                    sousCategories: categorie.sousCategories?.slice(0, 5) || [], // Limiter les sous-catégories affichées
                };
            })
        );

        res.status(200).json({
            success: true,
            count: categoriesAvecProduits.length,
            categories: categoriesAvecProduits,
        });
    } catch (error) {
        logger.error('Erreur récupération catégories racines:', error);
        next(error);
    }
};

// @desc    Récupérer une catégorie par son slug
// @route   GET /api/categories/:slug
// @access  Public
export const getCategorieParSlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Récupérer la catégorie par son slug
        const categorie = await Categorie.trouverParSlug()
            .populate('parent', 'nom slug')
            .populate('sousCategories');

            // Vérifier si la catégorie existe
        if (!categorie) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée',
            });
        }

        // Récupérer le chemin complet (breadcrumb)
        const chemin = await getCheminCategorie(categorie);

        res.status(200).json({
            success: true,
            categorie: {
                ...categorie._doc,
                chemin,
            },
        });
    } catch (error) {
        logger.error('Erreur récupération catégorie:', error);
        next(error);
    }
};

// @desc    Récupérer l'arbre complet des catégories
// @route   GET /api/categories/arbre/complet
// @access  Public
export const getArbreCategories = async (req, res, next) => {
    try {
        const construireArbre = async (parentId = null) => {
            const categories = await Categorie.find({
                parent: parentId,
                estActive: true,
            })
                .sort({ ordreAffichage: 1, nom: 1 })
                .select('nom slug image icone ordreAffichage');

            const arbre = await Promise.all(
                categories.map(async categorie => {
                    const enfants = await construireArbre(categorie._id);

                    // Compter les produits pour cette catégorie et ses enfants
                    const idsCategories = [categorie._id];
                    const getIdsEnfants = enfants => {
                        enfants.forEach(enfant => {
                            idsCategories.push(enfant._id);
                            if (enfant.enfants && enfant.enfants.length > 0) {
                                getIdsEnfants(enfant.enfants);
                            }
                        });
                    };
                    getIdsEnfants(enfants);

                    const nombreProduits = await Produit.countDocuments({
                        categorie: { $in: idsCategories },
                        estActive: true,
                    });

                    return {
                        _id: categorie._id,
                        nom: categorie.nom,
                        slug: categorie.slug,
                        image: categorie.image,
                        icone: categorie.icone,
                        ordreAffichage: categorie.ordreAffichage,
                        nombreProduits,
                        enfants,
                    };
                })
            );

            return arbre;
        };

        const arbreComplet = await construireArbre();

        res.status(200).json({
            success: true,
            arbre: arbreComplet,
        });
    } catch (error) {
        logger.error('Erreur construction arbre catégories:', error);
        next(error);
    }
};

// Fonction utilitaire pour obtenir le chemin d'une catégorie
const getCheminCategorie = async categorie => {
    const chemin = [];
    let currentCategorie = categorie;

    // Remonter jusqu'à la racine
    while (currentCategorie) {
        chemin.unshift({
            _id: currentCategorie._id,
            nom: currentCategorie.nom,
            slug: currentCategorie.slug,
        });

        if (currentCategorie.parent) {
            currentCategorie = await Categorie.findById(currentCategorie.parent);
        } else {
            currentCategorie = null;
        }
    }

    return chemin;
};

// @desc    Créer une catégorie (Admin)
// @route   POST /api/categories
// @access  Privé/Admin
export const creerCategorie = async (req, res, next) => {
    try {
        const {
            nom,
            parent,
            description,
            image,
            icone,
            ordreAffichage,
            metaTitre,
            metaDescription,
        } = req.body;

        // Vérifier si la catégorie existe déjà
        const categorieExistante = await Categorie.findOne({ nom });
        if (categorieExistante) {
            return res.status(400).json({
                success: false,
                message: 'Une catégorie avec ce nom existe déjà',
            });
        }

        const categorie = await Categorie.create({
            nom,
            parent: parent || null,
            description,
            image,
            icone,
            ordreAffichage: ordreAffichage || 0,
            metaTitre,
            metaDescription,
        });

        logger.info(`Nouvelle catégorie créée: ${categorie.nom} par ${req.utilisateur.email}`);

        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            categorie,
        });
    } catch (error) {
        logger.error('Erreur création catégorie:', error);
        next(error);
    }
};

// @desc    Mettre à jour une catégorie (Admin)
// @route   PUT /api/categories/:id
// @access  Privé/Admin
export const mettreAJourCategorie = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const categorie = await Categorie.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
        });

        if (!categorie) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée',
            });
        }

        logger.info(`Catégorie mise à jour: ${categorie.nom} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Catégorie mise à jour avec succès',
            categorie,
        });
    } catch (error) {
        logger.error('Erreur mise à jour catégorie:', error);
        next(error);
    }
};

// @desc    Supprimer une catégorie (Admin)
// @route   DELETE /api/categories/:id
// @access  Privé/Admin
export const supprimerCategorie = async (req, res, next) => {
    try {
        const { id } = req.params;

        const categorie = await Categorie.findById(id);

        if (!categorie) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée',
            });
        }

        // Vérifier s'il y a des sous-catégories
        const sousCategories = await Categorie.countDocuments({ parent: id });
        if (sousCategories > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer une catégorie ayant des sous-catégories',
            });
        }

        // Vérifier s'il y a des produits dans cette catégorie
        const produitsCount = await Produit.countDocuments({ categorie: id });
        if (produitsCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer une catégorie contenant des produits',
            });
        }

        await Categorie.findByIdAndDelete(id);

        logger.info(`Catégorie supprimée: ${categorie.nom} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Catégorie supprimée avec succès',
        });
    } catch (error) {
        logger.error('Erreur suppression catégorie:', error);
        next(error);
    }
};
