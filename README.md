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

### Installation des dépendances

## Installation des dépendances client
- cd client
- npm install

## Installation des dépendances serveur  
- cd ../server
- npm install


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