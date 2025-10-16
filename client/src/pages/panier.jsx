import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import './panier.scss';

const Panier = () => {
    const {
        panier,
        estCharge,
        mettreAJourQuantite,
        supprimerDuPanier,
        viderPanier,
        sousTotal,
        reduction,
        total,
        nombreArticles,
        appliquerCodePromo,
        supprimerCodePromo,
        codePromo,
    } = useCart();

    const { estAuthentifie } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [codePromoInput, setCodePromoInput] = useState('');
    const [applicationCodePromo, setApplicationCodePromo] = useState(false);

    const handleQuantiteChange = async (articleId, nouvelleQuantite) => {
        if (nouvelleQuantite < 1) return;

        const resultat = await mettreAJourQuantite(articleId, nouvelleQuantite);
        if (!resultat.success) {
            showToast('Erreur lors de la mise à jour de la quantité', 'error');
        }
    };

    const handleSupprimerArticle = async articleId => {
        const resultat = await supprimerDuPanier(articleId);
        if (!resultat.success) {
            showToast("Erreur lors de la suppression de l'article", 'error');
        }
    };

    const handleViderPanier = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
            const resultat = await viderPanier();
            if (!resultat.success) {
                showToast('Erreur lors du vidage du panier', 'error');
            }
        }
    };

    const handleAppliquerCodePromo = async () => {
        if (!codePromoInput.trim()) {
            showToast('Veuillez saisir un code promo', 'warning');
            return;
        }

        setApplicationCodePromo(true);
        const resultat = await appliquerCodePromo(codePromoInput);

        if (resultat.success) {
            setCodePromoInput('');
        }

        setApplicationCodePromo(false);
    };

    const handleSupprimerCodePromo = async () => {
        const resultat = await supprimerCodePromo();
        if (!resultat.success) {
            showToast('Erreur lors de la suppression du code promo', 'error');
        }
    };

    const handleCommander = () => {
        if (!estAuthentifie) {
            showToast('Connectez-vous pour passer une commande', 'warning');
            navigate('/connexion', { state: { from: '/panier' } });
            return;
        }

        if (panier.length === 0) {
            showToast('Votre panier est vide', 'warning');
            return;
        }

        navigate('/paiement');
    };

    if (estCharge) {
        return (
            <div className="container py-5">
                <div className="row">
                    <div className="col-12 text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                        <p className="mt-3">Chargement du panier...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (panier.length === 0) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-8 col-lg-6 text-center">
                        <div className="panier-vide">
                            <i className="bi bi-cart-x display-1 text-muted mb-4"></i>
                            <h2 className="mb-3">Votre panier est vide</h2>
                            <p className="text-muted mb-4">
                                Découvrez nos produits et ajoutez-les à votre panier pour commencer
                                vos achats.
                            </p>
                            <Link to="/boutique" className="btn btn-primary btn-lg">
                                Découvrir la boutique
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-panier">
            <div className="container py-5">
                <div className="row">
                    <div className="col-12">
                        <h1 className="display-5 fw-bold mb-4">Mon Panier</h1>
                        <p className="text-muted mb-5">
                            {nombreArticles} article{nombreArticles > 1 ? 's' : ''} dans votre
                            panier
                        </p>
                    </div>
                </div>

                <div className="row">
                    {/* Liste des articles */}
                    <div className="col-lg-8">
                        <div className="panier-articles card">
                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Articles</h5>
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={handleViderPanier}
                                >
                                    <i className="bi bi-trash me-1"></i>
                                    Vider le panier
                                </button>
                            </div>

                            <div className="card-body p-0">
                                {panier.map(article => (
                                    <div key={article._id} className="panier-article border-bottom">
                                        <div className="row align-items-center p-3">
                                            {/* Image */}
                                            <div className="col-3 col-md-2">
                                                <Link to={`/produit/${article.produit.slug}`}>
                                                    <div className="ratio ratio-1x1">
                                                        <img
                                                            src={
                                                                article.produit.images?.[0] ||
                                                                '/images/placeholder-produit.jpg'
                                                            }
                                                            alt={article.produit.nom}
                                                            className="img-fluid rounded"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                </Link>
                                            </div>

                                            {/* Informations produit */}
                                            <div className="col-9 col-md-4">
                                                <Link
                                                    to={`/produit/${article.produit.slug}`}
                                                    className="text-decoration-none text-dark"
                                                >
                                                    <h6 className="mb-1 fw-semibold">
                                                        {article.produit.nom}
                                                    </h6>
                                                </Link>
                                                <div className="text-muted small">
                                                    <div>Taille: {article.variante.taille}</div>
                                                    <div>Couleur: {article.variante.couleur}</div>
                                                </div>
                                                {!article.disponible && (
                                                    <div className="text-danger small mt-1">
                                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                                        {article.message || 'Non disponible'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prix unitaire */}
                                            <div className="col-4 col-md-2 text-center d-none d-md-block">
                                                <span className="fw-semibold">
                                                    {article.prix.toFixed(2)} xof
                                                </span>
                                            </div>

                                            {/* Quantité */}
                                            <div className="col-6 col-md-2">
                                                <div className="quantite-selector input-group input-group-sm">
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantiteChange(
                                                                article._id,
                                                                article.quantite - 1
                                                            )
                                                        }
                                                        disabled={article.quantite <= 1}
                                                    >
                                                        <i className="bi bi-dash"></i>
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="form-control text-center"
                                                        value={article.quantite}
                                                        min="1"
                                                        max="100"
                                                        onChange={e => {
                                                            const nouvelleQuantite =
                                                                parseInt(e.target.value) || 1;
                                                            handleQuantiteChange(
                                                                article._id,
                                                                nouvelleQuantite
                                                            );
                                                        }}
                                                    />
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() =>
                                                            handleQuantiteChange(
                                                                article._id,
                                                                article.quantite + 1
                                                            )
                                                        }
                                                        disabled={article.quantite >= 100}
                                                    >
                                                        <i className="bi bi-plus"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Sous-total */}
                                            <div className="col-4 col-md-1 text-center">
                                                <span className="fw-bold text-primary">
                                                    {(article.prix * article.quantite).toFixed(2)}{' '}
                                                    xof
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="col-2 col-md-1 text-end">
                                                <button
                                                    className="btn btn-link text-danger p-0"
                                                    onClick={() =>
                                                        handleSupprimerArticle(article._id)
                                                    }
                                                    title="Supprimer l'article"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Code promo */}
                        <div className="code-promo-section mt-4">
                            <div className="card">
                                <div className="card-body">
                                    <h6 className="card-title mb-3">Code promo</h6>
                                    {codePromo ? (
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <span className="badge bg-success me-2">
                                                    Code appliqué
                                                </span>
                                                <strong>{codePromo}</strong>
                                                <span className="text-success ms-2">
                                                    -{reduction.toFixed(2)} xof
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={handleSupprimerCodePromo}
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="row g-2">
                                            <div className="col">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Entrez votre code promo"
                                                    value={codePromoInput}
                                                    onChange={e =>
                                                        setCodePromoInput(
                                                            e.target.value.toUpperCase()
                                                        )
                                                    }
                                                    onKeyPress={e =>
                                                        e.key === 'Enter' &&
                                                        handleAppliquerCodePromo()
                                                    }
                                                />
                                            </div>
                                            <div className="col-auto">
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={handleAppliquerCodePromo}
                                                    disabled={
                                                        applicationCodePromo ||
                                                        !codePromoInput.trim()
                                                    }
                                                >
                                                    {applicationCodePromo ? (
                                                        <>
                                                            <span
                                                                className="spinner-border spinner-border-sm me-2"
                                                                role="status"
                                                            ></span>
                                                            Application...
                                                        </>
                                                    ) : (
                                                        'Appliquer'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="col-lg-4">
                        <div className="recapitulatif-commande card sticky-top">
                            <div className="card-header bg-light">
                                <h5 className="mb-0">Récapitulatif</h5>
                            </div>

                            <div className="card-body">
                                {/* Sous-total */}
                                <div className="d-flex justify-content-between mb-2">
                                    <span>
                                        Sous-total ({nombreArticles} article
                                        {nombreArticles > 1 ? 's' : ''})
                                    </span>
                                    <span>{sousTotal.toFixed(2)} €</span>
                                </div>

                                {/* Réduction */}
                                {reduction > 0 && (
                                    <div className="d-flex justify-content-between mb-2 text-success">
                                        <span>Réduction</span>
                                        <span>-{reduction.toFixed(2)} €</span>
                                    </div>
                                )}

                                {/* Livraison */}
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Livraison</span>
                                    <span className="text-success">Gratuite</span>
                                </div>

                                {/* Total */}
                                <div className="d-flex justify-content-between mb-3 fw-bold fs-5 border-top pt-3">
                                    <span>Total</span>
                                    <span className="text-primary">{total.toFixed(2)} xof</span>
                                </div>

                                {/* Bouton commander */}
                                <button
                                    className="btn btn-primary btn-lg w-100 mb-3"
                                    onClick={handleCommander}
                                >
                                    <i className="bi bi-credit-card me-2"></i>
                                    Commander maintenant
                                </button>

                                {/* Paiement sécurisé */}
                                <div className="text-center">
                                    <small className="text-muted">
                                        <i className="bi bi-shield-check me-1"></i>
                                        Paiement 100% sécurisé
                                    </small>
                                </div>
                            </div>
                        </div>

                        {/* Services */}
                        <div className="services-panier mt-4">
                            <div className="card">
                                <div className="card-body">
                                    <h6 className="card-title mb-3">Nos services</h6>

                                    <div className="service-item d-flex align-items-center mb-3">
                                        <i className="bi bi-truck text-primary me-3 fs-4"></i>
                                        <div>
                                            <div className="fw-semibold">Livraison gratuite</div>
                                            <small className="text-muted">
                                                Dès 50.000 xof d'achat
                                            </small>
                                        </div>
                                    </div>

                                    <div className="service-item d-flex align-items-center mb-3">
                                        <i className="bi bi-arrow-left-right text-primary me-3 fs-4"></i>
                                        <div>
                                            <div className="fw-semibold">Retours faciles</div>
                                            <small className="text-muted">Sous 30 jours</small>
                                        </div>
                                    </div>

                                    <div className="service-item d-flex align-items-center">
                                        <i className="bi bi-headset text-primary me-3 fs-4"></i>
                                        <div>
                                            <div className="fw-semibold">Support client</div>
                                            <small className="text-muted">7j/7 de 9h à 20h</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Produits recommandés */}
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4>Vous aimerez aussi</h4>
                            <Link to="/boutique" className="btn btn-outline-primary">
                                Voir plus
                            </Link>
                        </div>

                        <div className="row g-3">
                            {/* Placeholder pour les produits recommandés */}
                            <div className="col-6 col-md-3">
                                <div className="card produit-recommande text-center">
                                    <div className="card-body">
                                        <div className="text-muted mb-2">
                                            <i className="bi bi-arrow-repeat fs-1"></i>
                                        </div>
                                        <small className="text-muted">Produits recommandés</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 col-md-3">
                                <div className="card produit-recommande text-center">
                                    <div className="card-body">
                                        <div className="text-muted mb-2">
                                            <i className="bi bi-arrow-repeat fs-1"></i>
                                        </div>
                                        <small className="text-muted">à venir</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 col-md-3">
                                <div className="card produit-recommande text-center">
                                    <div className="card-body">
                                        <div className="text-muted mb-2">
                                            <i className="bi bi-arrow-repeat fs-1"></i>
                                        </div>
                                        <small className="text-muted">dans la</small>
                                    </div>
                                </div>
                            </div>

                            <div className="col-6 col-md-3">
                                <div className="card produit-recommande text-center">
                                    <div className="card-body">
                                        <div className="text-muted mb-2">
                                            <i className="bi bi-arrow-repeat fs-1"></i>
                                        </div>
                                        <small className="text-muted">prochaine étape</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Panier;
