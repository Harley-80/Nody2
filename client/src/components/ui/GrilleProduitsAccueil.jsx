import React from 'react';
import { Link } from 'react-router-dom';
import ProduitCard from '../produits/ProduitCard.jsx';
import './GrilleProduitsAccueil.scss';

const GrilleProduitsAccueil = ({ produits, titre, sousTitre, voirPlusLink, limite = 8 }) => {
    const produitsAffiches = produits.slice(0, limite);

    if (!produitsAffiches.length) {
        return null;
    }

    return (
        <div className="grille-produits-accueil">
            {(titre || sousTitre) && (
                <div className="row mb-5">
                    <div className="col-12 text-center">
                        {titre && <h2 className="display-5 fw-bold mb-3">{titre}</h2>}
                        {sousTitre && <p className="lead text-muted">{sousTitre}</p>}
                    </div>
                </div>
            )}

            <div className="row g-4">
                {produitsAffiches.map(produit => (
                    <div key={produit._id} className="col-sm-6 col-md-4 col-lg-3">
                        <ProduitCard produit={produit} />
                    </div>
                ))}
            </div>

            {voirPlusLink && produits.length > limite && (
                <div className="row mt-5">
                    <div className="col-12 text-center">
                        <Link to={voirPlusLink} className="btn btn-outline-primary btn-lg">
                            Voir plus de produits
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GrilleProduitsAccueil;
