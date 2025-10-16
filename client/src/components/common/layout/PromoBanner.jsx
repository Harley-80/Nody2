import React, { useState } from 'react';
import './PromoBanner.scss';

const PromoBanner = () => {
    const [estVisible, setEstVisible] = useState(true);

    if (!estVisible) {
        return null;
    }

    return (
        <div className="promo-banner bg-primary text-white">
            <div className="container">
                <div className="row align-items-center py-2">
                    <div className="col text-center">
                        <small className="fw-medium">
                            Livraison gratuite dès 50.000 xof d'achat | Retours gratuits sous 30
                            jours
                        </small>
                    </div>
                    <div className="col-auto">
                        <button
                            className="btn-close btn-close-white"
                            onClick={() => setEstVisible(false)}
                            aria-label="Fermer"
                        ></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoBanner;
