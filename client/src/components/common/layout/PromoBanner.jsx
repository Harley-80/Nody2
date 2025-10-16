// src/components/common/layout/PromoBanner.jsx

import React from 'react';
// Ne pas oublier d'importer le SCSS, même s'il est vide pour l'instant
import './PromoBanner.scss';

// Composant PromoBanner temporaire
const PromoBanner = () => {
    return (
        <div
            className="promo-banner"
            style={{ background: 'green', color: 'white', padding: '10px', textAlign: 'center' }}
        >
            [Bannière Promo Temporaire]
        </div>
    );
};

// Exportation par défaut (C'est ce que 'import PromoBanner from ...' attend)
export default PromoBanner;
