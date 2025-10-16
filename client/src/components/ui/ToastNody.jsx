// src/components/ui/ToastNody.jsx

import React from 'react';
import './ToastNody.scss'; // Importation du style SASS

// Exportation nommée (export const) requise par le Context
export const ToastNody = ({ position = 'top-right', children }) => {
    // Si la console est ouverte, vous devriez voir ce message
    console.log('ToastNody est rendu temporairement.');

    // Composant toast minimal pour éviter l'erreur
    return <div className={`toast-container ${position}`}>{children}</div>;
};
