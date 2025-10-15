// Configuration de l'application
export const config = {
    // URL de l'API
    api: {
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
        timeout: 10000,
    },

    // Stripe
    stripe: {
        publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_votre_cle_stripe',
    },

    // Application
    app: {
        name: 'Nody',
        version: '1.0.0',
        environment: import.meta.env.MODE || 'development',
    },

    // Fonctionnalités
    features: {
        enablePaiements: true,
        enableReviews: true,
        enableWishlist: true,
        enableNewsletter: true,
    },

    // Paramètres
    settings: {
        itemsPerPage: 12,
        maxCartItems: 100,
        searchDebounce: 300,
        cacheDuration: 5 * 60 * 1000, // 5 minutes
    },
};

// URLs de l'API
export const API_ENDPOINTS = {
    // Authentification
    AUTH: {
        LOGIN: '/auth/connexion',
        REGISTER: '/auth/inscription',
        LOGOUT: '/auth/deconnexion',
        FORGOT_PASSWORD: '/auth/mot-de-passe-oublie',
        RESET_PASSWORD: '/auth/reinitialiser-mot-de-passe',
        VERIFY_ACCOUNT: '/auth/verifier',
        RESEND_VERIFICATION: '/auth/renvoyer-verification',
        ME: '/auth/moi',
    },

    // Utilisateurs
    USERS: {
        PROFILE: '/utilisateurs/profil',
        UPDATE_PROFILE: '/utilisateurs/profil',
        CHANGE_PASSWORD: '/utilisateurs/changer-mot-de-passe',
        ADDRESSES: '/utilisateurs/adresses',
    },

    // Produits
    PRODUCTS: {
        LIST: '/produits',
        GET: '/produits',
        BY_SLUG: '/produits/slug',
        NEW: '/produits/nouveautes',
        PROMOTIONS: '/produits/promotions',
        POPULAR: '/produits/populaires',
        REVIEWS: '/produits/:id/avis',
    },

    // Catégories
    CATEGORIES: {
        LIST: '/categories',
        ROOTS: '/categories/racines',
        TREE: '/categories/arbre/complet',
        BY_SLUG: '/categories',
    },

    // Catalogue
    CATALOG: {
        SEARCH: '/catalogue/recherche',
        STATS: '/catalogue/statistiques',
        RECOMMENDATIONS: '/catalogue/recommandations',
    },

    // Panier
    CART: {
        GET: '/panier',
        ADD_ITEM: '/panier/articles',
        UPDATE_ITEM: '/panier/articles',
        REMOVE_ITEM: '/panier/articles',
        CLEAR: '/panier',
        APPLY_COUPON: '/panier/code-promo',
        REMOVE_COUPON: '/panier/code-promo',
    },

    // Commandes
    ORDERS: {
        CREATE: '/commandes',
        LIST: '/commandes',
        GET: '/commandes',
        CANCEL: '/commandes/:id/annuler',
        TRACK: '/commandes/:id/suivi',
    },

    // Paiements
    PAYMENTS: {
        CREATE_SESSION: '/paiements/creer-session',
        CONFIRM: '/paiements/confirmer',
        GET: '/paiements',
        HISTORY: '/paiements',
        REFUND: '/paiements/:id/rembourser',
    },
};

// Devises supportées
export const SUPPORTED_CURRENCIES = [
    { code: 'XOF', symbole: 'CFA', nom: 'Franc CFA (XOF)', locale: 'fr-FR' },
    { code: 'XAF', symbole: 'FCFA', nom: 'Franc CFA (XAF)', locale: 'fr-FR' },
    { code: 'EUR', symbole: '€', nom: 'Euro (EUR)', locale: 'fr-FR' },
    { code: 'USD', symbole: '$', nom: 'Dollar US (USD)', locale: 'en-US' },
    { code: 'CAD', symbole: 'C$', nom: 'Dollar Canadien (CAD)', locale: 'en-CA' },
    { code: 'CNY', symbole: '¥', nom: 'Yuan Renminbi (CNY)', locale: 'zh-CN' },
];

// Langues supportées
export const SUPPORTED_LANGUAGES = [
    { code: 'fr', nom: 'Français', flag: '🇫🇷' },
    { code: 'en', nom: 'English', flag: '🇺🇸' },
];

export default config;
