import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

const ProtectedRoute = ({ children, requireAdmin = false, requireVendeur = false }) => {
    const { estAuthentifie, estCharge, utilisateur } = useAuth();
    const location = useLocation();

    // Afficher un loader pendant la vérification
    if (estCharge) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: '50vh' }}
            >
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // Rediriger vers la page de connexion si non authentifié
    if (!estAuthentifie) {
        return <Navigate to="/connexion" state={{ from: location }} replace />;
    }

    // Vérifier les permissions admin
    if (requireAdmin && utilisateur?.role !== 'admin') {
        return (
            <div className="container text-center py-5">
                <div className="alert alert-danger">
                    <h4>Accès refusé</h4>
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    <a href="/" className="btn btn-primary">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    // Vérifier les permissions vendeur
    if (requireVendeur && !(utilisateur?.role === 'vendeur' || utilisateur?.role === 'admin')) {
        return (
            <div className="container text-center py-5">
                <div className="alert alert-danger">
                    <h4>Accès refusé</h4>
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    <a href="/" className="btn btn-primary">
                        Retour à l'accueil
                    </a>
                </div>
            </div>
        );
    }

    // Rendre les enfants si toutes les vérifications passent
    return children;
};

export default ProtectedRoute;
