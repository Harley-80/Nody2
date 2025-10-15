import React, { createContext, useState, useContext, useEffect } from 'react';
import { http } from '../services/api.js';
import { API_ENDPOINTS } from '../config/config.js';
import { useToast } from './ToastContext.jsx';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé within an AuthProvider');
    }
    return context;
};

// Composant AuthProvider
export const AuthProvider = ({ children }) => {
    const [utilisateur, setUtilisateur] = useState(null);
    const [estCharge, setEstCharge] = useState(true);
    const [estAuthentifie, setEstAuthentifie] = useState(false);
    const { showToast } = useToast();

    // Vérifier l'authentification au chargement
    useEffect(() => {
        verifierAuthentification();
    }, []);

    // Vérifier si l'utilisateur est authentifié
    const verifierAuthentification = async () => {
        try {
            const token = localStorage.getItem('nody_token');

            if (!token) {
                setEstCharge(false);
                return;
            }

            const response = await http.get(API_ENDPOINTS.AUTH.ME);

            if (response.success) {
                setUtilisateur(response.utilisateur);
                setEstAuthentifie(true);
            } else {
                // Token invalide, déconnexion
                deconnecter();
            }
        } catch (error) {
            console.error('Erreur vérification authentification:', error);
            // En cas d'erreur, on considère que l'utilisateur n'est pas connecté
            deconnecter();
        } finally {
            setEstCharge(false);
        }
    };

    // Connexion
    const connecter = async donneesConnexion => {
        try {
            setEstCharge(true);

            const response = await http.post(API_ENDPOINTS.AUTH.LOGIN, donneesConnexion);

            if (response.success) {
                const { token, utilisateur } = response;

                // Stocker le token et les infos utilisateur
                localStorage.setItem('nody_token', token);
                localStorage.setItem('nody_user', JSON.stringify(utilisateur));

                setUtilisateur(utilisateur);
                setEstAuthentifie(true);

                showToast('Connexion réussie !', 'success');
                return { success: true, utilisateur };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la connexion', 'error');
            return { success: false, error: error.message };
        } finally {
            setEstCharge(false);
        }
    };

    // Inscription
    const inscrire = async donneesInscription => {
        try {
            setEstCharge(true);

            const response = await http.post(API_ENDPOINTS.AUTH.REGISTER, donneesInscription);

            if (response.success) {
                const { token, utilisateur } = response;

                // Stocker le token et les infos utilisateur
                localStorage.setItem('nody_token', token);
                localStorage.setItem('nody_user', JSON.stringify(utilisateur));

                setUtilisateur(utilisateur);
                setEstAuthentifie(true);

                showToast('Inscription réussie ! Bienvenue sur Nody.', 'success');
                return { success: true, utilisateur };
            }
        } catch (error) {
            showToast(error.message || "Erreur lors de l'inscription", 'error');
            return { success: false, error: error.message };
        } finally {
            setEstCharge(false);
        }
    };

    // Déconnexion
    const deconnecter = async () => {
        try {
            // Appeler l'API de déconnexion
            await http.post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            // Nettoyer le stockage local
            localStorage.removeItem('nody_token');
            localStorage.removeItem('nody_user');
            localStorage.removeItem('nody_panier');

            // Réinitialiser l'état
            setUtilisateur(null);
            setEstAuthentifie(false);

            showToast('Déconnexion réussie', 'info');
        }
    };

    // Mettre à jour le profil
    const mettreAJourProfil = async donneesProfil => {
        try {
            const response = await http.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, donneesProfil);

            if (response.success) {
                setUtilisateur(response.utilisateur);
                localStorage.setItem('nody_user', JSON.stringify(response.utilisateur));

                showToast('Profil mis à jour avec succès', 'success');
                return { success: true, utilisateur: response.utilisateur };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la mise à jour du profil', 'error');
            return { success: false, error: error.message };
        }
    };

    // Changer le mot de passe
    const changerMotDePasse = async donneesMotDePasse => {
        try {
            const response = await http.put(API_ENDPOINTS.USERS.CHANGE_PASSWORD, donneesMotDePasse);

            if (response.success) {
                showToast('Mot de passe changé avec succès', 'success');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors du changement de mot de passe', 'error');
            return { success: false, error: error.message };
        }
    };

    // Mot de passe oublié
    const motDePasseOublie = async email => {
        try {
            const response = await http.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });

            if (response.success) {
                showToast('Un email de réinitialisation a été envoyé', 'success');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || "Erreur lors de l'envoi de l'email", 'error');
            return { success: false, error: error.message };
        }
    };

    // Réinitialiser le mot de passe
    const reinitialiserMotDePasse = async (token, motDePasse) => {
        try {
            const response = await http.put(`${API_ENDPOINTS.AUTH.RESET_PASSWORD}/${token}`, {
                motDePasse,
            });

            if (response.success) {
                showToast('Mot de passe réinitialisé avec succès', 'success');
                return { success: true };
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la réinitialisation', 'error');
            return { success: false, error: error.message };
        }
    };

    // Vérifier si l'utilisateur est admin
    const estAdmin = () => {
        return utilisateur?.role === 'admin';
    };

    // Vérifier si l'utilisateur est vendeur
    const estVendeur = () => {
        return utilisateur?.role === 'vendeur' || utilisateur?.role === 'admin';
    };

    const value = {
        // État
        utilisateur,
        estCharge,
        estAuthentifie,

        // Actions
        connecter,
        inscrire,
        deconnecter,
        mettreAJourProfil,
        changerMotDePasse,
        motDePasseOublie,
        reinitialiserMotDePasse,
        verifierAuthentification,

        // Utilitaires
        estAdmin,
        estVendeur,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
