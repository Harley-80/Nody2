import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CarrouselHero.scss';

const CarrouselHero = () => {
    const [slideActif, setSlideActif] = useState(0);

    const slides = [
        {
            id: 1,
            image: '/src/assets/images/slide1.jpeg',
            titre: 'Nouvelle Collection Été',
            sousTitre: 'Découvrez les dernières tendances de la saison',
            texteBouton: 'Découvrir',
            lienBouton: '/nouveautes',
            couleurTexte: 'text-white',
        },
        {
            id: 2,
            image: '/src/assets/images/slide2.jpeg',
            titre: 'Soldes Exceptionnelles',
            sousTitre: "Jusqu'à -50% sur toute la collection",
            texteBouton: 'Profiter des soldes',
            lienBouton: '/boutique?promo=true',
            couleurTexte: 'text-dark',
        },
        {
            id: 3,
            image: '/src/assets/images/slide3.jpeg',
            titre: 'Livraison Offerte',
            sousTitre: "Livraison gratuite dès 50€ d'achat",
            texteBouton: 'Voir les conditions',
            lienBouton: '/livraison',
            couleurTexte: 'text-white',
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setSlideActif(prev => (prev + 1) % slides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [slides.length]);

    const allerSlideSuivante = () => {
        setSlideActif(prev => (prev + 1) % slides.length);
    };

    const allerSlidePrecedente = () => {
        setSlideActif(prev => (prev - 1 + slides.length) % slides.length);
    };

    const allerSlideSpecifique = index => {
        setSlideActif(index);
    };

    return (
        <div className="carrousel-hero">
            <div className="carrousel-container position-relative overflow-hidden">
                <div
                    className="carrousel-track d-flex transition-all"
                    style={{ transform: `translateX(-${slideActif * 100}%)` }}
                >
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className="carrousel-slide flex-shrink-0 w-100 position-relative"
                        >
                            <div
                                className="slide-background"
                                style={{ backgroundImage: `url(${slide.image})` }}
                            ></div>

                            <div className="slide-overlay"></div>

                            <div className="container">
                                <div className="row align-items-center min-vh-80">
                                    <div className="col-lg-6">
                                        <div className={`slide-content ${slide.couleurTexte}`}>
                                            <h1 className="display-3 fw-bold mb-4 animate-fade-in">
                                                {slide.titre}
                                            </h1>
                                            <p className="lead mb-5 animate-fade-in delay-1">
                                                {slide.sousTitre}
                                            </p>
                                            <Link
                                                to={slide.lienBouton}
                                                className="btn btn-primary btn-lg px-5 py-3 animate-fade-in delay-2"
                                            >
                                                {slide.texteBouton}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contrôles de navigation */}
                <button
                    className="carrousel-btn carrousel-btn-prev"
                    onClick={allerSlidePrecedente}
                    aria-label="Slide précédent"
                >
                    <i className="bi bi-chevron-left"></i>
                </button>

                <button
                    className="carrousel-btn carrousel-btn-next"
                    onClick={allerSlideSuivante}
                    aria-label="Slide suivant"
                >
                    <i className="bi bi-chevron-right"></i>
                </button>

                {/* Indicateurs */}
                <div className="carrousel-indicators">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === slideActif ? 'active' : ''}`}
                            onClick={() => allerSlideSpecifique(index)}
                            aria-label={`Aller au slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CarrouselHero;
