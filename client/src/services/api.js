import axios from 'axios';
import { config } from '../config/config.js';

// Création de l'instance axios
const api = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('nody_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les réponses
api.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        // Gestion centralisée des erreurs
        if (error.response) {
            // Erreur du serveur
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Non authentifié - déconnexion
                    localStorage.removeItem('nody_token');
                    localStorage.removeItem('nody_user');
                    window.location.href = '/connexion';
                    break;

                case 403:
                    // Non autorisé
                    console.error('Accès refusé:', data.message);
                    break;

                case 404:
                    // Ressource non trouvée
                    console.error('Ressource non trouvée:', data.message);
                    break;

                case 500:
                    // Erreur serveur
                    console.error('Erreur serveur:', data.message);
                    break;

                default:
                    console.error('Erreur API:', data.message);
            }

            return Promise.reject({
                message: data.message || 'Une erreur est survenue',
                status,
                data: data.data || null,
            });
        } else if (error.request) {
            // Erreur réseau
            console.error('Erreur réseau:', error.message);
            return Promise.reject({
                message: 'Problème de connexion. Vérifiez votre connexion internet.',
                status: 0,
            });
        } else {
            // Erreur de configuration
            console.error('Erreur de configuration:', error.message);
            return Promise.reject({
                message: 'Erreur de configuration',
                status: 0,
            });
        }
    }
);

// Méthodes HTTP simplifiées
export const http = {
    get: (url, config = {}) => api.get(url, config),
    post: (url, data = {}, config = {}) => api.post(url, data, config),
    put: (url, data = {}, config = {}) => api.put(url, data, config),
    patch: (url, data = {}, config = {}) => api.patch(url, data, config),
    delete: (url, config = {}) => api.delete(url, config),
};

// Export de l'instance pour un usage avancé
export default api;
