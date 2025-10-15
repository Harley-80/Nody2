import React, { createContext, useState, useContext, useEffect } from 'react';
import { http } from '../services/api.js';
import { API_ENDPOINTS } from '../config/config.js';
import { useToast } from './ToastContext.jsx';
import { useAuth } from './AuthContext.jsx';

// Création du contexte
const CartContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart doit être utilisé within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [panier, setPanier] = useState([]);
    const [estCharge, setEstCharge] = useState(false);
    const [codePromo, setCodePromo] = useState('');
    const [reduction, setReduction] = useState(0);
    const { estAuthentifie, utilisateur } = useAuth();
    const { showToast } = useToast();

    // Charger le panier au démarrage
    useEffect(() => {
        if (estAuthentifie) {
            chargerPanier();
        } else {
            chargerPanierLocal();
        }
    }, [estAuthentifie]);

    // Charger le panier depuis l'API
    const chargerPanier = async () => {
        try {
            setEstCharge(true);
            const response = await http.get(API_ENDPOINTS.CART.GET);

            if (response.success) {
                setPanier(response.panier.articles || []);
                setCodePromo(response.panier.codePromo || '');
                setReduction(response.panier.reduction || 0);
            }
        } catch (error) {
            console.error('Erreur chargement panier:', error);
            // En cas d'erreur, charger le panier local
            chargerPanierLocal();
        } finally {
            setEstCharge(false);
        }
    };

    // Charger le panier depuis le stockage local
    const chargerPanierLocal = () => {
        try {
            const panierLocal = localStorage.getItem('nody_panier');
            if (panierLocal) {
                setPanier(JSON.parse(panierLocal));
            }
        } catch (error) {
            console.error('Erreur chargement panier local:', error);
            setPanier([]);
        }
    };

    // Sauvegarder le panier dans le stockage local
    const sauvegarderPanierLocal = nouveauPanier => {
        try {
            localStorage.setItem('nody_panier', JSON.stringify(nouveauPanier));
        } catch (error) {
            console.error('Erreur sauvegarde panier local:', error);
        }
    };

    // Ajouter un article au panier
    const ajouterAuPanier = async (produit, variante, quantite = 1) => {
        try {
            const article = {
                produit: produit._id,
                quantite,
                variante: {
                    taille: variante.taille,
                    couleur: variante.couleur,
                    sku: variante.sku,
                },
                prix: variante.prixPromo || variante.prix,
            };

            let resultat;

            if (estAuthentifie) {
                // Ajouter via l'API
                resultat = await http.post(API_ENDPOINTS.CART.ADD_ITEM, article);

                if (resultat.success) {
                    setPanier(resultat.panier.articles);
                    setCodePromo(resultat.panier.codePromo || '');
                    setReduction(resultat.panier.reduction || 0);
                }
            } else {
                // Ajouter localement
                const nouvelArticle = {
                    ...article,
                    _id: Date.now().toString(), // ID temporaire
                    produit: {
                        // Inclure les infos du produit pour l'affichage
                        _id: produit._id,
                        nom: produit.nom,
                        images: produit.images,
                        slug: produit.slug,
                    },
                };

                const panierExistant = [...panier];
                const articleExistantIndex = panierExistant.findIndex(
                    item =>
                        item.produit._id === produit._id &&
                        item.variante.taille === variante.taille &&
                        item.variante.couleur === variante.couleur
                );

                if (articleExistantIndex > -1) {
                    // Mettre à jour la quantité
                    panierExistant[articleExistantIndex].quantite += quantite;
                } else {
                    // Ajouter un nouvel article
                    panierExistant.push(nouvelArticle);
                }

                setPanier(panierExistant);
                sauvegarderPanierLocal(panierExistant);
                resultat = { success: true };
            }

            if (resultat.success) {
                showToast(`${produit.nom} ajouté au panier`, 'success');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || "Erreur lors de l'ajout au panier", 'error');
            return { success: false, error: error.message };
        }
    };

    // Mettre à jour la quantité d'un article
    const mettreAJourQuantite = async (articleId, nouvelleQuantite) => {
        try {
            if (nouvelleQuantite < 1) {
                return supprimerDuPanier(articleId);
            }

            let resultat;

            if (estAuthentifie) {
                resultat = await http.put(`${API_ENDPOINTS.CART.UPDATE_ITEM}/${articleId}`, {
                    quantite: nouvelleQuantite,
                });

                if (resultat.success) {
                    setPanier(resultat.panier.articles);
                }
            } else {
                const panierMisAJour = panier.map(article =>
                    article._id === articleId ? { ...article, quantite: nouvelleQuantite } : article
                );

                setPanier(panierMisAJour);
                sauvegarderPanierLocal(panierMisAJour);
                resultat = { success: true };
            }

            if (resultat.success) {
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la mise à jour', 'error');
            return { success: false, error: error.message };
        }
    };

    // Supprimer un article du panier
    const supprimerDuPanier = async articleId => {
        try {
            let resultat;

            if (estAuthentifie) {
                resultat = await http.delete(`${API_ENDPOINTS.CART.REMOVE_ITEM}/${articleId}`);

                if (resultat.success) {
                    setPanier(resultat.panier.articles);
                }
            } else {
                const panierFiltre = panier.filter(article => article._id !== articleId);
                setPanier(panierFiltre);
                sauvegarderPanierLocal(panierFiltre);
                resultat = { success: true };
            }

            if (resultat.success) {
                showToast('Article retiré du panier', 'info');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression', 'error');
            return { success: false, error: error.message };
        }
    };

    // Vider le panier
    const viderPanier = async () => {
        try {
            let resultat;

            if (estAuthentifie) {
                resultat = await http.delete(API_ENDPOINTS.CART.CLEAR);

                if (resultat.success) {
                    setPanier([]);
                    setCodePromo('');
                    setReduction(0);
                }
            } else {
                setPanier([]);
                setCodePromo('');
                setReduction(0);
                localStorage.removeItem('nody_panier');
                resultat = { success: true };
            }

            if (resultat.success) {
                showToast('Panier vidé', 'info');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors du vidage du panier', 'error');
            return { success: false, error: error.message };
        }
    };

    // Appliquer un code promo
    const appliquerCodePromo = async code => {
        try {
            if (!estAuthentifie) {
                showToast('Connectez-vous pour utiliser un code promo', 'warning');
                return { success: false };
            }

            const resultat = await http.post(API_ENDPOINTS.CART.APPLY_COUPON, { code });

            if (resultat.success) {
                setCodePromo(resultat.panier.codePromo);
                setReduction(resultat.panier.reduction);
                showToast(resultat.message, 'success');
                return { success: true, reduction: resultat.panier.reduction };
            }
        } catch (error) {
            showToast(error.message || "Erreur lors de l'application du code promo", 'error');
            return { success: false, error: error.message };
        }
    };

    // Supprimer le code promo
    const supprimerCodePromo = async () => {
        try {
            if (!estAuthentifie) {
                setCodePromo('');
                setReduction(0);
                return { success: true };
            }

            const resultat = await http.delete(API_ENDPOINTS.CART.REMOVE_COUPON);

            if (resultat.success) {
                setCodePromo('');
                setReduction(0);
                showToast('Code promo retiré', 'info');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la suppression du code promo', 'error');
            return { success: false, error: error.message };
        }
    };

    // Synchroniser le panier local avec le serveur après connexion
    useEffect(() => {
        if (estAuthentifie && panier.length > 0) {
            synchroniserPanier();
        }
    }, [estAuthentifie]);

    const synchroniserPanier = async () => {
        try {
            for (const article of panier) {
                await http.post(API_ENDPOINTS.CART.ADD_ITEM, {
                    produit: article.produit._id,
                    quantite: article.quantite,
                    variante: article.variante,
                    prix: article.prix,
                });
            }

            // Recharger le panier depuis le serveur
            await chargerPanier();

            // Vider le panier local
            localStorage.removeItem('nody_panier');
        } catch (error) {
            console.error('Erreur synchronisation panier:', error);
        }
    };

    // Calculs
    const sousTotal = panier.reduce((total, article) => {
        return total + article.prix * article.quantite;
    }, 0);

    const total = sousTotal - reduction;
    const nombreArticles = panier.reduce((total, article) => total + article.quantite, 0);
    const estVide = panier.length === 0;

    const value = {
        // État
        panier,
        estCharge,
        codePromo,
        reduction,

        // Calculs
        sousTotal,
        total,
        nombreArticles,
        estVide,

        // Actions
        ajouterAuPanier,
        mettreAJourQuantite,
        supprimerDuPanier,
        viderPanier,
        appliquerCodePromo,
        supprimerCodePromo,
        chargerPanier,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
