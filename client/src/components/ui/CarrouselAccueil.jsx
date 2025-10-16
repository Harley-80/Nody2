import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProduitCard from '../produits/ProduitCard.jsx';
import './CarrouselAccueil.scss';

const CarrouselAccueil = ({ produits, titre, sousTitre, voirPlusLink }) => {
    const [slideActif, setSlideActif] = useState(0);
    const [produitsParSlide, setProduitsParSlide] = useState(4);
    const carrouselRef = useRef(null);

    useEffect(() => {
        const mettreAJourProduitsParSlide = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setProduitsParSlide(1);
            } else if (width < 992) {
                setProduitsParSlide(2);
            } else if (width < 1200) {
                setProduitsParSlide(3);
            } else {
                setProduitsParSlide(4);
            }
        };

        mettreAJourProduitsParSlide();
        window.addEventListener('resize', mettreAJourProduitsParSlide);

        return () => {
            window.removeEventListener('resize', mettreAJourProduitsParSlide);
        };
    }, []);

    if (!produits || produits.length === 0) {
        return null;
    }

    const totalSlides = Math.ceil(produits.length / produitsParSlide);
    const groupesProduits = [];

    for (let i = 0; i < produits.length; i += produitsParSlide) {
        groupesProduits.push(produits.slice(i, i + produitsParSlide));
    }

    const allerSlideSuivante = () => {
        setSlideActif(prev => (prev + 1) % totalSlides);
    };

    const allerSlidePrecedente = () => {
        setSlideActif(prev => (prev - 1 + totalSlides) % totalSlides);
    };

    const allerSlideSpecifique = index => {
        setSlideActif(index);
    };

    return (
        <div className="carrousel-accueil">
            {/* En-tête */}
            {(titre || sousTitre) && (
                <div className="carrousel-header mb-5">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            {titre && <h2 className="display-5 fw-bold mb-2">{titre}</h2>}
                            {sousTitre && <p className="lead text-muted mb-0">{sousTitre}</p>}
                        </div>
                        {voirPlusLink && (
                            <div className="col-md-4 text-md-end">
                                <Link to={voirPlusLink} className="btn btn-outline-primary">
                                    Voir tout
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Carrousel */}
            <div className="carrousel-container position-relative">
                <div
                    ref={carrouselRef}
                    className="carrousel-track d-flex transition-all"
                    style={{ transform: `translateX(-${slideActif * 100}%)` }}
                >
                    {groupesProduits.map((groupe, index) => (
                        <div key={index} className="carrousel-slide flex-shrink-0 w-100">
                            <div className="row g-4">
                                {groupe.map(produit => (
                                    <div
                                        key={produit._id}
                                        className={`col-${12 / produitsParSlide}`}
                                    >
                                        <ProduitCard produit={produit} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contrôles de navigation */}
                {totalSlides > 1 && (
                    <>
                        <button
                            className="carrousel-btn carrousel-btn-prev"
                            onClick={allerSlidePrecedente}
                            disabled={slideActif === 0}
                            aria-label="Slide précédent"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        <button
                            className="carrousel-btn carrousel-btn-next"
                            onClick={allerSlideSuivante}
                            disabled={slideActif === totalSlides - 1}
                            aria-label="Slide suivant"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </>
                )}

                {/* Indicateurs */}
                {totalSlides > 1 && (
                    <div className="carrousel-indicators mt-4">
                        {groupesProduits.map((_, index) => (
                            <button
                                key={index}
                                className={`indicator ${index === slideActif ? 'active' : ''}`}
                                onClick={() => allerSlideSpecifique(index)}
                                aria-label={`Aller au slide ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarrouselAccueil;
