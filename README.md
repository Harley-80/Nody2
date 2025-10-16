# Nody - Plateforme E-commerce de Mode

## Description

Nody est une plateforme de commerce électronique spécialisée dans la vente d'articles vestimentaires et accessoires modernes, développée avec la pile MERN (MongoDB, Express.js, React.js, Node.js) et l'architecture MVC.

## Fonctionnalités Principales

-   Catalogue de produits avec recherche et filtres
-   Gestion des comptes utilisateurs
-   Panier d'achat et processus de paiement sécurisé
-   Système de recommandations personnalisées
-   Interface responsive et moderne
-   Support multilingue et multi-devises

## Technologies Utilisées

### Front-end

-   **React.js** avec **Vite**
-   **Bootstrap** pour le styling
-   **SASS** avec modules
-   **Font Awesome** pour les icônes

### Back-end

-   **Node.js** (v22.13.0)
-   **Express.js**
-   **MongoDB** avec **Mongoose**
-   Architecture MVC

## Installation

### Prérequis

-   **Node.js** (v22.13.0)
-   **MongoDB**
-   **NPM** (v10.9.0)

### Installation des dépendances

# Installation des dépendances client
cd client
npm install

# Installation des dépendances serveur
cd ../server
npm install

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

### Authentification
-   Création de compte
-   Connexion utilisateur
-   Déconnexion
-   Demande réinitialisation mot de passe
-   Réinitialisation mot de passe
-   Vérification de compte
-   Renvoyer email vérification
-   Utilisateur connecté

### Utilisateurs
-   Profil utilisateur
-   Mettre à jour le profil
-   Changer mot de passe
-   Ajouter une adresse
-   Modifier une adresse
-   Supprimer une adresse

### Santé
-   Vérification du statut de l'API

### Sécurité
-   Authentification JWT avec tokens sécurisés
-   Hashage des mots de passe avec bcrypt
-   Validation des données d'entrée
-   Protection contre les attaques XSS et injection
-   Rate limiting pour prévenir les brute force
-   Headers de sécurité avec Helmet

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

## ÉTAPE 5 : SYSTÈME DE COMMANDES ET PANIER D'ACHAT
### Ce qui a été accompli :

### Panier d'Achat
-   Récupérer le panier
-   Ajouter un article
-   Modifier la quantité
-   Supprimer un article
-   Vider le panier
-   Appliquer un code promo
-   Supprimer le code promo

### Commandes
-   Créer une commande
-   Commandes de l'utilisateur
-   Détails d'une commande
-   Annuler une commande
-   Suivre une commande

### Administration des Commandes
-   Statistiques (Admin)
-   Toutes les commandes (Admin)
-   Mettre à jour le statut (Admin)

## Fonctionnalités du Panier et Commandes

### Gestion du Panier
-   Ajout/suppression d'articles avec variantes
-   Gestion des quantités avec limites
-   Vérification en temps réel de la disponibilité
-   Codes promo avec pourcentages de réduction
-   Calcul automatique des totaux
-   Persistance par utilisateur

### Processus de Commande
-   Création de commande avec transaction sécurisée
-   Vérification des stocks en temps réel
-   Gestion des adresses de livraison et facturation
-   Calcul des frais de livraison
-   Commandes express avec livraison accélérée

### Suivi des Commandes
-   Statuts multiples avec historique
-   Numéros de suivi pour la livraison
-   Notifications de changement de statut
-   Possibilité d'annulation (selon le statut)

### Administration
-   Tableau de bord avec statistiques
-   Gestion des statuts de commande
-   Vue d'ensemble de toutes les commandes
-   Outils de suivi et gestion

## Workflow Typique
1. **Ajout au panier** → Vérification stock → Calcul prix
2. **Application code promo** → Calcul réduction → Mise à jour total
3. **Validation commande** → Vérification adresse → Création commande
4. **Paiement** → Mise à jour statut → Réduction stocks
5. **Expédition** → Numéro de suivi → Notification client
6. **Livraison** → Confirmation → Historique complet

## ÉTAPE 6 : SYSTÈME DE PAIEMENT AVEC STRIPE
### Ce qui a été accompli :

### Paiements complet
- Créer une session de paiement
- Confirmer un paiement
- Historique des paiements
- Détails d'un paiement
- Rembourser un paiement (Admin)
- Webhook Stripe (Public)

## Configuration Stripe complet

### Variables d'Environnement
## env :
STRIPE_PUBLISHABLE_KEY=pk_test_... ok
STRIPE_SECRET_KEY=sk_test_... ok
STRIPE_WEBHOOK_SECRET=whsec_... en cours

## ÉTAPE 7 : CONFIGURATION DU FRONT-END REACT ET STRUCTURE DE BASE
### Ce qui a été accompli :

- Technologies Front-end
- React 18 avec hooks modernes
- React Router pour la navigation
- Axios pour les appels API
- Bootstrap 5 pour le styling de base
- SASS moderne avec modules
- i18next pour l'internationalisation
- Context API pour la gestion d'état

## ÉTAPE 8 : CONTEXTES REACT ET COMPOSANTS DE LAYOUT
### Ce qui a été accompli :

