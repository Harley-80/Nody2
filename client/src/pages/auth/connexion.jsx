import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Auth.scss';

// Composant pour la page de connexion
const Connexion = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    // Contexte d'authentification et traduction
    const { login } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // Gestion des changements dans les champs du formulaire
    const handleChange = e => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    // Gestion de la soumission du formulaire
    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);

        // Tenter de se connecter avec les données du formulaire
        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                navigate(from, { replace: true });
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
        } finally {
            setLoading(false);
        }
    };

    // Rendu du composant Connexion
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">{t('nav.login')}</h1>
                        <p className="auth-subtitle">Content de vous revoir !</p>
                    </div>
                    {/* Formulaire de connexion */}
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                {t('auth.email')}
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="votre@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                {t('auth.password')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-control"
                                placeholder="Votre mot de passe"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-options">
                            <div className="remember-me">
                                <input type="checkbox" id="remember" />
                                <label htmlFor="remember">Se souvenir de moi</label>
                            </div>
                            <Link to="/mot-de-passe-oublie" className="forgot-password">
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary auth-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Connexion...
                                </>
                            ) : (
                                t('nav.login')
                            )}
                        </button>
                    </form>

                    {/* Pied de page avec lien vers l'inscription */}
                    <div className="auth-footer">
                        <p className="auth-switch">
                            {t('auth.noAccount')}{' '}
                            <Link to="/inscription" className="auth-link">
                                {t('nav.register')}
                            </Link>
                        </p>
                    </div>

                    <div className="auth-divider">
                        <span>Ou continuer avec</span>
                    </div>

                    {/* Connexion via les réseaux sociaux */}
                    <div className="social-auth">
                        <button className="btn btn-outline social-btn">
                            <i className="fab fa-google"></i>
                            Google
                        </button>
                        <button className="btn btn-outline social-btn">
                            <i className="fab fa-facebook-f"></i>
                            Facebook
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Connexion;
