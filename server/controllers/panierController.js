import Panier from '../models/panierModel.js';
import Produit from '../models/produitModel.js';
import { logger } from '../utils/logger.js';

// @desc    Récupérer le panier de l'utilisateur
// @route   GET /api/panier
// @access  Privé
export const getPanier = async (req, res, next) => {
    try {
        const panier = await Panier.trouverOuCreer(req.utilisateur._id);

        // Vérifier la disponibilité des articles
        const articlesAvecDisponibilite = await Promise.all(
            panier.articles.map(async article => {
                const produit = await Produit.findById(article.produit);

                // Si le produit n'existe plus ou n'est pas actif
                if (!produit || !produit.estActive) {
                    return {
                        ...article.toObject(),
                        disponible: false,
                        message: 'Produit non disponible',
                    };
                }

                // Vérifier la disponibilité de la variante
                const varianteDisponible = produit.variantes.find(
                    v =>
                        v.taille === article.variante.taille &&
                        v.couleur === article.variante.couleur &&
                        v.estActive
                );

                // Vérifier le stock
                const disponible =
                    varianteDisponible && varianteDisponible.quantite >= article.quantite;

                return {
                    ...article.toObject(),
                    disponible,
                    stockDisponible: varianteDisponible ? varianteDisponible.quantite : 0,
                    message: disponible ? '' : 'Stock insuffisant',
                };
            })
        );

        // Filtrer les articles indisponibles (optionnel - on les garde mais on les marque)
        panier.articles = articlesAvecDisponibilite;

        res.status(200).json({
            success: true,
            panier: {
                ...panier.toObject(),
                articles: articlesAvecDisponibilite,
            },
        });
    } catch (error) {
        logger.error('Erreur récupération panier:', error);
        next(error);
    }
};

// @desc    Ajouter un article au panier
// @route   POST /api/panier/articles
// @access  Privé
export const ajouterArticle = async (req, res, next) => {
    try {
        const { produitId, quantite, taille, couleur } = req.body;

        // Vérifier que le produit existe et est actif
        const produit = await Produit.findById(produitId);

        if (!produit || !produit.estActive) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé ou non disponible',
            });
        }

        // Vérifier que la variante existe et est en stock
        const variante = produit.variantes.find(
            v => v.taille === taille && v.couleur === couleur && v.estActive
        );

        if (!variante) {
            return res.status(400).json({
                success: false,
                message: 'Variante non disponible',
            });
        }

        if (variante.quantite < quantite) {
            return res.status(400).json({
                success: false,
                message: `Stock insuffisant. Quantité disponible: ${variante.quantite}`,
            });
        }

        // Prix à utiliser (prix promo si disponible)
        const prix = variante.prixPromo || variante.prix;

        const article = {
            produit: produitId,
            quantite,
            variante: {
                taille,
                couleur,
                sku: variante.sku,
            },
            prix,
        };

        const panier = await Panier.trouverOuCreer(req.utilisateur._id);
        await panier.ajouterArticle(article);

        // Recharger le panier avec les données peuplées
        const panierAvecProduits = await Panier.findById(panier._id).populate(
            'articles.produit',
            'nom images slug'
        );

        // Log de l'ajout au panier
        logger.info(`Article ajouté au panier: ${produit.nom} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Article ajouté au panier',
            panier: panierAvecProduits,
        });
    } catch (error) {
        logger.error('Erreur ajout article panier:', error);
        next(error);
    }
};

// @desc    Mettre à jour la quantité d'un article
// @route   PUT /api/panier/articles/:articleId
// @access  Privé
export const mettreAJourQuantite = async (req, res, next) => {
    try {
        const { articleId } = req.params;
        const { quantite } = req.body;

        if (quantite < 1 || quantite > 100) {
            return res.status(400).json({
                success: false,
                message: 'La quantité doit être entre 1 et 100',
            });
        }

        const panier = await Panier.trouverOuCreer(req.utilisateur._id);
        await panier.mettreAJourQuantite(articleId, quantite);

        const panierAvecProduits = await Panier.findById(panier._id).populate(
            'articles.produit',
            'nom images slug'
        );

        res.status(200).json({
            success: true,
            message: 'Quantité mise à jour',
            panier: panierAvecProduits,
        });
    } catch (error) {
        if (error.message === 'Article non trouvé dans le panier') {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé dans le panier',
            });
        }

        logger.error('Erreur mise à jour quantité:', error);
        next(error);
    }
};

// @desc    Supprimer un article du panier
// @route   DELETE /api/panier/articles/:articleId
// @access  Privé
export const supprimerArticle = async (req, res, next) => {
    try {
        const { articleId } = req.params;

        const panier = await Panier.trouverOuCreer(req.utilisateur._id);
        await panier.supprimerArticle(articleId);

        const panierAvecProduits = await Panier.findById(panier._id).populate(
            'articles.produit',
            'nom images slug'
        );

        res.status(200).json({
            success: true,
            message: 'Article supprimé du panier',
            panier: panierAvecProduits,
        });
    } catch (error) {
        if (error.message === 'Article non trouvé dans le panier') {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé dans le panier',
            });
        }

        logger.error('Erreur suppression article panier:', error);
        next(error);
    }
};

// @desc    Vider le panier
// @route   DELETE /api/panier
// @access  Privé
export const viderPanier = async (req, res, next) => {
    try {
        const panier = await Panier.trouverOuCreer(req.utilisateur._id);
        await panier.vider();

        logger.info(`Panier vidé par: ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: 'Panier vidé avec succès',
            panier,
        });
    } catch (error) {
        logger.error('Erreur vidage panier:', error);
        next(error);
    }
};

// @desc    Appliquer un code promo
// @route   POST /api/panier/code-promo
// @access  Privé
export const appliquerCodePromo = async (req, res, next) => {
    try {
        const { code } = req.body;

        // TODO: Implémenter la logique de validation des codes promo
        // Pour l'instant, simulation d'un code promo
        const codesPromoValides = {
            NOUVEAU10: 10, // 10% de réduction
            BIENVENUE15: 15, // 15% de réduction
            ETE2024: 20, // 20% de réduction
        };

        const pourcentageReduction = codesPromoValides[code.toUpperCase()];

        if (!pourcentageReduction) {
            return res.status(400).json({
                success: false,
                message: 'Code promo invalide ou expiré',
            });
        }

        const panier = await Panier.trouverOuCreer(req.utilisateur._id);

        if (panier.articles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Le panier est vide',
            });
        }

        await panier.appliquerCodePromo(code.toUpperCase(), pourcentageReduction);

        const panierAvecProduits = await Panier.findById(panier._id).populate(
            'articles.produit',
            'nom images slug'
        );

        logger.info(`Code promo appliqué: ${code} par ${req.utilisateur.email}`);

        res.status(200).json({
            success: true,
            message: `Code promo appliqué - ${pourcentageReduction}% de réduction`,
            panier: panierAvecProduits,
        });
    } catch (error) {
        logger.error('Erreur application code promo:', error);
        next(error);
    }
};

// @desc    Supprimer le code promo
// @route   DELETE /api/panier/code-promo
// @access  Privé
export const supprimerCodePromo = async (req, res, next) => {
    try {
        const panier = await Panier.trouverOuCreer(req.utilisateur._id);
        await panier.supprimerCodePromo();

        const panierAvecProduits = await Panier.findById(panier._id).populate(
            'articles.produit',
            'nom images slug'
        );

        res.status(200).json({
            success: true,
            message: 'Code promo supprimé',
            panier: panierAvecProduits,
        });
    } catch (error) {
        logger.error('Erreur suppression code promo:', error);
        next(error);
    }
};
