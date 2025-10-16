import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProduits } from '../contexts/ProduitsContext.jsx';
import CarrouselHero from '../components/ui/CarrouselHero.jsx';
import CarrouselAccueil from '../components/ui/CarrouselAccueil.jsx';
import GrilleProduitsAccueil from '../components/ui/GrilleProduitsAccueil.jsx';
import PromotionBanner from '../components/ui/PromotionBanner.jsx';

const Accueil = () => {
    const {
        chargerNouveauxProduits,
        chargerProduitsEnPromotion,
        chargerProduitsPopulaires,
        chargerCategories,
    } = useProduits();

    const [nouveauxProduits, setNouveauxProduits] = useState([]);
    const [produitsPromo, setProduitsPromo] = useState([]);
    const [produitsPopulaires, setProduitsPopulaires] = useState([]);
    const [categories, setCategories] = useState([]);
    const [estCharge, setEstCharge] = useState(true);

    useEffect(() => {
        chargerDonneesAccueil();
    }, []);

    const chargerDonneesAccueil = async () => {
        try {
            setEstCharge(true);

            const [resultatNouveaux, resultatPromo, resultatPopulaires, resultatCategories] =
                await Promise.all([
                    chargerNouveauxProduits(8),
                    chargerProduitsEnPromotion(8),
                    chargerProduitsPopulaires(8),
                    chargerCategories(),
                ]);

            if (resultatNouveaux.success) setNouveauxProduits(resultatNouveaux.produits);
            if (resultatPromo.success) setProduitsPromo(resultatPromo.produits);
            if (resultatPopulaires.success) setProduitsPopulaires(resultatPopulaires.produits);
            if (resultatCategories.success) setCategories(resultatCategories.categories);
        } catch (error) {
            console.error('Erreur chargement accueil:', error);
        } finally {
            setEstCharge(false);
        }
    };

    if (estCharge) {
        return (
            <div className="container py-5">
                <div className="row">
                    <div className="col-12 text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-accueil">
            {/* Hero Section avec Carrousel */}
            <section className="hero-section">
                <CarrouselHero />
            </section>

            {/* Bannière de promotion */}
            <section className="promotion-section">
                <PromotionBanner
                    titre="Soldes d'Été"
                    sousTitre="Jusqu'à -50% sur toute la collection"
                    lien="/boutique?promo=true"
                    texteLien="Découvrir les promotions"
                />
            </section>

            {/* Section Catégories */}
            <section className="categories-section py-5 bg-light">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-12 text-center">
                            <h2 className="display-5 fw-bold mb-3">Nos Catégories</h2>
                            <p className="lead text-muted">
                                Découvrez notre large sélection de vêtements et accessoires
                            </p>
                        </div>
                    </div>

                    <div className="row g-4">
                        {categories.slice(0, 6).map(categorie => (
                            <div key={categorie._id} className="col-md-4 col-lg-2">
                                <Link
                                    to={`/categories/${categorie.slug}`}
                                    className="categorie-card text-decoration-none"
                                >
                                    <div className="card border-0 shadow-sm h-100 transition-hover">
                                        <div className="card-body text-center p-4">
                                            <div className="categorie-icon mb-3">
                                                <i className="bi bi-grid-3x3-gap fs-1 text-primary"></i>
                                            </div>
                                            <h5 className="card-title fw-semibold text-dark mb-2">
                                                {categorie.nom}
                                            </h5>
                                            <p className="card-text text-muted small">
                                                {categorie.nombreProduits || 0} produits
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    <div className="row mt-5">
                        <div className="col-12 text-center">
                            <Link to="/categories" className="btn btn-outline-primary btn-lg">
                                Voir toutes les catégories
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section Nouveautés */}
            <section className="nouveautes-section py-5">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-12 text-center">
                            <h2 className="display-5 fw-bold mb-3">Nouveautés</h2>
                            <p className="lead text-muted">
                                Découvrez les dernières tendances de la saison
                            </p>
                        </div>
                    </div>

                    <GrilleProduitsAccueil
                        produits={nouveauxProduits}
                        titre="Nouveautés"
                        voirPlusLink="/nouveautes"
                    />
                </div>
            </section>

            {/* Section Promotion */}
            <section className="promo-section py-5 bg-primary bg-opacity-10">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-12 text-center">
                            <h2 className="display-5 fw-bold mb-3">Promotions</h2>
                            <p className="lead text-muted">
                                Profitez de nos meilleures offres du moment
                            </p>
                        </div>
                    </div>

                    <GrilleProduitsAccueil
                        produits={produitsPromo}
                        titre="Promotions"
                        voirPlusLink="/boutique?promo=true"
                    />
                </div>
            </section>

            {/* Section Produits Populaires */}
            <section className="populaires-section py-5">
                <div className="container">
                    <div className="row mb-5">
                        <div className="col-12 text-center">
                            <h2 className="display-5 fw-bold mb-3">Les Plus Populaires</h2>
                            <p className="lead text-muted">
                                Découvrez les produits préférés de nos clients
                            </p>
                        </div>
                    </div>

                    <CarrouselAccueil produits={produitsPopulaires} titre="Produits Populaires" />
                </div>
            </section>

            {/* Section Avantages */}
            <section className="avantages-section py-5 bg-dark text-white">
                <div className="container">
                    <div className="row g-4 text-center">
                        <div className="col-md-3">
                            <div className="avantage-item">
                                <i className="bi bi-truck fs-1 text-primary mb-3"></i>
                                <h5>Livraison Gratuite</h5>
                                <p className="text-muted mb-0">À partir de 50€ d'achat</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="avantage-item">
                                <i className="bi bi-arrow-left-right fs-1 text-primary mb-3"></i>
                                <h5>Retours Faciles</h5>
                                <p className="text-muted mb-0">30 jours pour changer d'avis</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="avantage-item">
                                <i className="bi bi-shield-check fs-1 text-primary mb-3"></i>
                                <h5>Paiement Sécurisé</h5>
                                <p className="text-muted mb-0">Transactions 100% sécurisées</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="avantage-item">
                                <i className="bi bi-headset fs-1 text-primary mb-3"></i>
                                <h5>Support 7j/7</h5>
                                <p className="text-muted mb-0">Notre équipe à votre écoute</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Accueil;
