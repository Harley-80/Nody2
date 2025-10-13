# Nody - Plateforme E-commerce de Mode

## Description
Nody est une plateforme de commerce électronique spécialisée dans la vente d'articles vestimentaires et accessoires modernes, développée avec la pile MERN (MongoDB, Express.js, React.js, Node.js) et l'architecture MVC.

## Fonctionnalités Principales
- Catalogue de produits avec recherche et filtres
- Gestion des comptes utilisateurs
- Panier d'achat et processus de paiement sécurisé
- Système de recommandations personnalisées
- Interface responsive et moderne
- Support multilingue et multi-devises

## Technologies Utilisées
### Front-end
- **React.js** avec **Vite**
- **Bootstrap** pour le styling
- **SASS** avec modules
- **Font Awesome** pour les icônes

### Back-end
- **Node.js** (v22.13.0)
- **Express.js**
- **MongoDB** avec **Mongoose**
- Architecture MVC

## Installation
### Prérequis
- **Node.js** (v22.13.0 ou supérieur)
- **MongoDB**
- **NPM** (v10.9.0)

## Mode développement
# Démarrer le serveur
- cd server
- npm run dev

# Démarrer le client (dans un nouveau terminal)
- cd client
- npm run dev

## Mode production
# Build du client
- cd client
- npm run build

# Démarrage du serveur
- cd server
- npm start


## ÉTAPE 1 : CRÉATION DU PROJET ET INSTALLATION DES DÉPENDANCES 
### Ce qui a été accompli :
-   Structure des dossiers client et serveur
-   Configuration des fichiers package.json
-   Installation des dépendances MERN
-   Configuration des variables d'environnement
-   Configuration de la base de données MongoDB
-   Système de logging
-   Configuration Git et .gitignore

## ÉTAPE 2 : CONFIGURATION DU SERVEUR EXPRESS.JS ET CRÉATION DES MODÈLES 
### Ce qui a été accompli :

### Serveur Express.js configuré :
-   Architecture MVC mise en place
-   Middleware de sécurité (Helmet, CORS, rate limiting)
-   Gestion d'erreurs globale
-   Configuration de la base de données MongoDB

### Modèles de données créés :
-   Utilisateur : Gestion complète des comptes avec sécurité
-   Catégorie : Structure hiérarchique pour l'organisation des produits
-   Produit : Système avancé avec variantes, stocks et avis

### Fonctionnalités implémentées :
-   Validation des données avec messages d'erreur en français
-   Indexes MongoDB pour les performances
-   Méthodes utilitaires pour la logique métier
-   Virtuals pour les données calculées

## ÉTAPE 3 : CONTRÔLEURS ET ROUTES POUR L'AUTHENTIFICATION 
### Ce qui a été accompli :

### Authentification :

-   Implémentation du middleware d'authentification JWT.
-   Création des contrôleurs auth et utilisateurs.
-   Validation des données avec express-validator.
-   Système complet d'inscription/connexion avec sécurité.
-   Gestion des mots de passe oubliés et vérification de compte.
-   Routes protégées avec gestion des rôles.
-   Configuration multi-devises.
-   Documentation API complète.

## ÉTAPE 4 : CONTRÔLEURS ET ROUTES POUR LES PRODUITS ET CATÉGORIES
### Ce qui a été accompli :

### Catalogue & Produits
-   Liste des produits avec filtres 
-   Nouveaux produits
-   Produits en promotion
-   Produits populaires
-   Détails d'un produit par ID
-   Détails d'un produit par slug
-   Ajouter un avis (connecté)

### Catégories
-   Liste des catégories 
-   Catégories racines
-   Arbre complet des catégories
-   Détails d'une catégorie

### Catalogue Avancé
-   Recherche avancée
-   Statistiques du catalogue
-   Produits recommandés (connecté)

### Administration
-   Créer une catégorie (Admin)
-   Modifier une catégorie (Admin)
-   Supprimer une catégorie (Admin)
-   Créer un produit (Vendeur/Admin)
-   Modifier un produit (Vendeur/Admin)
-   Supprimer un produit (Vendeur/Admin)

## Fonctionnalités du Catalogue
### Filtres Disponibles
-   Par catégorie et sous-catégories
-   Par marque
-   Par fourchette de prix
-   Par tailles et couleurs
-   En stock uniquement
-   Produits en promotion
-   Nouveaux produits

### Recherche Avancée
-   Recherche texte dans nom, description, marque et tags
-   Filtres multiples combinables
-   Tri par pertinence, prix, nouveauté, popularité
-   Pagination avec métadonnées

### Gestion des Produits
-   Système de variantes (tailles/couleurs)
-   Gestion des stocks par variante
-   Système d'avis et notations
-   Promotions et prix spéciaux
-   Images multiples
-   Métadonnées SEO