## Contextes React Implémentés

### AuthContext
Gestion complète de l'authentification :
- Connexion/déconnexion/inscription
- Vérification automatique du token
- Gestion des permissions (admin/vendeur)
- Mise à jour du profil

### CartContext
Gestion du panier d'achat :
- Panier persistant (localStorage + API)
- Synchronisation automatique après connexion
- Codes promo et réductions
- Calculs automatiques des totaux

### ProduitsContext
Gestion des produits et catalogue :
- Chargement des produits avec filtres
- Recherche avec suggestions
- Gestion des catégories
- Cache et optimisation des requêtes

### ToastContext
Système de notifications :
- Notifications contextuelles
- Types variés (success, error, warning, info)
- Fermeture automatique
- API simple d'utilisation

## Composants de Layout

### Structure Principale
- **Layout** : Structure générale de l'application
- **Header** : Navigation avec recherche et panier
- **Footer** : Liets et informations
- **AdminLayout** : Interface d'administration

### Composants Communs
- **SearchBar** : Barre de recherche avec suggestions
- **UserDropdown** : Menu utilisateur
- **ProtectedRoute** : Protection des routes

## Utilisation des Contextes

### Authentification
- const { estAuthentifie, utilisateur, connecter, deconnecter } = useAuth();

### Panier
- const { panier, ajouterAuPanier, nombreArticles, total } = useCart();

### Produits
- const { produits, chargerProduits, rechercherProduits } = useProduits();

### Notifications
- const { showSuccess, showError, showToast } = useToast();

## ÉTAPE 9 : PAGES PRINCIPALES ET COMPOSANTS UI
### Ce qui a été accompli :

## Pages et Composants UI Implémentés

### Pages Principales
- **Accueil** : Page d'accueil complète avec carrousels et sections
- **Boutique** : Page de listing des produits avec filtres avancés

### Composants UI Avancés

#### Carrousels
- **CarrouselHero** : Bannière hero avec transitions fluides
- **CarrouselAccueil** : Carrousel de produits responsive
- **GrilleProduitsAccueil** : Grille de produits organisée

#### Cartes et Affichages
- **ProduitCard** : Carte produit complète avec badges et actions
- **PromotionBanner** : Bannière de promotion modulable

#### Système de Filtres
- **FiltresBoutique** : Filtres avancés avec recherche
- Navigation par URL et état synchronisé

### Fonctionnalités Implémentées

#### Page Accueil
- Carrousel hero avec animations
- Sections catégories, nouveautés, promotions
- Produits populaires en carrousel
- Avantages et informations

#### Page Boutique
- Système de filtres complets (catégorie, prix, tailles, couleurs)
- Pagination avancée
- Tri multiple
- États de chargement et vides
- Design responsive mobile-first

#### Composants Produit
- Affichage des badges (nouveau, promo, populaire)
- Système d'étoiles pour les avis
- Actions rapides (panier, favoris)
- Gestion des images avec fallback

### Design System
- Animations CSS fluides
- États de chargement skeleton
- Responsive design complet
- Accessibilité (labels ARIA, navigation clavier)
- Thème cohérent avec variables CSS

### Performance
- Chargement paresseux des images
- Debouncing des recherches
- Mémoisation des composants
- Optimisation des re-rendus

## ÉTAPE 10 : PAGE DÉTAIL PRODUIT ET PANIER
### Ce qui a été accompli :

## Pages Détail Produit et Panier Implémentées

### Page Détail Produit
- **Galerie d'images** avec miniatures et zoom
- **Sélection de variantes** (tailles, couleurs)
- **Informations détaillées** avec onglets
- **Système d'avis** avec notation et commentaires
- **Produits similaires**
- **Actions** : Ajouter au panier, Acheter maintenant

### Page Panier
- **Liste des articles** avec images et variantes
- **Gestion des quantités** avec sélecteur
- **Codes promo** avec application et suppression
- **Récapitulatif de commande** avec calculs
- **Vérification de disponibilité** en temps réel
- **Actions** : Vider panier, Commander

### Fonctionnalités Avancées

#### Détail Produit
- Badges (Nouveau, Promo, Populaire)
- Notation par étoiles
- Carrousel d'images responsive
- Sélection intelligente des variantes
- Stock en temps réel
- Description riche avec onglets

#### Panier
- Persistance locale et synchronisation
- Calcul automatique des totaux
- Gestion des codes promo
- Interface responsive mobile-first
- États de chargement et erreurs
- Produits recommandés

### Composants Ajoutés
- **PromoBanner** : Bannière promotionnelle supérieure
- **Sélecteur de quantité** : Composant réutilisable
- **Galerie d'images** : Avec miniatures interactives

### Expérience Utilisateur
- Navigation par fil d'Ariane
- Feedback visuel immédiat
- Messages d'erreur contextuels
- Design cohérent avec le reste de l'application
- Performance optimisée avec lazy loading

### Sécurité et Validation
- Vérification des stocks avant ajout au panier
- Validation des quantités
- Protection contre les actions multiples
- Gestion des erreurs réseau