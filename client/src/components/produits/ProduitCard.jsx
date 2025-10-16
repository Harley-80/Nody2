import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

const ProduitCard = ({ produit }) => {
    const [imageChargee, setImageChargee] = useState(false);
    const [imageErreur, setImageErreur] = useState(false);
    const { ajouterAuPanier } = useCart();
    const { estAuthentifie } = useAuth();
    const { showToast } = useToast();

    if (!produit) {
        return null;
    }

    const {
        _id,
        nom,
        images,
        prixMin,
        prixMax,
        estEnPromotion,
        pourcentagePromo,
        estNouveau,
        estPopulaire,
        slug,
        noteMoyenne,
        nombreAvis,
        variantes,
    } = produit;

    const imagePrincipale = images?.[0] || '/images/placeholder-produit.jpg';
    const prixAffichage = estEnPromotion ? prixMin * (1 - pourcentagePromo / 100) : prixMin;
    const aVariantes = variantes && variantes.length > 0;

    const handleAjouterPanier = async e => {
        e.preventDefault();
        e.stopPropagation();

        if (!aVariantes) {
            showToast("Ce produit n'est pas disponible pour le moment", 'warning');
            return;
        }

        // Prendre la première variante disponible
        const premiereVariante = variantes.find(v => v.estActive && v.quantite > 0);

        if (!premiereVariante) {
            showToast('Produit en rupture de stock', 'warning');
            return;
        }

        const resultat = await ajouterAuPanier(produit, premiereVariante, 1);

        if (resultat.success) {
            showToast(`${nom} ajouté au panier`, 'success');
        }
    };

    const handleImageLoad = () => {
        setImageChargee(true);
    };

    const handleImageError = () => {
        setImageErreur(true);
        setImageChargee(true);
    };

    return (
        <div className="carte-produit h-100">
            <div className="carte-produit__image position-relative overflow-hidden">
                <Link to={`/produit/${slug}`} className="text-decoration-none">
                    <div className="ratio ratio-4x3">
                        {!imageChargee && (
                            <div className="skeleton-image placeholder-glow">
                                <div className="placeholder w-100 h-100"></div>
                            </div>
                        )}
                        <img
                            src={imageErreur ? '/images/placeholder-produit.jpg' : imagePrincipale}
                            alt={nom}
                            className={`card-img-top ${imageChargee ? 'loaded' : 'loading'} transition-all`}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>
                </Link>

                {/* Badges */}
                <div className="carte-produit__badges position-absolute top-0 start-0 p-2">
                    {estNouveau && (
                        <span className="carte-produit__badge carte-produit__badge--new me-1">
                            Nouveau
                        </span>
                    )}
                    {estEnPromotion && (
                        <span className="carte-produit__badge carte-produit__badge--sale">
                            -{pourcentagePromo}%
                        </span>
                    )}
                    {estPopulaire && (
                        <span className="carte-produit__badge carte-produit__badge--popular me-1">
                            Populaire
                        </span>
                    )}
                </div>

                {/* Actions rapides */}
                <div className="carte-produit__actions position-absolute top-0 end-0 p-2">
                    <button
                        className="btn-action me-1"
                        onClick={handleAjouterPanier}
                        disabled={!aVariantes}
                        title="Ajouter au panier"
                    >
                        <i className="bi bi-cart-plus"></i>
                    </button>
                    <button className="btn-action" title="Ajouter aux favoris">
                        <i className="bi bi-heart"></i>
                    </button>
                </div>
            </div>

            <div className="carte-produit__content p-3">
                <Link to={`/produit/${slug}`} className="text-decoration-none text-dark">
                    <h3 className="carte-produit__title h5 fw-semibold mb-2">{nom}</h3>
                </Link>

                {/* Avis */}
                {noteMoyenne > 0 && (
                    <div className="d-flex align-items-center mb-2">
                        <div className="notation me-2">
                            {[1, 2, 3, 4, 5].map(etoile => (
                                <i
                                    key={etoile}
                                    className={`bi bi-star${etoile <= noteMoyenne ? '-fill' : ''} text-warning`}
                                    style={{ fontSize: '0.875rem' }}
                                ></i>
                            ))}
                        </div>
                        <small className="text-muted">({nombreAvis})</small>
                    </div>
                )}

                {/* Prix */}
                <div className="carte-produit__price mb-3">
                    <span className="carte-produit__price--current fs-5 fw-bold text-primary">
                        {prixAffichage.toFixed(2)} €
                    </span>
                    {estEnPromotion && prixMax > prixAffichage && (
                        <span className="carte-produit__price--original text-muted text-decoration-line-through ms-2">
                            {prixMax.toFixed(2)} €
                        </span>
                    )}
                </div>

                {/* Variantes disponibles */}
                {aVariantes && (
                    <div className="carte-produit__variantes">
                        <small className="text-muted">
                            {variantes.filter(v => v.estActive).length} options disponibles
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProduitCard;
