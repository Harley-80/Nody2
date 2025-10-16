import React from 'react';
import { Link } from 'react-router-dom';
import './PromotionBanner.scss';

const PromotionBanner = ({
    titre,
    sousTitre,
    texteLien,
    lien,
    fond = 'primary',
    avecCompteur = false,
}) => {
    const classesFond = {
        primary: 'bg-primary text-white',
        gradient: 'bg-gradient text-white',
        dark: 'bg-dark text-white',
        light: 'bg-light text-dark',
    };

    return (
        <div className={`promotion-banner ${classesFond[fond]}`}>
            <div className="container">
                <div className="row align-items-center py-4">
                    <div className="col-md-8">
                        <div className="banner-content">
                            <h3 className="banner-title fw-bold mb-2">{titre}</h3>
                            {sousTitre && (
                                <p className="banner-subtitle mb-0 opacity-90">{sousTitre}</p>
                            )}
                        </div>
                    </div>

                    <div className="col-md-4 text-md-end">
                        <Link to={lien} className="btn btn-outline-light btn-lg">
                            {texteLien}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromotionBanner;
