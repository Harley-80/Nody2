import React, { createContext, useState, useContext, useCallback } from 'react';
import { http } from '../services/api.js';
import { API_ENDPOINTS } from '../config/config.js';
import { useToast } from './ToastContext.jsx';

// Création du contexte
const ProduitsContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useProduits = () => {
    const context = useContext(ProduitsContext);
    if (!context) {
        throw new Error('useProduits doit être utilisé within a ProduitsProvider');
    }
    return context;
};

export const ProduitsProvider = ({ children }) => {
    const [produits, setProduits] = useState([]);
    const [produit, setProduit] = useState(null);
    const [categories, setCategories] = useState([]);
    const [categorie, setCategorie] = useState(null);
    const [estCharge, setEstCharge] = useState(false);
    const [filtres, setFiltres] = useState({});
    const [pagination, setPagination] = useState({});
    const [resultatsRecherche, setResultatsRecherche] = useState([]);
    const { showToast } = useToast();

    // Charger les produits avec filtres
    const chargerProduits = useCallback(
        async (nouveauxFiltres = {}) => {
            try {
                setEstCharge(true);

                // Fusionner les nouveaux filtres avec les existants
                const filtresComplets = { ...filtres, ...nouveauxFiltres };
                setFiltres(filtresComplets);

                // Construire les paramètres de requête
                const parametres = new URLSearchParams();

                Object.entries(filtresComplets).forEach(([cle, valeur]) => {
                    if (valeur !== undefined && valeur !== null && valeur !== '') {
                        if (Array.isArray(valeur)) {
                            parametres.append(cle, valeur.join(','));
                        } else {
                            parametres.append(cle, valeur.toString());
                        }
                    }
                });

                const response = await http.get(`${API_ENDPOINTS.PRODUCTS.LIST}?${parametres}`);

                if (response.success) {
                    setProduits(response.produits);
                    setPagination(response.pagination || {});
                    return { success: true, produits: response.produits };
                }
            } catch (error) {
                console.error('Erreur chargement produits:', error);
                showToast('Erreur lors du chargement des produits', 'error');
                return { success: false, error: error.message };
            } finally {
                setEstCharge(false);
            }
        },
        [filtres, showToast]
    );

    // Charger un produit par son ID ou slug
    const chargerProduit = async (identifiant, parSlug = false) => {
        try {
            setEstCharge(true);

            const endpoint = parSlug
                ? `${API_ENDPOINTS.PRODUCTS.BY_SLUG}/${identifiant}`
                : `${API_ENDPOINTS.PRODUCTS.GET}/${identifiant}`;

            const response = await http.get(endpoint);

            if (response.success) {
                setProduit(response.produit);
                return { success: true, produit: response.produit };
            }
        } catch (error) {
            console.error('Erreur chargement produit:', error);
            showToast('Produit non trouvé', 'error');
            return { success: false, error: error.message };
        } finally {
            setEstCharge(false);
        }
    };

    // Charger les catégories
    const chargerCategories = async () => {
        try {
            const response = await http.get(API_ENDPOINTS.CATEGORIES.ROOTS);

            if (response.success) {
                setCategories(response.categories);
                return { success: true, categories: response.categories };
            }
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            return { success: false, error: error.message };
        }
    };

    // Charger une catégorie par son slug
    const chargerCategorie = async slug => {
        try {
            setEstCharge(true);

            const response = await http.get(`${API_ENDPOINTS.CATEGORIES.BY_SLUG}/${slug}`);

            if (response.success) {
                setCategorie(response.categorie);
                return { success: true, categorie: response.categorie };
            }
        } catch (error) {
            console.error('Erreur chargement catégorie:', error);
            showToast('Catégorie non trouvée', 'error');
            return { success: false, error: error.message };
        } finally {
            setEstCharge(false);
        }
    };

    // Recherche de produits
    const rechercherProduits = async (terme, options = {}) => {
        try {
            setEstCharge(true);

            const parametres = new URLSearchParams({ q: terme });

            Object.entries(options).forEach(([cle, valeur]) => {
                if (valeur !== undefined && valeur !== null && valeur !== '') {
                    parametres.append(cle, valeur.toString());
                }
            });

            const response = await http.get(`${API_ENDPOINTS.CATALOG.SEARCH}?${parametres}`);

            if (response.success) {
                setResultatsRecherche(response.produits);
                return {
                    success: true,
                    produits: response.produits,
                    total: response.total,
                    suggestions: response.suggestions,
                };
            }
        } catch (error) {
            console.error('Erreur recherche produits:', error);
            showToast('Erreur lors de la recherche', 'error');
            return { success: false, error: error.message };
        } finally {
            setEstCharge(false);
        }
    };

    // Charger les nouveaux produits
    const chargerNouveauxProduits = async (limit = 10) => {
        try {
            const response = await http.get(`${API_ENDPOINTS.PRODUCTS.NEW}?limit=${limit}`);

            if (response.success) {
                return { success: true, produits: response.produits };
            }
        } catch (error) {
            console.error('Erreur chargement nouveaux produits:', error);
            return { success: false, error: error.message };
        }
    };

    // Charger les produits en promotion
    const chargerProduitsEnPromotion = async (limit = 10) => {
        try {
            const response = await http.get(`${API_ENDPOINTS.PRODUCTS.PROMOTIONS}?limit=${limit}`);

            if (response.success) {
                return { success: true, produits: response.produits };
            }
        } catch (error) {
            console.error('Erreur chargement produits en promotion:', error);
            return { success: false, error: error.message };
        }
    };

    // Charger les produits populaires
    const chargerProduitsPopulaires = async (limit = 10) => {
        try {
            const response = await http.get(`${API_ENDPOINTS.PRODUCTS.POPULAR}?limit=${limit}`);

            if (response.success) {
                return { success: true, produits: response.produits };
            }
        } catch (error) {
            console.error('Erreur chargement produits populaires:', error);
            return { success: false, error: error.message };
        }
    };

    // Ajouter un avis à un produit
    const ajouterAvis = async (produitId, avis) => {
        try {
            const response = await http.post(
                `${API_ENDPOINTS.PRODUCTS.REVIEWS.replace(':id', produitId)}`,
                avis
            );

            if (response.success) {
                showToast('Avis ajouté avec succès', 'success');

                // Mettre à jour le produit localement
                if (produit && produit._id === produitId) {
                    setProduit({
                        ...produit,
                        noteMoyenne: response.produit.noteMoyenne,
                        nombreAvis: response.produit.nombreAvis,
                        avis: response.produit.avis,
                    });
                }

                return { success: true };
            }
        } catch (error) {
            showToast(error.message || "Erreur lors de l'ajout de l'avis", 'error');
            return { success: false, error: error.message };
        }
    };

    // Réinitialiser les filtres
    const reinitialiserFiltres = () => {
        setFiltres({});
    };

    // Mettre à jour un filtre
    const mettreAJourFiltre = (cle, valeur) => {
        setFiltres(prev => ({
            ...prev,
            [cle]: valeur,
        }));
    };

    const value = {
        // État
        produits,
        produit,
        categories,
        categorie,
        estCharge,
        filtres,
        pagination,
        resultatsRecherche,

        // Actions
        chargerProduits,
        chargerProduit,
        chargerCategories,
        chargerCategorie,
        rechercherProduits,
        chargerNouveauxProduits,
        chargerProduitsEnPromotion,
        chargerProduitsPopulaires,
        ajouterAvis,
        reinitialiserFiltres,
        mettreAJourFiltre,
    };

    return <ProduitsContext.Provider value={value}>{children}</ProduitsContext.Provider>;
};
