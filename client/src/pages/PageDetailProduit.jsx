import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduits } from '../contexts/ProduitsContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import ProduitCard from '../components/produits/ProduitCard.jsx';
import './PageDetailProduit.scss';

// constante pour la Page de détail d'un produit
const PageDetailProduit = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { produit, chargerProduit, produitsSimilaires, chargerProduits } = useProduits();
    const { ajouterAuPanier } = useCart();
    const { estAuthentifie } = useAuth();
    const { showToast } = useToast();

    const [quantite, setQuantite] = useState(1);
    const [tailleSelectionnee, setTailleSelectionnee] = useState('');
    const [couleurSelectionnee, setCouleurSelectionnee] = useState('');
    const [imageActive, setImageActive] = useState(0);
    const [avisAffiches, setAvisAffiches] = useState(3);
    const [nouvelAvis, setNouvelAvis] = useState({ note: 5, commentaire: '' });

    // Charger les produits similaires lorsque le produit est chargé
    useEffect(() => {
        if (slug) {
            chargerProduit(slug, true);
        }
    }, [slug]);

    useEffect(() => {
        if (produit && produit.variantes && produit.variantes.length > 0) {
            const premiereVariante = produit.variantes.find(v => v.estActive && v.quantite > 0);
            if (premiereVariante) {
                setTailleSelectionnee(premiereVariante.taille);
                setCouleurSelectionnee(premiereVariante.couleur);
            }
        }
    }, [produit]);

    if (!produit) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-3">Chargement du produit...</p>
                </div>
            </div>
        );
    }

    // Données du produit
    const {
        _id,
        nom,
        description,
        descriptionCourte,
        images,
        categorie,
        marque,
        variantes,
        noteMoyenne,
        nombreAvis,
        avis,
        prixMin,
        prixMax,
        estEnPromotion,
        pourcentagePromo,
        estNouveau,
        estPopulaire,
        caracteristiques,
    } = produit;

    // Trouver la variante sélectionnée
    const varianteSelectionnee = variantes?.find(
        v => v.taille === tailleSelectionnee && v.couleur === couleurSelectionnee && v.estActive
    );

    const prixActuel = varianteSelectionnee
        ? varianteSelectionnee.prixPromo || varianteSelectionnee.prix
        : estEnPromotion
          ? prixMin * (1 - pourcentagePromo / 100)
          : prixMin;

    const prixOriginal = varianteSelectionnee ? varianteSelectionnee.prix : prixMax;

    const enStock = varianteSelectionnee?.quantite > 0;
    const stockDisponible = varianteSelectionnee?.quantite || 0;

    // Options disponibles
    const taillesDisponibles = [
        ...new Set(
            variantes
                ?.filter(v => v.estActive && v.quantite > 0 && v.couleur === couleurSelectionnee)
                .map(v => v.taille)
        ),
    ];

    const couleursDisponibles = [
        ...new Set(
            variantes
                ?.filter(v => v.estActive && v.quantite > 0 && v.taille === tailleSelectionnee)
                .map(v => v.couleur)
        ),
    ];

    const handleAjouterPanier = async () => {
        if (!tailleSelectionnee || !couleurSelectionnee) {
            showToast('Veuillez sélectionner une taille et une couleur', 'warning');
            return;
        }

        if (!enStock) {
            showToast('Ce produit est en rupture de stock', 'error');
            return;
        }

        const resultat = await ajouterAuPanier(produit, varianteSelectionnee, quantite);

        if (resultat.success) {
            showToast(`${quantite} ${nom} ajouté${quantite > 1 ? 's' : ''} au panier`, 'success');
        }
    };

    const handleAcheterMaintenant = async () => {
        const resultat = await handleAjouterPanier();
        if (resultat?.success) {
            navigate('/panier');
        }
    };

    const handleSoumettreAvis = async e => {
        e.preventDefault();

        if (!estAuthentifie) {
            showToast('Connectez-vous pour ajouter un avis', 'warning');
            navigate('/connexion');
            return;
        }

        // Ici, on appellerait l'API pour ajouter l'avis
        showToast('Fonctionnalité à implémenter', 'info');
        setNouvelAvis({ note: 5, commentaire: '' });
    };

    const avisTries = [...(avis || [])].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return (
        <div className="page-detail-produit">
            <div className="container py-5">
                {/* Fil d'Ariane */}
                <nav aria-label="Fil d'Ariane" className="mb-4">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link to="/">Accueil</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link to="/boutique">Boutique</Link>
                        </li>
                        {categorie && (
                            <li className="breadcrumb-item">
                                <Link to={`/categories/${categorie.slug}`}>{categorie.nom}</Link>
                            </li>
                        )}
                        <li className="breadcrumb-item active" aria-current="page">
                            {nom}
                        </li>
                    </ol>
                </nav>

                <div className="row">
                    {/* Galerie d'images */}
                    <div className="col-lg-6">
                        <div className="produit-galerie">
                            <div className="image-principale mb-3">
                                <div className="ratio ratio-1x1 bg-light rounded">
                                    <img
                                        src={
                                            images?.[imageActive] ||
                                            '/images/placeholder-produit.jpg'
                                        }
                                        alt={nom}
                                        className="img-fluid rounded"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>

                                {/* Badges */}
                                <div className="badges-container position-absolute top-0 start-0 p-3">
                                    {estNouveau && (
                                        <span className="badge bg-success me-2">Nouveau</span>
                                    )}
                                    {estEnPromotion && (
                                        <span className="badge bg-danger me-2">
                                            -{pourcentagePromo}%
                                        </span>
                                    )}
                                    {estPopulaire && (
                                        <span className="badge bg-warning text-dark">
                                            Populaire
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Miniatures */}
                            {images && images.length > 1 && (
                                <div className="miniatures d-flex gap-2">
                                    {images.map((image, index) => (
                                        <button
                                            key={index}
                                            className={`thumbnail ${index === imageActive ? 'active' : ''}`}
                                            onClick={() => setImageActive(index)}
                                        >
                                            <div className="ratio ratio-1x1">
                                                <img
                                                    src={image}
                                                    alt={`${nom} vue ${index + 1}`}
                                                    className="img-fluid rounded"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informations produit */}
                    <div className="col-lg-6">
                        <div className="produit-info">
                            <h1 className="produit-titre display-5 fw-bold mb-3">{nom}</h1>

                            {/* Marque */}
                            {marque && (
                                <p className="produit-marque text-muted mb-3">
                                    Marque: <strong>{marque}</strong>
                                </p>
                            )}

                            {/* Avis */}
                            <div className="produit-notation mb-3">
                                <div className="d-flex align-items-center">
                                    <div className="notation me-2">
                                        {[1, 2, 3, 4, 5].map(etoile => (
                                            <i
                                                key={etoile}
                                                className={`bi bi-star${etoile <= noteMoyenne ? '-fill' : ''} text-warning`}
                                            ></i>
                                        ))}
                                    </div>
                                    <span className="note-moyenne fw-semibold me-2">
                                        {noteMoyenne.toFixed(1)}
                                    </span>
                                    <span className="text-muted">({nombreAvis} avis)</span>
                                </div>
                            </div>

                            {/* Prix */}
                            <div className="produit-prix mb-4">
                                <span className="prix-actuel display-6 fw-bold text-primary me-3">
                                    {prixActuel.toFixed(2)} xof
                                </span>
                                {estEnPromotion && prixOriginal > prixActuel && (
                                    <span className="prix-original text-muted text-decoration-line-through fs-5">
                                        {prixOriginal.toFixed(2)} €
                                    </span>
                                )}
                            </div>

                            {/* Description courte */}
                            {descriptionCourte && (
                                <p className="produit-description-courte lead mb-4">
                                    {descriptionCourte}
                                </p>
                            )}

                            {/* Sélection des variantes */}
                            <div className="variantes-selection mb-4">
                                {/* Sélection de la taille */}
                                {taillesDisponibles.length > 0 && (
                                    <div className="taille-selection mb-3">
                                        <label className="form-label fw-semibold">
                                            Taille:{' '}
                                            <span className="text-primary">
                                                {tailleSelectionnee}
                                            </span>
                                        </label>
                                        <div className="tailles-boutons d-flex flex-wrap gap-2">
                                            {taillesDisponibles.map(taille => (
                                                <button
                                                    key={taille}
                                                    className={`btn ${taille === tailleSelectionnee ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setTailleSelectionnee(taille)}
                                                >
                                                    {taille}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sélection de la couleur */}
                                {couleursDisponibles.length > 0 && (
                                    <div className="couleur-selection mb-3">
                                        <label className="form-label fw-semibold">
                                            Couleur:{' '}
                                            <span className="text-primary">
                                                {couleurSelectionnee}
                                            </span>
                                        </label>
                                        <div className="couleurs-boutons d-flex flex-wrap gap-2">
                                            {couleursDisponibles.map(couleur => (
                                                <button
                                                    key={couleur}
                                                    className={`btn ${couleur === couleurSelectionnee ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setCouleurSelectionnee(couleur)}
                                                >
                                                    {couleur}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="stock-info mb-4">
                                {enStock ? (
                                    <div className="text-success">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        {stockDisponible > 10
                                            ? 'En stock'
                                            : `Il ne reste que ${stockDisponible} exemplaire${stockDisponible > 1 ? 's' : ''}`}
                                    </div>
                                ) : (
                                    <div className="text-danger">
                                        <i className="bi bi-x-circle-fill me-2"></i>
                                        Rupture de stock
                                    </div>
                                )}
                            </div>

                            {/* Quantité et actions */}
                            <div className="produit-actions">
                                <div className="row g-3 align-items-center">
                                    <div className="col-auto">
                                        <label className="form-label fw-semibold">Quantité:</label>
                                    </div>
                                    <div className="col-auto">
                                        <div
                                            className="quantite-selector input-group"
                                            style={{ width: '140px' }}
                                        >
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() =>
                                                    setQuantite(Math.max(1, quantite - 1))
                                                }
                                                disabled={quantite <= 1}
                                            >
                                                <i className="bi bi-dash"></i>
                                            </button>
                                            <input
                                                type="number"
                                                className="form-control text-center"
                                                value={quantite}
                                                min="1"
                                                max={stockDisponible}
                                                onChange={e =>
                                                    setQuantite(
                                                        Math.max(
                                                            1,
                                                            Math.min(
                                                                stockDisponible,
                                                                parseInt(e.target.value) || 1
                                                            )
                                                        )
                                                    )
                                                }
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() =>
                                                    setQuantite(
                                                        Math.min(stockDisponible, quantite + 1)
                                                    )
                                                }
                                                disabled={quantite >= stockDisponible}
                                            >
                                                <i className="bi bi-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="d-grid gap-2 d-md-flex">
                                            <button
                                                className="btn btn-primary btn-lg flex-fill"
                                                onClick={handleAjouterPanier}
                                                disabled={!enStock}
                                            >
                                                <i className="bi bi-cart-plus me-2"></i>
                                                Ajouter au panier
                                            </button>
                                            <button
                                                className="btn btn-success btn-lg flex-fill"
                                                onClick={handleAcheterMaintenant}
                                                disabled={!enStock}
                                            >
                                                Acheter maintenant
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Livraison et retours */}
                            <div className="livraison-info mt-4 p-3 bg-light rounded">
                                <div className="row text-center g-3">
                                    <div className="col-4">
                                        <i className="bi bi-truck text-primary fs-4 d-block mb-2"></i>
                                        <small className="text-muted">
                                            Livraison gratuite dès 50€
                                        </small>
                                    </div>
                                    <div className="col-4">
                                        <i className="bi bi-arrow-left-right text-primary fs-4 d-block mb-2"></i>
                                        <small className="text-muted">Retours sous 30 jours</small>
                                    </div>
                                    <div className="col-4">
                                        <i className="bi bi-shield-check text-primary fs-4 d-block mb-2"></i>
                                        <small className="text-muted">Paiement sécurisé</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description détaillée et caractéristiques */}
                <div className="row mt-5">
                    <div className="col-12">
                        <div className="produit-details">
                            <ul className="nav nav-tabs" id="produitTabs" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button
                                        className="nav-link active"
                                        id="description-tab"
                                        data-bs-toggle="tab"
                                        data-bs-target="#description"
                                        type="button"
                                        role="tab"
                                    >
                                        Description
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className="nav-link"
                                        id="caracteristiques-tab"
                                        data-bs-toggle="tab"
                                        data-bs-target="#caracteristiques"
                                        type="button"
                                        role="tab"
                                    >
                                        Caractéristiques
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button
                                        className="nav-link"
                                        id="avis-tab"
                                        data-bs-toggle="tab"
                                        data-bs-target="#avis"
                                        type="button"
                                        role="tab"
                                    >
                                        Avis ({nombreAvis})
                                    </button>
                                </li>
                            </ul>

                            <div className="tab-content p-4 border border-top-0 rounded-bottom">
                                {/* Description */}
                                <div
                                    className="tab-pane fade show active"
                                    id="description"
                                    role="tabpanel"
                                >
                                    <div className="description-content">
                                        {description ? (
                                            <div
                                                dangerouslySetInnerHTML={{ __html: description }}
                                            />
                                        ) : (
                                            <p className="text-muted">
                                                Aucune description disponible.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Caractéristiques */}
                                <div
                                    className="tab-pane fade"
                                    id="caracteristiques"
                                    role="tabpanel"
                                >
                                    {caracteristiques && caracteristiques.length > 0 ? (
                                        <div className="caracteristiques-list">
                                            {caracteristiques.map((carac, index) => (
                                                <div key={index} className="row border-bottom py-2">
                                                    <div className="col-md-4 fw-semibold">
                                                        {carac.nom}
                                                    </div>
                                                    <div className="col-md-8">{carac.valeur}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted">
                                            Aucune caractéristique disponible.
                                        </p>
                                    )}
                                </div>

                                {/* Avis */}
                                <div className="tab-pane fade" id="avis" role="tabpanel">
                                    <div className="avis-section">
                                        {/* Résumé des avis */}
                                        <div className="avis-resume row mb-5">
                                            <div className="col-md-4 text-center">
                                                <div className="note-globale display-4 fw-bold text-primary">
                                                    {noteMoyenne.toFixed(1)}
                                                </div>
                                                <div className="notation mb-2">
                                                    {[1, 2, 3, 4, 5].map(etoile => (
                                                        <i
                                                            key={etoile}
                                                            className={`bi bi-star${etoile <= noteMoyenne ? '-fill' : ''} text-warning`}
                                                        ></i>
                                                    ))}
                                                </div>
                                                <p className="text-muted">
                                                    Basé sur {nombreAvis} avis
                                                </p>
                                            </div>
                                        </div>

                                        {/* Formulaire d'avis */}
                                        {estAuthentifie && (
                                            <div className="avis-formulaire mb-5">
                                                <h5>Donnez votre avis</h5>
                                                <form onSubmit={handleSoumettreAvis}>
                                                    <div className="mb-3">
                                                        <label className="form-label">Note</label>
                                                        <div className="notation-selection">
                                                            {[1, 2, 3, 4, 5].map(etoile => (
                                                                <button
                                                                    key={etoile}
                                                                    type="button"
                                                                    className="btn btn-link p-0 me-1"
                                                                    onClick={() =>
                                                                        setNouvelAvis(prev => ({
                                                                            ...prev,
                                                                            note: etoile,
                                                                        }))
                                                                    }
                                                                >
                                                                    <i
                                                                        className={`bi bi-star${etoile <= nouvelAvis.note ? '-fill' : ''} text-warning fs-3`}
                                                                    ></i>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="mb-3">
                                                        <label className="form-label">
                                                            Commentaire
                                                        </label>
                                                        <textarea
                                                            className="form-control"
                                                            rows="4"
                                                            value={nouvelAvis.commentaire}
                                                            onChange={e =>
                                                                setNouvelAvis(prev => ({
                                                                    ...prev,
                                                                    commentaire: e.target.value,
                                                                }))
                                                            }
                                                            placeholder="Partagez votre expérience avec ce produit..."
                                                        ></textarea>
                                                    </div>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                    >
                                                        Publier mon avis
                                                    </button>
                                                </form>
                                            </div>
                                        )}

                                        {/* Liste des avis */}
                                        <div className="avis-liste">
                                            <h5 className="mb-4">Avis des clients</h5>
                                            {avisTries.length > 0 ? (
                                                <>
                                                    {avisTries
                                                        .slice(0, avisAffiches)
                                                        .map(avisItem => (
                                                            <div
                                                                key={avisItem._id}
                                                                className="avis-item border-bottom pb-4 mb-4"
                                                            >
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div>
                                                                        <strong className="d-block">
                                                                            {avisItem.utilisateur
                                                                                ?.prenom ||
                                                                                'Utilisateur'}
                                                                        </strong>
                                                                        <div className="notation">
                                                                            {[1, 2, 3, 4, 5].map(
                                                                                etoile => (
                                                                                    <i
                                                                                        key={etoile}
                                                                                        className={`bi bi-star${etoile <= avisItem.note ? '-fill' : ''} text-warning`}
                                                                                    ></i>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <small className="text-muted">
                                                                        {new Date(
                                                                            avisItem.createdAt
                                                                        ).toLocaleDateString(
                                                                            'fr-FR'
                                                                        )}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-0">
                                                                    {avisItem.commentaire}
                                                                </p>
                                                            </div>
                                                        ))}

                                                    {avisTries.length > avisAffiches && (
                                                        <div className="text-center">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={() =>
                                                                    setAvisAffiches(
                                                                        prev => prev + 5
                                                                    )
                                                                }
                                                            >
                                                                Voir plus d'avis
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-muted">
                                                    Aucun avis pour le moment.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Produits similaires */}
                {produitsSimilaires && produitsSimilaires.length > 0 && (
                    <div className="row mt-5">
                        <div className="col-12">
                            <h3 className="mb-4">Produits similaires</h3>
                            <div className="row g-4">
                                {produitsSimilaires.map(produitSimilaire => (
                                    <div
                                        key={produitSimilaire._id}
                                        className="col-sm-6 col-md-4 col-lg-3"
                                    >
                                        <ProduitCard produit={produitSimilaire} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PageDetailProduit;
